using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Queries.GetAttendance;

public class GetAttendanceQuery : IRequest<Result<List<AttendanceResponse>>>
{
    public Guid? UserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class AttendanceResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? CheckInLocation { get; set; }
    public string? CheckOutLocation { get; set; }
    public bool FaceVerifiedCheckIn { get; set; }
    public bool FaceVerifiedCheckOut { get; set; }
    public double? FaceDistanceCheckIn { get; set; }
    public double? FaceDistanceCheckOut { get; set; }
    public decimal? HoursWorked { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
