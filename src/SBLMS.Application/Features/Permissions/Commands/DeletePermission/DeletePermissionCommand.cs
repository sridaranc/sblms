using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Permissions.Commands.DeletePermission;

public class DeletePermissionCommand : IRequest<Result<bool>>
{
    public Guid Id { get; set; }
}
