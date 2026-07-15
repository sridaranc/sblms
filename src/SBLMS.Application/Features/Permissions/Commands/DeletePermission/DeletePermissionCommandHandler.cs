using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Permissions.Commands.DeletePermission;

public class DeletePermissionCommandHandler : IRequestHandler<DeletePermissionCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeletePermissionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeletePermissionCommand request, CancellationToken cancellationToken)
    {
        var permission = await _context.Permissions.FindAsync(request.Id, cancellationToken);
        if (permission == null)
            return Result<bool>.Failure("Permission not found.");

        var rolePermissions = await _context.RolePermissions
            .Where(rp => rp.PermissionId == request.Id)
            .ToListAsync(cancellationToken);
        _context.RolePermissions.RemoveRange(rolePermissions);

        _context.Permissions.Remove(permission);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Permission deleted successfully.");
    }
}
