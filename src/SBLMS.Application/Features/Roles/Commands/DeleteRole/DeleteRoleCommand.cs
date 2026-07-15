using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Roles.Commands.DeleteRole;

public class DeleteRoleCommand : IRequest<Result<bool>>
{
    public Guid Id { get; set; }
}
