using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Roles.Commands.BulkRemovePermissions;

public class BulkRemovePermissionsCommandHandler : IRequestHandler<BulkRemovePermissionsCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public BulkRemovePermissionsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(BulkRemovePermissionsCommand request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync(request.RoleId, cancellationToken);
        if (role == null)
            return Result<bool>.Failure("Role not found.");

        var rolePermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == request.RoleId && request.PermissionIds.Contains(rp.PermissionId))
            .ToListAsync(cancellationToken);

        if (rolePermissions.Count == 0)
            return Result<bool>.Failure("No matching permissions found for this role.");

        _context.RolePermissions.RemoveRange(rolePermissions);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, $"{rolePermissions.Count} permission(s) removed successfully.");
    }
}
