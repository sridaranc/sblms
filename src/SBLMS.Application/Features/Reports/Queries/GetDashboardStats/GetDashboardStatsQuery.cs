using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Reports.Queries.GetDashboardStats;

public class GetDashboardStatsQuery : IRequest<Result<DashboardStatsDto>>
{
}
