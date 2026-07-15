using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Attendance.Queries.GetAttendanceStats;

public class GetAttendanceStatsQueryHandler : IRequestHandler<GetAttendanceStatsQuery, Result<AttendanceStatsResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAttendanceStatsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AttendanceStatsResponse>> Handle(GetAttendanceStatsQuery request, CancellationToken cancellationToken)
    {
        var userId = request.UserId ?? _currentUserService.UserId;

        var query = _context.Attendances.AsQueryable();

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        if (!string.IsNullOrEmpty(request.Month) && DateTime.TryParseExact(request.Month, "yyyy-MM", null, System.Globalization.DateTimeStyles.None, out var monthDate))
        {
            query = query.Where(a => a.Date.Year == monthDate.Year && a.Date.Month == monthDate.Month);
        }

        var attendances = await query.ToListAsync(cancellationToken);

        var totalDays = attendances.Count;
        var presentDays = attendances.Count(a => a.Status == AttendanceStatus.Present);
        var lateDays = attendances.Count(a => a.Status == AttendanceStatus.Late);
        var absentDays = attendances.Count(a => a.Status == AttendanceStatus.Absent);
        var totalHours = attendances.Where(a => a.HoursWorked.HasValue).Sum(a => a.HoursWorked!.Value);
        var daysWithHours = attendances.Count(a => a.HoursWorked.HasValue);
        var averageHours = daysWithHours > 0 ? totalHours / daysWithHours : 0;
        var attendanceRate = totalDays > 0 ? (decimal)(presentDays + lateDays) / totalDays * 100 : 0;

        return Result<AttendanceStatsResponse>.Success(new AttendanceStatsResponse
        {
            TotalDays = totalDays,
            PresentDays = presentDays,
            LateDays = lateDays,
            AbsentDays = absentDays,
            AverageHours = Math.Round(averageHours, 2),
            AttendanceRate = Math.Round(attendanceRate, 2)
        });
    }
}
