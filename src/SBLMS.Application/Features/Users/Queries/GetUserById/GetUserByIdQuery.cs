using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;

namespace SBLMS.Application.Features.Users.Queries.GetUserById;

public class GetUserByIdQuery : IRequest<Result<UserDto>>
{
    public Guid Id { get; set; }
}
