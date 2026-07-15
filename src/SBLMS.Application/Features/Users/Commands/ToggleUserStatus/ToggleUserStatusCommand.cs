using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;

namespace SBLMS.Application.Features.Users.Commands.ToggleUserStatus;

public class ToggleUserStatusCommand : IRequest<Result<UserDto>>
{
    public Guid Id { get; set; }
}
