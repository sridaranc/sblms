using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Queries.GetAttendanceStats;

public class GetAttendanceStatsQuery : IRequest<Result<AttendanceStatsResponse>>
{
    public Guid? UserId { get; set; }
    public string? Month { get; set; } // Format: YYYY-MM
}

public class AttendanceStatsResponse
{
    public int TotalDays { get; set; }
    public int PresentDays { get; set; }
    public int LateDays { get; set; }
    public int AbsentDays { get; set; }
    public decimal AverageHours { get; set; }
    public decimal AttendanceRate { get; set; }
}
