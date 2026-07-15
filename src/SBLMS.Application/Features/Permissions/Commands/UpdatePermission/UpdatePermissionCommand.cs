using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.DTOs;

namespace SBLMS.Application.Features.Permissions.Commands.UpdatePermission;

public class UpdatePermissionCommand : IRequest<Result<PermissionDto>>
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Description { get; set; }
}
