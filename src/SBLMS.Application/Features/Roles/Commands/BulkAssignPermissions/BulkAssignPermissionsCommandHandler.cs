using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Roles.Commands.BulkAssignPermissions;

public class BulkAssignPermissionsCommandHandler : IRequestHandler<BulkAssignPermissionsCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public BulkAssignPermissionsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(BulkAssignPermissionsCommand request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync(request.RoleId, cancellationToken);
        if (role == null)
            return Result<bool>.Failure("Role not found.");

        var existingPermissionIds = await _context.RolePermissions
            .Where(rp => rp.RoleId == request.RoleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync(cancellationToken);

        var newPermissionIds = request.PermissionIds
            .Where(id => !existingPermissionIds.Contains(id))
            .ToList();

        if (newPermissionIds.Count == 0)
            return Result<bool>.Failure("All permissions are already assigned to this role.");

        var validPermissionIds = await _context.Permissions
            .Where(p => newPermissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var rolePermissions = validPermissionIds.Select(permissionId => new RolePermission
        {
            RoleId = request.RoleId,
            PermissionId = permissionId
        }).ToList();

        _context.RolePermissions.AddRange(rolePermissions);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, $"{rolePermissions.Count} permission(s) assigned successfully.");
    }
}
