using System.Data;
using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;

namespace MiniErp.Core.Services;

public class NumeracionService(AppDbContext db)
{
    private readonly AppDbContext _db = db;

    public Task<int> ProximoNumeroPresupuestoAsync()
    {
        return ProximoNumeroAsync("presupuesto", "Presupuestos");
    }

    public Task<int> ProximoNumeroFacturaAsync()
    {
        return ProximoNumeroAsync("factura", "Facturas");
    }

    private async Task<int> ProximoNumeroAsync(string clave, string tabla)
    {
        System.Data.Common.DbConnection connection = _db.Database.GetDbConnection();
        bool shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using System.Data.Common.DbCommand command = connection.CreateCommand();
            command.CommandText = $"""
                INSERT INTO "Numeraciones" ("Clave", "UltimoNumero")
                VALUES ($clave, COALESCE((SELECT MAX("Numero") FROM "{tabla}"), 0) + 1)
                ON CONFLICT("Clave") DO UPDATE SET "UltimoNumero" = "UltimoNumero" + 1
                RETURNING "UltimoNumero";
                """;

            System.Data.Common.DbParameter parameter = command.CreateParameter();
            parameter.ParameterName = "$clave";
            parameter.Value = clave;
            _ = command.Parameters.Add(parameter);

            object? value = await command.ExecuteScalarAsync()
                ?? throw new InvalidOperationException("No se pudo generar el proximo numero.");

            return Convert.ToInt32(value);
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }
}
