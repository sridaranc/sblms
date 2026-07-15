using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Roles.Commands.DeleteRole;

public class DeleteRoleCommandHandler : IRequestHandler<DeleteRoleCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteRoleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync(request.Id, cancellationToken);
        if (role == null)
            return Result<bool>.Failure("Role not found.");

        if (role.IsSystemRole)
            return Result<bool>.Failure("System roles cannot be deleted.");

        var hasUsers = await _context.UserRoles.AnyAsync(ur => ur.RoleId == request.Id, cancellationToken);
        if (hasUsers)
            return Result<bool>.Failure("Cannot delete role that has users assigned to it.");

        var rolePermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == request.Id)
            .ToListAsync(cancellationToken);
        _context.RolePermissions.RemoveRange(rolePermissions);

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Role deleted successfully.");
    }
}
