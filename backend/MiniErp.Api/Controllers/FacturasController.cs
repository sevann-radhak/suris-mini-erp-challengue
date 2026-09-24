using Microsoft.AspNetCore.Mvc;
using MiniErp.Api.Dtos;
using MiniErp.Core.Models;
using MiniErp.Core.Services;

namespace MiniErp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FacturasController(FacturacionService facturacion) : ControllerBase
{
    private readonly FacturacionService _facturacion = facturacion;

    [HttpGet]
    public async Task<ActionResult<List<FacturaDto>>> Listar()
    {
        List<Factura> lista = await _facturacion.ListarAsync();
        return Ok(lista.Select(Map).ToList());
    }

    [HttpPost("facturar/{presupuestoId:int}")]
    public async Task<ActionResult<FacturaDto>> Facturar(int presupuestoId)
    {
        try
        {
            Factura factura = await _facturacion.FacturarAsync(presupuestoId);
            return Ok(Map(factura));
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

    private static FacturaDto Map(Factura factura)
    {
        return new FacturaDto(factura.Id, 
            factura.Numero, 
            factura.Fecha, 
            factura.PresupuestoId, 
            factura.Subtotal, 
            factura.Iva, 
            factura.Total);
    }
}
