using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportFollowUpsToExcel;

public class ExportFollowUpsToExcelCommandHandler : IRequestHandler<ExportFollowUpsToExcelCommand, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelService _excelService;

    public ExportFollowUpsToExcelCommandHandler(IApplicationDbContext context, IExcelService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<Result<byte[]>> Handle(ExportFollowUpsToExcelCommand request, CancellationToken cancellationToken)
    {
        var query = _context.FollowUps
            .Include(f => f.Lead)
            .Include(f => f.User)
            .AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(f => f.ScheduledDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(f => f.ScheduledDate <= request.EndDate.Value.AddDays(1).AddTicks(-1));

        var followUps = await query
            .OrderByDescending(f => f.ScheduledDate)
            .Select(f => new FollowUpReportDto
            {
                Id = f.Id,
                LeadName = f.Lead.CustomerName,
                CompanyName = f.Lead.CompanyName,
                ScheduledDate = f.ScheduledDate,
                ScheduledTime = f.ScheduledTime,
                Status = f.Status.ToString(),
                Notes = f.Notes,
                UserName = f.User.FullName
            })
            .ToListAsync(cancellationToken);

        var excelBytes = _excelService.ExportFollowUpsToExcel(followUps);
        return Result<byte[]>.Success(excelBytes);
    }
}
