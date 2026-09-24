using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;

namespace MiniErp.Core.Services;

public class NumeracionService(AppDbContext db)
{
    private readonly AppDbContext _db = db;

    public async Task<int> ProximoNumeroPresupuestoAsync()
    {
        int max = await _db.Presupuestos.MaxAsync(p => (int?)p.Numero) ?? 0;
        return max + 1;
    }

    public async Task<int> ProximoNumeroFacturaAsync()
    {
        int max = await _db.Facturas.MaxAsync(f => (int?)f.Numero) ?? 0;
        return max + 1;
    }
}
