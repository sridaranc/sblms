using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Queries.GetRoleById;

public class GetRoleByIdQuery : IRequest<Result<RoleDto>>
{
    public Guid Id { get; set; }
}
