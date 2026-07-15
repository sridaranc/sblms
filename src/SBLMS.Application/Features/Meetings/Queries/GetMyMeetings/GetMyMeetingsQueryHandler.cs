using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Meetings.Queries.GetMyMeetings;

public class GetMyMeetingsQueryHandler : IRequestHandler<GetMyMeetingsQuery, Result<List<MeetingDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyMeetingsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<MeetingDto>>> Handle(GetMyMeetingsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
            return Result<List<MeetingDto>>.Failure("User not authenticated.");

        var query = _context.Meetings
            .Include(m => m.Lead)
            .Include(m => m.User)
            .Where(m => m.UserId == _currentUserService.UserId.Value)
            .AsQueryable();

        if (request.IncludeCompleted != true)
            query = query.Where(m => m.Status == MeetingStatus.Scheduled);

        var meetings = await query
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
