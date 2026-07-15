using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetFollowUpReport;

public class GetFollowUpReportQuery : IRequest<Result<List<FollowUpReportDto>>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
