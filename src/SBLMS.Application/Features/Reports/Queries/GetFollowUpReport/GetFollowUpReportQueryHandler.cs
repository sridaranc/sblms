using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Queries.GetFollowUpReport;

public class GetFollowUpReportQueryHandler : IRequestHandler<GetFollowUpReportQuery, Result<List<FollowUpReportDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetFollowUpReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<FollowUpReportDto>>> Handle(GetFollowUpReportQuery request, CancellationToken cancellationToken)
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

        return Result<List<FollowUpReportDto>>.Success(followUps);
    }
}
