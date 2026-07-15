using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Meetings.Queries.GetAllMeetings;

public class GetAllMeetingsQueryHandler : IRequestHandler<GetAllMeetingsQuery, Result<List<MeetingDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllMeetingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<MeetingDto>>> Handle(GetAllMeetingsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Meetings
            .Include(m => m.Lead)
            .Include(m => m.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<MeetingStatus>(request.Status, true, out var status))
            query = query.Where(m => m.Status == status);

        if (request.UserId.HasValue)
            query = query.Where(m => m.UserId == request.UserId.Value);

        if (request.LeadId.HasValue)
            query = query.Where(m => m.LeadId == request.LeadId.Value);

        var meetings = await query
            .OrderByDescending(m => m.ScheduledDate)
            .Select(m => new MeetingDto
            {
                Id = m.Id,
                LeadId = m.LeadId,
                LeadNumber = m.Lead.LeadNumber,
                CustomerName = m.Lead.CustomerName,
                UserId = m.UserId,
                UserName = $"{m.User.FirstName} {m.User.LastName}",
                Title = m.Title,
                Description = m.Description,
                ScheduledDate = m.ScheduledDate,
                Duration = m.Duration,
                Location = m.Location,
                MeetingUrl = m.MeetingUrl,
                Status = m.Status,
                CompletedAt = m.CompletedAt,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Result<List<MeetingDto>>.Success(meetings);
    }
}
