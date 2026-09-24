using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;
using MiniErp.Core.Models;

namespace MiniErp.Core.Services;

public class ClienteService(AppDbContext db)
{
    private readonly AppDbContext _db = db;

    public async Task<List<Cliente>> ListarAsync()
    {
        return await _db.Clientes.OrderBy(cliente => cliente.RazonSocial).ToListAsync();
    }
}
