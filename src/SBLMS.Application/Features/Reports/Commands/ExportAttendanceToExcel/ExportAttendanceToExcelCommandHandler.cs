using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportAttendanceToExcel;

public class ExportAttendanceToExcelCommandHandler : IRequestHandler<ExportAttendanceToExcelCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelService _excelService;

    public ExportAttendanceToExcelCommandHandler(IApplicationDbContext context, IExcelService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<Result<byte[]>> Handle(ExportAttendanceToExcelCommand request, CancellationToken cancellationToken)
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

        var excelBytes = _excelService.ExportAttendanceToExcel(attendances);
        return Result<byte[]>.Success(excelBytes);
    }
}
