using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Roles.Commands.RemovePermission;

public class RemovePermissionCommandHandler : IRequestHandler<RemovePermissionCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public RemovePermissionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(RemovePermissionCommand request, CancellationToken cancellationToken)
    {
        var rolePermission = await _context.RolePermissions
            .FirstOrDefaultAsync(rp => rp.RoleId == request.RoleId && rp.PermissionId == request.PermissionId, cancellationToken);

        if (rolePermission == null)
            return Result<bool>.Failure("Permission not found in this role.");

        _context.RolePermissions.Remove(rolePermission);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Permission removed successfully.");
    }
}
