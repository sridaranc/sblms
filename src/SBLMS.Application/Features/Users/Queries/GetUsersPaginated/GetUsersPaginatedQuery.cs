using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;

namespace SBLMS.Application.Features.Users.Queries.GetUsersPaginated;

public class GetUsersPaginatedQuery : IRequest<Result<PaginatedList<UserDto>>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public string? Role { get; set; }
}
