using Microsoft.AspNetCore.Mvc;
using MiniErp.Api.Dtos;
using MiniErp.Core.Models;
using MiniErp.Core.Services;

namespace MiniErp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PresupuestosController(PresupuestoService service) : ControllerBase
{
    private readonly PresupuestoService _service = service;

    [HttpGet]
    public async Task<ActionResult<List<PresupuestoDto>>> Listar()
    {
        List<Presupuesto> lista = await _service.ListarAsync();
        return Ok(lista.Select(MapToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PresupuestoDto>> Obtener(int id)
    {
        Presupuesto? presupuesto = await _service.ObtenerAsync(id);
        return presupuesto is null
            ? (ActionResult<PresupuestoDto>)NotFound(new { error = "El presupuesto no existe." })
            : (ActionResult<PresupuestoDto>)Ok(MapToDto(presupuesto));
    }

    [HttpPost]
    public async Task<ActionResult<PresupuestoDto>> Crear([FromBody] CrearPresupuestoRequest request)
    {
        List<PresupuestoItem> items = request.Items.Select(i => new PresupuestoItem
        {
            ArticuloId = i.ArticuloId,
            Cantidad = i.Cantidad,
            DescuentoPct = i.DescuentoPct
        }).ToList();

        try
        {
            Presupuesto creado = await _service.CrearAsync(request.ClienteId, request.ValidezDias, items);
            Presupuesto? completo = await _service.ObtenerAsync(creado.Id);
            return Ok(MapToDto(completo!));
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/duplicar")]
    public async Task<ActionResult<PresupuestoDto>> Duplicar(int id)
    {
        try
        {
            Presupuesto creado = await _service.DuplicarAsync(id);
            Presupuesto? completo = await _service.ObtenerAsync(creado.Id);
            return Ok(MapToDto(completo!));
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            await _service.EliminarAsync(id);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    private PresupuestoDto MapToDto(Presupuesto p)
    {
        Totales totales = PresupuestoService.CalcularTotales(p);

        List<PresupuestoItemDto> items = p.Items.Select(i => new PresupuestoItemDto(
            i.ArticuloId,
            i.Articulo?.Codigo ?? "",
            i.Articulo?.Descripcion ?? "",
            i.Cantidad,
            i.PrecioUnitario,
            i.DescuentoPct,
            i.AlicuotaIva,
            PresupuestoService.SubtotalLinea(i)
        )).ToList();

        return new PresupuestoDto(
            p.Id,
            p.Numero,
            p.Fecha,
            p.ClienteId,
            p.Cliente?.RazonSocial ?? "",
            p.Estado.ToString(),
            p.ValidezDias,
            items,
            totales.Subtotal,
            totales.Iva,
            totales.Total
        );
    }
}
