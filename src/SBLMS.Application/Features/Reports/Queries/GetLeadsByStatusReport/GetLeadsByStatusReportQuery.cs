using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetLeadsByStatusReport;

public class GetLeadsByStatusReportQuery : IRequest<Result<LeadsByStatusReportDto>>
{
}
