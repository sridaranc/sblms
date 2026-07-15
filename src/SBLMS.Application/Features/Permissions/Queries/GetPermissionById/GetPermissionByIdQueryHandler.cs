using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.DTOs;

namespace SBLMS.Application.Features.Permissions.Queries.GetPermissionById;

public class GetPermissionByIdQueryHandler : IRequestHandler<GetPermissionByIdQuery, Result<PermissionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPermissionByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PermissionDto>> Handle(GetPermissionByIdQuery request, CancellationToken cancellationToken)
    {
        var permission = await _context.Permissions
            .Where(p => p.Id == request.Id)
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Resource = p.Resource,
                Action = p.Action,
                Description = p.Description
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (permission == null)
            return Result<PermissionDto>.Failure("Permission not found.");

        return Result<PermissionDto>.Success(permission);
    }
}
