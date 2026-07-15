using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.DTOs;

namespace SBLMS.Application.Features.Permissions.Queries.GetPermissionById;

public class GetPermissionByIdQuery : IRequest<Result<PermissionDto>>
{
    public Guid Id { get; set; }
}
