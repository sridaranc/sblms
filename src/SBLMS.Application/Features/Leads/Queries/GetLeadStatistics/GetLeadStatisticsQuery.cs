using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Queries.GetLeadStatistics;

public class GetLeadStatisticsQuery : IRequest<Result<LeadStatisticsDto>>
{
}
