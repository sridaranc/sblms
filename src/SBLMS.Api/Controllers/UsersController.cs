using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Api.Filters;
using SBLMS.Api.Extensions;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.Commands.ChangePassword;
using SBLMS.Application.Features.Users.Commands.CreateUser;
using SBLMS.Application.Features.Users.Commands.DeleteUser;
using SBLMS.Application.Features.Users.Commands.ToggleUserStatus;
using SBLMS.Application.Features.Users.Commands.UpdateUser;
using SBLMS.Application.Features.Users.DTOs;
using SBLMS.Application.Features.Users.Queries.GetAllUsers;
using SBLMS.Application.Features.Users.Queries.GetUserById;
using SBLMS.Application.Features.Users.Queries.GetUsersPaginated;

using SBLMS.Application.Common.Interfaces;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public UsersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentUser()
    {
        if (_currentUser.UserId == null) return Unauthorized();
        var result = await _mediator.Send(new GetUserByIdQuery { Id = _currentUser.UserId.Value });
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<List<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? searchTerm, [FromQuery] bool? isActive)
    {
        var result = await _mediator.Send(new GetAllUsersQuery { SearchTerm = searchTerm, IsActive = isActive });
        return Ok(result);
    }

    [HttpGet("paginated")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<PaginatedList<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsersPaginated(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? role = null)
    {
        var result = await _mediator.Send(new GetUsersPaginatedQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsActive = isActive,
            Role = role
        });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var result = await _mediator.Send(new GetUserByIdQuery { Id = id });
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetUserById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        var command = new UpdateUserCommand
        {
            Id = id,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PhoneNumber = dto.Phone ?? dto.PhoneNumber,
            IsActive = dto.IsActive,
            Roles = dto.Roles,
            Department = dto.Department,
            Designation = dto.Designation,
            EmployeeId = dto.EmployeeId,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            ReportingManager = dto.ReportingManager,
            FaceDescriptor = dto.FaceDescriptor,
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _mediator.Send(new DeleteUserCommand { Id = id });
        return Ok(result);
    }

    [HttpPut("{id:guid}/toggle-status")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleUserStatus(Guid id)
    {
        var result = await _mediator.Send(new ToggleUserStatusCommand { Id = id });
        return Ok(result);
    }

    [HttpPut("{id:guid}/change-password")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordDto dto)
    {
        var command = new ChangePasswordCommand
        {
            UserId = id,
            CurrentPassword = dto.CurrentPassword,
            NewPassword = dto.NewPassword
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
