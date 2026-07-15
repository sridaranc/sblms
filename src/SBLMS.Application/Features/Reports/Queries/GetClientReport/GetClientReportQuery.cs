using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetClientReport;

public class GetClientReportQuery : IRequest<Result<List<ClientReportDto>>>
{
}
