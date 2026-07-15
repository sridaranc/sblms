using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Queries.GetTeamAttendance;

public class GetTeamAttendanceQuery : IRequest<Result<List<TeamAttendanceResponse>>>
{
    public string? Date { get; set; } // Format: YYYY-MM-DD
}

public class TeamAttendanceResponse
{
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Role { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool FaceVerified { get; set; }
    public decimal? HoursWorked { get; set; }
}
