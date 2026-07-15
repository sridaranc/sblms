using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.DTOs;

namespace SBLMS.Application.Features.Permissions.Commands.UpdatePermission;

public class UpdatePermissionCommandHandler : IRequestHandler<UpdatePermissionCommand, Result<PermissionDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdatePermissionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PermissionDto>> Handle(UpdatePermissionCommand request, CancellationToken cancellationToken)
    {
        var permission = await _context.Permissions.FindAsync(request.Id, cancellationToken);
        if (permission == null)
            return Result<PermissionDto>.Failure("Permission not found.");

        var existing = await _context.Permissions
            .FirstOrDefaultAsync(p => p.Resource == request.Resource && p.Action == request.Action && p.Id != request.Id, cancellationToken);

        if (existing != null)
            return Result<PermissionDto>.Failure($"Permission '{request.Resource}.{request.Action}' already exists.");

        permission.Name = request.Name;
        permission.Resource = request.Resource;
        permission.Action = request.Action;
        permission.Description = request.Description;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<PermissionDto>.Success(new PermissionDto
        {
            Id = permission.Id,
            Name = permission.Name,
            Resource = permission.Resource,
            Action = permission.Action,
            Description = permission.Description
        }, "Permission updated successfully.");
    }
}
