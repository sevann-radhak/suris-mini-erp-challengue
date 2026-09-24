using Microsoft.EntityFrameworkCore;
using MiniErp.Core.Data;
using MiniErp.Core.Models;

namespace MiniErp.Core.Services;

public class ArticuloService(AppDbContext db)
{
    private readonly AppDbContext _db = db;

    public async Task<List<Articulo>> BuscarAsync(string? busqueda)
    {
        IQueryable<Articulo> query = _db.Articulos;

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            string term = busqueda.ToLower();
            query = query.Where(articulo =>
                articulo.Codigo.ToLower().Contains(term) ||
                articulo.Descripcion.ToLower().Contains(term));
        }

        return await query.OrderBy(articulo => articulo.Codigo).ToListAsync();
    }
}
