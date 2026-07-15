using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Permissions.DTOs;

namespace SBLMS.Application.Features.Permissions.Queries.GetPermissions;

public class GetPermissionsQuery : IRequest<Result<List<PermissionDto>>> { }
