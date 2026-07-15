using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetAttendanceReport;

public class GetAttendanceReportQueryHandler : IRequestHandler<GetAttendanceReportQuery, Result<List<AttendanceReportDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAttendanceReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AttendanceReportDto>>> Handle(GetAttendanceReportQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Attendances
            .Include(a => a.User)
            .AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(a => a.Date >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(a => a.Date <= request.EndDate.Value.AddDays(1).AddTicks(-1));

        var attendances = await query
            .OrderByDescending(a => a.Date)
            .Select(a => new AttendanceReportDto
            {
                Id = a.Id,
                UserName = a.User.FullName,
                Email = a.User.Email,
                Date = a.Date,
                CheckInTime = a.CheckInTime,
                CheckOutTime = a.CheckOutTime,
                HoursWorked = a.HoursWorked,
                Status = a.Status.ToString(),
                FaceVerifiedCheckIn = a.FaceVerifiedCheckIn,
                FaceVerifiedCheckOut = a.FaceVerifiedCheckOut
            })
            .ToListAsync(cancellationToken);

        return Result<List<AttendanceReportDto>>.Success(attendances);
    }
}
