using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetAttendanceReport;

public class GetAttendanceReportQuery : IRequest<Result<List<AttendanceReportDto>>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
