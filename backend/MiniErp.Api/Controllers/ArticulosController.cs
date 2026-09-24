using Microsoft.AspNetCore.Mvc;
using MiniErp.Api.Dtos;
using MiniErp.Core.Models;
using MiniErp.Core.Services;

namespace MiniErp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticulosController(ArticuloService service) : ControllerBase
{
    private readonly ArticuloService _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ArticuloDto>>> Buscar([FromQuery] string? busqueda)
    {
        List<Articulo> lista = await _service.BuscarAsync(busqueda);
        List<ArticuloDto> dtos = lista.Select(articulo => new ArticuloDto(
            articulo.Id,
            articulo.Codigo,
            articulo.Descripcion,
            articulo.PrecioUnitario,
            articulo.StockActual,
            articulo.AlicuotaIva)).ToList();

        return Ok(dtos);
    }
}
