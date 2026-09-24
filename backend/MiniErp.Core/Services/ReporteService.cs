using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;
using MiniErp.Core.Models;

namespace MiniErp.Core.Services;

public record ArticuloRankeado(int ArticuloId, string Codigo, string Descripcion, decimal Monto);

public class ReporteService(AppDbContext db)
{
    private readonly AppDbContext _db = db;

    public async Task<List<ArticuloRankeado>> TopArticulosFacturadosAsync(DateTime desde, DateTime hasta, int top)
    {
        if (top <= 0)
        {
            throw new InvalidOperationException("El top debe ser mayor a cero.");
        }

        if (hasta.Date < desde.Date)
        {
            throw new InvalidOperationException("La fecha hasta no puede ser anterior a desde.");
        }

        DateTime desdeInicio = desde.Date;
        DateTime hastaFin = hasta.Date.AddDays(1);

        List<Factura> facturas = await _db.Facturas
            .Include(factura => factura.Presupuesto!)
                .ThenInclude(presupuesto => presupuesto.Items)
                    .ThenInclude(item => item.Articulo)
            .Where(factura => factura.Fecha >= desdeInicio && factura.Fecha < hastaFin)
            .ToListAsync();

        return facturas
            .SelectMany(factura => factura.Presupuesto!.Items)
            .GroupBy(item => item.ArticuloId)
            .Select(grupo =>
            {
                PresupuestoItem primero = grupo.First();
                return new ArticuloRankeado(
                    grupo.Key,
                    primero.Articulo?.Codigo ?? "",
                    primero.Articulo?.Descripcion ?? "",
                    grupo.Sum(PresupuestoService.MontoLinea));
            })
            .OrderByDescending(fila => fila.Monto)
            .Take(top)
            .ToList();
    }
}
