using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Queries.GetAttendance;

public class GetAttendanceQueryHandler : IRequestHandler<GetAttendanceQuery, Result<List<AttendanceResponse>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAttendanceQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<AttendanceResponse>>> Handle(GetAttendanceQuery request, CancellationToken cancellationToken)
    {
        var userId = request.UserId ?? _currentUserService.UserId;

        var query = _context.Attendances
            .Include(a => a.User)
            .AsQueryable();

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        if (request.StartDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(request.StartDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.Date >= startUtc);
        }

        if (request.EndDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(request.EndDate.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(a => a.Date < endUtc);
        }

        var attendances = await query
            .OrderByDescending(a => a.Date)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        var response = attendances.Select(a => new AttendanceResponse
        {
            Id = a.Id,
            UserId = a.UserId,
            UserFullName = a.User?.FullName ?? string.Empty,
            Date = a.Date,
            CheckInTime = a.CheckInTime,
            CheckOutTime = a.CheckOutTime,
            CheckInLocation = a.CheckInLocation,
            CheckOutLocation = a.CheckOutLocation,
            FaceVerifiedCheckIn = a.FaceVerifiedCheckIn,
            FaceVerifiedCheckOut = a.FaceVerifiedCheckOut,
            FaceDistanceCheckIn = a.FaceDistanceCheckIn,
            FaceDistanceCheckOut = a.FaceDistanceCheckOut,
            HoursWorked = a.HoursWorked,
            Status = a.Status.ToString(),
            Notes = a.Notes
        }).ToList();

        return Result<List<AttendanceResponse>>.Success(response);
    }
}
