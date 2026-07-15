using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Queries.GetRoleById;

public class GetRoleByIdQueryHandler : IRequestHandler<GetRoleByIdQuery, Result<RoleDto>>
{
    private readonly IApplicationDbContext _context;

    public GetRoleByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RoleDto>> Handle(GetRoleByIdQuery request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles
            .Where(r => r.Id == request.Id)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                Hierarchy = r.Hierarchy,
                IsSystemRole = r.IsSystemRole
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (role == null)
            return Result<RoleDto>.Failure("Role not found.");

        return Result<RoleDto>.Success(role);
    }
}
