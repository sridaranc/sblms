using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Queries.GetRolePermissions;

public class GetRolePermissionsQuery : IRequest<Result<RolePermissionsDto>>
{
    public Guid RoleId { get; set; }
}
