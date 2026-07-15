using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Roles.Commands.RemovePermission;

public class RemovePermissionCommand : IRequest<Result<bool>>
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }
}
