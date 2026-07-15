using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.Commands.CreatePermission;
using SBLMS.Application.Features.Permissions.Commands.UpdatePermission;
using SBLMS.Application.Features.Permissions.Commands.DeletePermission;
using SBLMS.Application.Features.Permissions.Queries.GetPermissions;
using SBLMS.Application.Features.Permissions.Queries.GetPermissionById;
using SBLMS.Application.Features.Permissions.DTOs;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PermissionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Result<List<PermissionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPermissions()
    {
        var result = await _mediator.Send(new GetPermissionsQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Result<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<PermissionDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPermission(Guid id)
    {
        var result = await _mediator.Send(new GetPermissionByIdQuery { Id = id });
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<PermissionDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePermission([FromBody] CreatePermissionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Result<PermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<PermissionDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePermission(Guid id, [FromBody] UpdatePermissionRequest request)
    {
        var command = new UpdatePermissionCommand
        {
            Id = id,
            Name = request.Name,
            Resource = request.Resource,
            Action = request.Action,
            Description = request.Description
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeletePermission(Guid id)
    {
        var result = await _mediator.Send(new DeletePermissionCommand { Id = id });
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}

public class UpdatePermissionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Description { get; set; }
}
