using MiniErp.Core.Data;
using MiniErp.Core.Models;
using MiniErp.Core.Services;
using Xunit;

namespace MiniErp.Tests;

public class StretchTests
{
    [Fact]
    public async Task Duplicar_UsaPrecioActualYNumeroNuevo()
    {
        AppDbContext db = TestDbFactory.Create();
        NumeracionService numeracion = new(db);
        PresupuestoService presupuestos = new(db, numeracion);

        Articulo articulo = new()
        {
            Codigo = "ART",
            Descripcion = "Articulo",
            PrecioUnitario = 100m,
            StockActual = 10,
            AlicuotaIva = 21m
        };
        Cliente cliente = new() { RazonSocial = "Cliente", Cuit = "20-1", CondicionIva = CondicionIva.ResponsableInscripto };
        _ = db.Articulos.Add(articulo);
        _ = db.Clientes.Add(cliente);
        _ = await db.SaveChangesAsync();

        Presupuesto origen = await presupuestos.CrearAsync(cliente.Id, 15, [
            new PresupuestoItem { ArticuloId = articulo.Id, Cantidad = 2, DescuentoPct = 10m }
        ]);

        articulo.PrecioUnitario = 150m;
        _ = await db.SaveChangesAsync();

        Presupuesto copia = await presupuestos.DuplicarAsync(origen.Id);
        Presupuesto? completo = await presupuestos.ObtenerAsync(copia.Id);

        Assert.NotEqual(origen.Numero, copia.Numero);
        Assert.Equal(150m, completo!.Items.Single().PrecioUnitario);
        Assert.Equal(2, completo.Items.Single().Cantidad);
        Assert.Equal(10m, completo.Items.Single().DescuentoPct);
        Assert.Equal(EstadoPresupuesto.Aprobado, copia.Estado);
    }

    [Fact]
    public async Task TopArticulos_SumaSoloFacturasDelRango()
    {
        AppDbContext db = TestDbFactory.Create();
        Articulo caro = new() { Codigo = "CARO", Descripcion = "Caro", PrecioUnitario = 100m, StockActual = 10, AlicuotaIva = 21m };
        Articulo barato = new() { Codigo = "BARATO", Descripcion = "Barato", PrecioUnitario = 10m, StockActual = 10, AlicuotaIva = 21m };
        Cliente cliente = new() { RazonSocial = "Cliente", Cuit = "20-1", CondicionIva = CondicionIva.ConsumidorFinal };
        db.AddRange(caro, barato, cliente);
        _ = await db.SaveChangesAsync();

        Presupuesto dentro = PresupuestoCon(1, cliente.Id, caro, 2, new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc));
        Presupuesto fuera = PresupuestoCon(2, cliente.Id, barato, 5, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        db.Presupuestos.AddRange(dentro, fuera);
        _ = await db.SaveChangesAsync();

        _ = db.Facturas.Add(new Factura
        {
            Numero = 1,
            Fecha = dentro.Fecha,
            PresupuestoId = dentro.Id,
            Total = 1
        });
        _ = db.Facturas.Add(new Factura
        {
            Numero = 2,
            Fecha = fuera.Fecha,
            PresupuestoId = fuera.Id,
            Total = 1
        });
        _ = await db.SaveChangesAsync();

        List<ArticuloRankeado> top = await new ReporteService(db).TopArticulosFacturadosAsync(
            new DateTime(2026, 3, 1),
            new DateTime(2026, 3, 31),
            5);

        ArticuloRankeado unico = Assert.Single(top);
        Assert.Equal("CARO", unico.Codigo);
        Assert.Equal(PresupuestoService.MontoLinea(dentro.Items.Single()), unico.Monto);
    }

    private static Presupuesto PresupuestoCon(int numero, int clienteId, Articulo articulo, int cantidad, DateTime fecha)
    {
        return new Presupuesto
        {
            Numero = numero,
            Fecha = fecha,
            ClienteId = clienteId,
            Estado = EstadoPresupuesto.Facturado,
            ValidezDias = 10,
            Items =
            [
                new PresupuestoItem
                {
                    Articulo = articulo,
                    Cantidad = cantidad,
                    PrecioUnitario = articulo.PrecioUnitario,
                    AlicuotaIva = articulo.AlicuotaIva
                }
            ]
        };
    }
}
