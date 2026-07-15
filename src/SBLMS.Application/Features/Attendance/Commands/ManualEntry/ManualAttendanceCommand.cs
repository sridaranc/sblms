using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Commands.ManualEntry;

public class ManualAttendanceCommand : IRequest<Result<ManualAttendanceResponse>>
{
    public Guid? TargetUserId { get; set; }   // null = current user; admin can specify any user
    public DateTime Date { get; set; }
    public TimeSpan? CheckInTime { get; set; }
    public TimeSpan? CheckOutTime { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Present";
}

public class ManualAttendanceResponse
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}
