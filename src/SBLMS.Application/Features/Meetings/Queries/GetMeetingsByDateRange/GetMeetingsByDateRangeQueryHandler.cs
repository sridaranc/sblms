using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Queries.GetMeetingsByDateRange;

public class GetMeetingsByDateRangeQueryHandler : IRequestHandler<GetMeetingsByDateRangeQuery, Result<List<MeetingDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetMeetingsByDateRangeQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<MeetingDto>>> Handle(GetMeetingsByDateRangeQuery request, CancellationToken cancellationToken)
    {
        var meetings = await _context.Meetings
            .Include(m => m.Lead)
            .Include(m => m.User)
            .Where(m => m.ScheduledDate >= request.StartDate && m.ScheduledDate <= request.EndDate)
            .OrderBy(m => m.ScheduledDate)
            .ToListAsync(cancellationToken);

        var dtos = meetings.Select(m => new MeetingDto
        {
            Id = m.Id,
            LeadId = m.LeadId,
            LeadNumber = m.Lead?.LeadNumber ?? string.Empty,
            CustomerName = m.Lead?.CustomerName ?? string.Empty,
            UserId = m.UserId,
            UserName = m.User?.FullName ?? string.Empty,
            Title = m.Title,
            Description = m.Description,
            ScheduledDate = m.ScheduledDate,
            Duration = m.Duration,
            Location = m.Location,
            MeetingUrl = m.MeetingUrl,
            Status = m.Status,
            CompletedAt = m.CompletedAt,
            CreatedAt = m.CreatedAt
        }).ToList();

        return Result<List<MeetingDto>>.Success(dtos);
    }
}
