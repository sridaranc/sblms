using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Roles.Commands.CreateRole;

public class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, Result<RoleDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateRoleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RoleDto>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var existingRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == request.Name, cancellationToken);

        if (existingRole != null)
            return Result<RoleDto>.Failure($"Role '{request.Name}' already exists.");

        var role = new Domain.Entities.Role
        {
            Name = request.Name,
            Description = request.Description,
            Hierarchy = request.Hierarchy,
            IsSystemRole = request.IsSystemRole
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<RoleDto>.Success(new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            Hierarchy = role.Hierarchy,
            IsSystemRole = role.IsSystemRole
        }, "Role created successfully.");
    }
}
