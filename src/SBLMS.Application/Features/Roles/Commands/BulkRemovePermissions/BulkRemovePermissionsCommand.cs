using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Roles.Commands.BulkRemovePermissions;

public class BulkRemovePermissionsCommand : IRequest<Result<bool>>
{
    public Guid RoleId { get; set; }
    public List<Guid> PermissionIds { get; set; } = new();
}
