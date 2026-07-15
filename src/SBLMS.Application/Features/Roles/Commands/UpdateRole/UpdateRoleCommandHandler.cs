using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Commands.UpdateRole;

public class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, Result<RoleDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateRoleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RoleDto>> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync(request.Id, cancellationToken);
        if (role == null)
            return Result<RoleDto>.Failure("Role not found.");

        if (role.IsSystemRole)
            return Result<RoleDto>.Failure("System roles cannot be modified.");

        var existingRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == request.Name && r.Id != request.Id, cancellationToken);

        if (existingRole != null)
            return Result<RoleDto>.Failure($"Role '{request.Name}' already exists.");

        role.Name = request.Name;
        role.Description = request.Description;
        role.Hierarchy = request.Hierarchy;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<RoleDto>.Success(new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            Hierarchy = role.Hierarchy,
            IsSystemRole = role.IsSystemRole
        }, "Role updated successfully.");
    }
}
