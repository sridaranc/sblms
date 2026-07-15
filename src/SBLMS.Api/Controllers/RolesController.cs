using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.Commands.CreateRole;
using SBLMS.Application.Features.Roles.Commands.UpdateRole;
using SBLMS.Application.Features.Roles.Commands.DeleteRole;
using SBLMS.Application.Features.Roles.Commands.AssignPermission;
using SBLMS.Application.Features.Roles.Commands.RemovePermission;
using SBLMS.Application.Features.Roles.Commands.BulkAssignPermissions;
using SBLMS.Application.Features.Roles.Commands.BulkRemovePermissions;
using SBLMS.Application.Features.Roles.Queries.GetRoles;
using SBLMS.Application.Features.Roles.Queries.GetRoleById;
using SBLMS.Application.Features.Roles.Queries.GetRolePermissions;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IMediator _mediator;

    public RolesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Result<List<RoleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var result = await _mediator.Send(new GetRolesQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Result<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<RoleDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRole(Guid id)
    {
        var result = await _mediator.Send(new GetRoleByIdQuery { Id = id });
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<RoleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Result<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<RoleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var command = new UpdateRoleCommand
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            Hierarchy = request.Hierarchy,
            IsSystemRole = request.IsSystemRole
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        var result = await _mediator.Send(new DeleteRoleCommand { Id = id });
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{roleId}/permissions")]
    [ProducesResponseType(typeof(Result<RolePermissionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRolePermissions(Guid roleId)
    {
        var result = await _mediator.Send(new GetRolePermissionsQuery { RoleId = roleId });
        return Ok(result);
    }

    [HttpPost("{roleId}/permissions")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignPermissionToRole(Guid roleId, [FromBody] AssignPermissionRequest request)
    {
        var command = new AssignPermissionCommand
        {
            RoleId = roleId,
            PermissionId = request.PermissionId
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{roleId}/permissions/{permissionId}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemovePermissionFromRole(Guid roleId, Guid permissionId)
    {
        var result = await _mediator.Send(new RemovePermissionCommand
        {
            RoleId = roleId,
            PermissionId = permissionId
        });
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{roleId}/permissions/bulk")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkAssignPermissions(Guid roleId, [FromBody] BulkAssignPermissionRequest request)
    {
        var command = new BulkAssignPermissionsCommand
        {
            RoleId = roleId,
            PermissionIds = request.PermissionIds
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{roleId}/permissions/bulk")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkRemovePermissions(Guid roleId, [FromBody] BulkRemovePermissionRequest request)
    {
        var command = new BulkRemovePermissionsCommand
        {
            RoleId = roleId,
            PermissionIds = request.PermissionIds
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}

public class BulkAssignPermissionRequest
{
    public List<Guid> PermissionIds { get; set; } = new();
}

public class BulkRemovePermissionRequest
{
    public List<Guid> PermissionIds { get; set; } = new();
}

public class UpdateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Hierarchy { get; set; }
    public bool IsSystemRole { get; set; }
}

public class AssignPermissionRequest
{
    public Guid PermissionId { get; set; }
}
