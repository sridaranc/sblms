using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Queries.GetTeamAttendance;

public class GetTeamAttendanceQueryHandler : IRequestHandler<GetTeamAttendanceQuery, Result<List<TeamAttendanceResponse>>>
{
    private readonly IApplicationDbContext _context;

    public GetTeamAttendanceQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TeamAttendanceResponse>>> Handle(GetTeamAttendanceQuery request, CancellationToken cancellationToken)
    {
        DateTime targetDate;
        if (!string.IsNullOrEmpty(request.Date) && DateTime.TryParse(request.Date, out var parsedDate))
        {
            targetDate = parsedDate.Date;
        }
        else
        {
            targetDate = DateTime.UtcNow.Date;
        }

        var attendances = await _context.Attendances
            .Include(a => a.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(a => a.Date.Date == targetDate)
            .ToListAsync(cancellationToken);

        var response = attendances.Select(a => new TeamAttendanceResponse
        {
            UserId = a.UserId,
            UserFullName = a.User?.FullName ?? string.Empty,
            Department = a.User?.Department,
            Role = a.User?.UserRoles.FirstOrDefault()?.Role?.Name,
            CheckInTime = a.CheckInTime,
            CheckOutTime = a.CheckOutTime,
            Status = a.Status.ToString(),
            FaceVerified = a.FaceVerifiedCheckIn,
            HoursWorked = a.HoursWorked
        }).ToList();

        return Result<List<TeamAttendanceResponse>>.Success(response);
    }
}
