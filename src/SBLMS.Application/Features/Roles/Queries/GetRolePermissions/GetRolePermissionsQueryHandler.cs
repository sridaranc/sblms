using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Queries.GetRolePermissions;

public class GetRolePermissionsQueryHandler : IRequestHandler<GetRolePermissionsQuery, Result<RolePermissionsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetRolePermissionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RolePermissionsDto>> Handle(GetRolePermissionsQuery request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync(request.RoleId, cancellationToken);
        if (role == null)
            return Result<RolePermissionsDto>.Failure("Role not found.");

        var permissionIds = await _context.RolePermissions
            .Where(rp => rp.RoleId == request.RoleId)
            .Select(rp => rp.PermissionId.ToString())
            .ToListAsync(cancellationToken);

        return Result<RolePermissionsDto>.Success(new RolePermissionsDto
        {
            RoleId = role.Id,
            RoleName = role.Name,
            PermissionIds = permissionIds
        });
    }
}
