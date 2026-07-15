using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetMeetingReport;

public class GetMeetingReportQuery : IRequest<Result<List<MeetingReportDto>>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
