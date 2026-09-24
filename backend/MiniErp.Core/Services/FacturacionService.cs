using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;
using MiniErp.Core.Models;

namespace MiniErp.Core.Services;

public class FacturacionService(AppDbContext db, 
    PresupuestoService presupuestos, 
    NumeracionService numeracion)
{
    private readonly AppDbContext _db = db;
    private readonly PresupuestoService _presupuestos = presupuestos;
    private readonly NumeracionService _numeracion = numeracion;

    public async Task<Factura> FacturarAsync(int presupuestoId)
    {
        Presupuesto presupuesto = await _db.Presupuestos
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == presupuestoId)
            ?? throw new InvalidOperationException("El presupuesto no existe.");

        DateTime vencimiento = presupuesto.Fecha.AddDays(presupuesto.ValidezDias);
        
        if (DateTime.UtcNow > vencimiento)
        {
            throw new InvalidOperationException("El presupuesto esta vencido y no se puede facturar.");
        }

        if (presupuesto.Estado == EstadoPresupuesto.Facturado)
        {
            throw new InvalidOperationException("El presupuesto ya fue facturado.");
        }

        Dictionary<int, (Articulo Articulo, int Cantidad)> demandaPorArticulo = new();
        
        foreach (PresupuestoItem item in presupuesto.Items)
        {
            if (!demandaPorArticulo.TryGetValue(item.ArticuloId, out (Articulo Articulo, int Cantidad) demanda))
            {
                Articulo articulo = await _db.Articulos.FirstAsync(a => a.Id == item.ArticuloId);
                demanda = (articulo, 0);
            }

            demandaPorArticulo[item.ArticuloId] = (demanda.Articulo, demanda.Cantidad + item.Cantidad);
        }

        foreach ((Articulo? articulo, int cantidad) in demandaPorArticulo.Values)
        {
            if (articulo.StockActual < cantidad)
            {
                throw new InvalidOperationException($"No hay stock suficiente para el articulo {articulo.Codigo}.");
            }
        }

        foreach ((Articulo? articulo, int cantidad) in demandaPorArticulo.Values)
        {
            articulo.StockActual -= cantidad;
        }

        Totales totales = PresupuestoService.CalcularTotales(presupuesto);

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
        _ = await _db.SaveChangesAsync();
       
        return factura;
    }
}
