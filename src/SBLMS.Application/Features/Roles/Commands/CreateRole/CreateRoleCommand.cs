using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Commands.CreateRole;

public class CreateRoleCommand : IRequest<Result<RoleDto>>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Hierarchy { get; set; }
    public bool IsSystemRole { get; set; }
}
