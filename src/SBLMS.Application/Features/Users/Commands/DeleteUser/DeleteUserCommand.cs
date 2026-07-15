using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Users.Commands.DeleteUser;

public class DeleteUserCommand : IRequest<Result<bool>>
{
    public Guid Id { get; set; }
}
