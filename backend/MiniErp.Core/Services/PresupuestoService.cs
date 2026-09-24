using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;
using MiniErp.Core.Models;

namespace MiniErp.Core.Services;

public record Totales(decimal Subtotal, decimal Iva, decimal Total);

public class PresupuestoService
{
    private readonly AppDbContext _db;
    private readonly NumeracionService _numeracion;

    public PresupuestoService(AppDbContext db, NumeracionService numeracion)
    {
        _db = db;
        _numeracion = numeracion;
    }

    /// <summary>
    /// Calcula subtotal, IVA y total de un presupuesto. El descuento se aplica
    /// por linea antes del IVA. El IVA se calcula por linea segun AlicuotaIva
    /// y se redondea a 2 decimales antes de sumar.
    /// </summary>
    public Totales CalcularTotales(Presupuesto presupuesto)
    {
        decimal subtotal = 0m;
        decimal iva = 0m;
        foreach (var item in presupuesto.Items)
        {
            var subtotalLinea = SubtotalLinea(item);
            subtotal += subtotalLinea;
            iva += IvaLinea(subtotalLinea, item.AlicuotaIva);
        }

        return new Totales(subtotal, iva, subtotal + iva);
    }

    private static decimal SubtotalLinea(PresupuestoItem item)
        => item.Cantidad * item.PrecioUnitario * (1 - item.DescuentoPct / 100m);

    private static decimal IvaLinea(decimal subtotalLinea, decimal alicuotaIva)
        => Math.Round(subtotalLinea * alicuotaIva / 100m, 2, MidpointRounding.AwayFromZero);

    private static void ValidateItems(List<PresupuestoItem>? items)
    {
        if (items is null || items.Count == 0)
            throw new InvalidOperationException("El presupuesto debe tener al menos un item.");

        foreach (var item in items)
        {
            if (item.Cantidad <= 0)
                throw new InvalidOperationException("La cantidad debe ser mayor a cero.");

            if (item.DescuentoPct < 0m || item.DescuentoPct > 100m)
                throw new InvalidOperationException("El descuento debe estar entre 0 y 100.");
        }
    }

    public async Task<Presupuesto> CrearAsync(int clienteId, int validezDias, List<PresupuestoItem> items)
    {
        ValidateItems(items);

        foreach (var item in items)
        {
            var articulo = await _db.Articulos.FirstOrDefaultAsync(a => a.Id == item.ArticuloId)
                ?? throw new InvalidOperationException($"El articulo {item.ArticuloId} no existe.");

            // Tomamos precio y alicuota actuales del articulo como snapshot.
            item.PrecioUnitario = articulo.PrecioUnitario;
            item.AlicuotaIva = articulo.AlicuotaIva;
        }

        var presupuesto = new Presupuesto
        {
            Numero = await _numeracion.ProximoNumeroPresupuestoAsync(),
            Fecha = DateTime.UtcNow,
            ClienteId = clienteId,
            Estado = EstadoPresupuesto.Borrador,
            ValidezDias = validezDias,
            Items = items
        };

        _db.Presupuestos.Add(presupuesto);
        await _db.SaveChangesAsync();
        return presupuesto;
    }

    public async Task<Presupuesto?> ObtenerAsync(int id)
    {
        return await _db.Presupuestos
            .Include(p => p.Cliente)
            .Include(p => p.Items)
                .ThenInclude(i => i.Articulo)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<List<Presupuesto>> ListarAsync()
    {
        return await _db.Presupuestos
            .Include(p => p.Cliente)
            .Include(p => p.Items)
                .ThenInclude(i => i.Articulo)
            .Where(p => p.Estado != EstadoPresupuesto.Borrador)
            .OrderByDescending(p => p.Numero)
            .ToListAsync();
    }

    public async Task EliminarAsync(int id)
    {
        var presupuesto = await _db.Presupuestos.FindAsync(id);
        if (presupuesto is not null)
        {
            _db.Presupuestos.Remove(presupuesto);
            await _db.SaveChangesAsync();
        }
    }
}
