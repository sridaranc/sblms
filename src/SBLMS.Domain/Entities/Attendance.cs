using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid UserId { get; set; }
    public DateTime Date { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? CheckInLocation { get; set; }
    public string? CheckOutLocation { get; set; }
    public decimal? CheckInLatitude { get; set; }
    public decimal? CheckInLongitude { get; set; }
    public decimal? CheckOutLatitude { get; set; }
    public decimal? CheckOutLongitude { get; set; }
    public bool FaceVerifiedCheckIn { get; set; }
    public bool FaceVerifiedCheckOut { get; set; }
    public double? FaceDistanceCheckIn { get; set; }
    public double? FaceDistanceCheckOut { get; set; }
    public decimal? HoursWorked { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Absent;
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

public enum AttendanceStatus
{
    Present = 0,
    Late = 1,
    Absent = 2,
    HalfDay = 3,
    OnLeave = 4
}
