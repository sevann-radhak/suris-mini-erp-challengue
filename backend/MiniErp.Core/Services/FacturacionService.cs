using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;
using MiniErp.Core.Models;

namespace MiniErp.Core.Services;

public class FacturacionService
{
    private readonly AppDbContext _db;
    private readonly PresupuestoService _presupuestos;
    private readonly NumeracionService _numeracion;

    public FacturacionService(AppDbContext db,
        PresupuestoService presupuestos,
        NumeracionService numeracion)
    {
        _db = db;
        _presupuestos = presupuestos;
        _numeracion = numeracion;
    }

    public async Task<List<Factura>> ListarAsync()
    {
        return await _db.Facturas.OrderByDescending(factura => factura.Numero).ToListAsync();
    }

    public async Task<Factura> FacturarAsync(int presupuestoId)
    {
        Presupuesto presupuesto = await _db.Presupuestos
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == presupuestoId)
            ?? throw new NotFoundException("El presupuesto no existe.");

        DateTime vencimiento = presupuesto.Fecha.AddDays(presupuesto.ValidezDias);

        if (DateTime.UtcNow > vencimiento)
        {
            throw new InvalidOperationException("El presupuesto esta vencido y no se puede facturar.");
        }

        if (presupuesto.Estado == EstadoPresupuesto.Facturado)
        {
            throw new InvalidOperationException("El presupuesto ya fue facturado.");
        }

        Dictionary<int, int> demandaPorArticulo = presupuesto.Items
            .GroupBy(item => item.ArticuloId)
            .ToDictionary(grupo => grupo.Key, grupo => grupo.Sum(item => item.Cantidad));

        List<Articulo> articulos = demandaPorArticulo.Count == 0
            ? []
            : await _db.Articulos.Where(articulo => demandaPorArticulo.Keys.Contains(articulo.Id)).ToListAsync();

        if (articulos.Count != demandaPorArticulo.Count)
        {
            int faltante = demandaPorArticulo.Keys.First(id => articulos.All(articulo => articulo.Id != id));
            throw new InvalidOperationException($"El articulo {faltante} no existe.");
        }

        foreach (Articulo articulo in articulos)
        {
            if (articulo.StockActual < demandaPorArticulo[articulo.Id])
            {
                throw new InvalidOperationException($"No hay stock suficiente para el articulo {articulo.Codigo}.");
            }
        }

        foreach (Articulo articulo in articulos)
        {
            articulo.StockActual -= demandaPorArticulo[articulo.Id];
        }

        Totales totales = _presupuestos.CalcularTotales(presupuesto);

        Factura factura = new()
        {
            Numero = await _numeracion.ProximoNumeroFacturaAsync(),
            Fecha = DateTime.UtcNow,
            PresupuestoId = presupuesto.Id,
            Subtotal = totales.Subtotal,
            Iva = totales.Iva,
            Total = totales.Total
        };

        presupuesto.Estado = EstadoPresupuesto.Facturado;
        _ = _db.Facturas.Add(factura);

        try
        {
            _ = await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (EsFacturaDuplicada(ex))
        {
            throw new InvalidOperationException("El presupuesto ya fue facturado.", ex);
        }

        return factura;
    }

    private static bool EsFacturaDuplicada(DbUpdateException exception)
    {
        string? message = exception.InnerException?.Message;
        return message?.Contains("PresupuestoId", StringComparison.OrdinalIgnoreCase) == true
            || message?.Contains("IX_Facturas_PresupuestoId", StringComparison.OrdinalIgnoreCase) == true;
    }
}
