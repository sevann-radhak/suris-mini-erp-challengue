using Microsoft.AspNetCore.Mvc;
using MiniErp.Api.Dtos;
using MiniErp.Core.Models;
using MiniErp.Core.Services;

namespace MiniErp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController(ClienteService service) : ControllerBase
{
    private readonly ClienteService _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ClienteDto>>> Listar()
    {
        List<Cliente> clientes = await _service.ListarAsync();
        List<ClienteDto> lista = clientes
            .Select(cliente => new
                ClienteDto(cliente.Id, cliente.RazonSocial, cliente.Cuit, cliente.CondicionIva.ToString()))
            .ToList();

        return Ok(lista);
    }
}
