using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;

namespace SBLMS.Application.Features.Users.Queries.GetUsersPaginated;

public class GetUsersPaginatedQueryHandler : IRequestHandler<GetUsersPaginatedQuery, Result<PaginatedList<UserDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersPaginatedQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PaginatedList<UserDto>>> Handle(GetUsersPaginatedQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchLower = request.SearchTerm.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(searchLower) ||
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower));
        }

        if (request.IsActive.HasValue)
            query = query.Where(u => u.IsActive == request.IsActive.Value);

        if (!string.IsNullOrEmpty(request.Role))
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == request.Role.ToLower()));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            FullName = u.FullName,
            PhoneNumber = u.PhoneNumber,
            ProfileImageUrl = u.ProfileImageUrl,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt,
            Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
        }).ToList();

        var paginatedList = new PaginatedList<UserDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };

        return Result<PaginatedList<UserDto>>.Success(paginatedList);
    }
}
