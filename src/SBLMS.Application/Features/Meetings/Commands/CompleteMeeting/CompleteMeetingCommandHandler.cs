using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Meetings.Commands.CompleteMeeting;

public class CompleteMeetingCommandHandler : IRequestHandler<CompleteMeetingCommand, Result<MeetingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public CompleteMeetingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    public async Task<Result<MeetingDto>> Handle(CompleteMeetingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await _context.Meetings.FindAsync(request.Id);
        if (meeting == null)
            throw new NotFoundException("Meeting", request.Id);

        var lead = await _context.Leads.FindAsync(meeting.LeadId);
        var user = await _context.Users.FindAsync(meeting.UserId);

        meeting.Status = MeetingStatus.Completed;
        meeting.CompletedAt = DateTime.UtcNow;
        meeting.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.Notes))
        {
            meeting.Description = string.IsNullOrEmpty(meeting.Description)
                ? request.Notes
                : $"{meeting.Description}\n\n{request.Notes}";
        }

        var activity = new Activity
        {
            LeadId = meeting.LeadId,
            UserId = _currentUserService.UserId ?? Guid.Empty,
            Type = ActivityType.Meeting,
            Description = $"Meeting completed: {meeting.Title}" +
                          (string.IsNullOrEmpty(request.Outcome) ? "" : $". Outcome: {request.Outcome}")
        };
        _context.Activities.Add(activity);

        _context.Meetings.Update(meeting);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Complete", "Meeting", request.Id.ToString(),
            newValues: new { meeting.Status });

        var dto = new MeetingDto
        {
            Id = meeting.Id,
            LeadId = meeting.LeadId,
            LeadNumber = lead?.LeadNumber ?? string.Empty,
            CustomerName = lead?.CustomerName ?? string.Empty,
            UserId = meeting.UserId,
            UserName = user?.FullName ?? string.Empty,
            Title = meeting.Title,
            Description = meeting.Description,
            ScheduledDate = meeting.ScheduledDate,
            Duration = meeting.Duration,
            Location = meeting.Location,
            MeetingUrl = meeting.MeetingUrl,
            Status = meeting.Status,
            CompletedAt = meeting.CompletedAt,
            CreatedAt = meeting.CreatedAt
        };

        return Result<MeetingDto>.Success(dto, "Meeting completed successfully.");
    }
}
