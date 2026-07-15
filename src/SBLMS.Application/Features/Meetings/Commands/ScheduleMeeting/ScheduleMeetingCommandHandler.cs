using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Meetings.Commands.ScheduleMeeting;

public class ScheduleMeetingCommandHandler : IRequestHandler<ScheduleMeetingCommand, Result<MeetingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public ScheduleMeetingCommandHandler(
        IApplicationDbContext context,
        IAuditService auditService,
        INotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<Result<MeetingDto>> Handle(ScheduleMeetingCommand request, CancellationToken cancellationToken)
    {
        var lead = await _context.Leads.FindAsync(request.LeadId);
        if (lead == null)
            throw new NotFoundException("Lead", request.LeadId);

        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
            throw new NotFoundException("User", request.UserId);

        var meeting = new Meeting
        {
            LeadId = request.LeadId,
            UserId = request.UserId,
            Title = request.Title,
            Description = request.Description,
            ScheduledDate = request.ScheduledDate.Kind == DateTimeKind.Utc
                ? request.ScheduledDate
                : DateTime.SpecifyKind(request.ScheduledDate, DateTimeKind.Utc),
            Duration = request.Duration,
            Location = request.Location,
            MeetingUrl = request.MeetingUrl,
            Status = MeetingStatus.Scheduled
        };

        _context.Meetings.Add(meeting);

        var activity = new Activity
        {
            LeadId = request.LeadId,
            UserId = request.UserId,
            Type = ActivityType.Meeting,
            Description = $"Meeting scheduled: {request.Title} for {request.ScheduledDate:yyyy-MM-dd HH:mm}"
        };
        _context.Activities.Add(activity);

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Create", "Meeting", meeting.Id.ToString(),
            newValues: new { meeting.Title, meeting.ScheduledDate });

        await _notificationService.CreateNotificationAsync(
            request.UserId,
            "Meeting Scheduled",
            $"Meeting '{request.Title}' scheduled for {request.ScheduledDate:yyyy-MM-dd HH:mm}",
            NotificationType.Info,
            $"/leads/{lead.Id}");

        var dto = new MeetingDto
        {
            Id = meeting.Id,
            LeadId = meeting.LeadId,
            LeadNumber = lead.LeadNumber,
            CustomerName = lead.CustomerName,
            UserId = meeting.UserId,
            UserName = user.FullName,
            Title = meeting.Title,
            Description = meeting.Description,
            ScheduledDate = meeting.ScheduledDate,
            Duration = meeting.Duration,
            Location = meeting.Location,
            MeetingUrl = meeting.MeetingUrl,
            Status = meeting.Status,
            CreatedAt = meeting.CreatedAt
        };

        return Result<MeetingDto>.Success(dto, "Meeting scheduled successfully.");
    }
}
