using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;

namespace SBLMS.Application.Features.Users.Queries.GetAllUsers;

public class GetAllUsersQuery : IRequest<Result<List<UserDto>>>
{
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
}
