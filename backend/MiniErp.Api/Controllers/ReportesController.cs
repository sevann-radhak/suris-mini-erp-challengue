using Microsoft.AspNetCore.Mvc;
using MiniErp.Api.Dtos;
using MiniErp.Core.Services;

namespace MiniErp.Api.Controllers;

[ApiController]
[Route("api/reportes")]
public class ReportesController(ReporteService reportes) : ControllerBase
{
    private readonly ReporteService _reportes = reportes;

    [HttpGet("top-articulos")]
    public async Task<ActionResult<List<ArticuloRankeadoDto>>> TopArticulos(
        [FromQuery] DateTime desde,
        [FromQuery] DateTime hasta,
        [FromQuery] int top = 5)
    {
        try
        {
            List<ArticuloRankeado> ranking = await _reportes.TopArticulosFacturadosAsync(desde, hasta, top);
            return Ok(ranking.Select(fila => new ArticuloRankeadoDto(fila.ArticuloId, fila.Codigo, fila.Descripcion, fila.Monto)).ToList());
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
