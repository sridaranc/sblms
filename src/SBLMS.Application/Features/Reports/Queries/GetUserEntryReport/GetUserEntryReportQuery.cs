using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetUserEntryReport;

public class GetUserEntryReportQuery : IRequest<Result<List<UserEntryReportDto>>>
{
}
