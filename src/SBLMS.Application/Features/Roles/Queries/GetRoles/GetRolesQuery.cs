using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Roles.DTOs;

namespace SBLMS.Application.Features.Roles.Queries.GetRoles;

public class GetRolesQuery : IRequest<Result<List<RoleDto>>> { }
