using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Roles.Commands.AssignPermission;

public class AssignPermissionCommandHandler : IRequestHandler<AssignPermissionCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AssignPermissionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(AssignPermissionCommand request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync(request.RoleId, cancellationToken);
        if (role == null)
            return Result<bool>.Failure("Role not found.");

        var permission = await _context.Permissions.FindAsync(request.PermissionId, cancellationToken);
        if (permission == null)
            return Result<bool>.Failure("Permission not found.");

        var existing = await _context.RolePermissions
            .AnyAsync(rp => rp.RoleId == request.RoleId && rp.PermissionId == request.PermissionId, cancellationToken);

        if (existing)
            return Result<bool>.Failure("Permission already assigned to this role.");

        var rolePermission = new RolePermission
        {
            RoleId = request.RoleId,
            PermissionId = request.PermissionId
        };

        _context.RolePermissions.Add(rolePermission);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Permission assigned successfully.");
    }
}
