using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Permissions.Commands.CreatePermission;

public class CreatePermissionCommandHandler : IRequestHandler<CreatePermissionCommand, Result<PermissionDto>>
{
    private readonly IApplicationDbContext _context;

    public CreatePermissionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PermissionDto>> Handle(CreatePermissionCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Permissions
            .FirstOrDefaultAsync(p => p.Resource == request.Resource && p.Action == request.Action, cancellationToken);

        if (existing != null)
            return Result<PermissionDto>.Failure($"Permission '{request.Resource}.{request.Action}' already exists.");

        var permission = new Domain.Entities.Permission
        {
            Name = request.Name,
            Resource = request.Resource,
            Action = request.Action,
            Description = request.Description
        };

        _context.Permissions.Add(permission);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<PermissionDto>.Success(new PermissionDto
        {
            Id = permission.Id,
            Name = permission.Name,
            Resource = permission.Resource,
            Action = permission.Action,
            Description = permission.Description
        }, "Permission created successfully.");
    }
}
