using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Meetings.Commands.UpdateMeeting;

public class UpdateMeetingCommandHandler : IRequestHandler<UpdateMeetingCommand, Result<MeetingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public UpdateMeetingCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<MeetingDto>> Handle(UpdateMeetingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await _context.Meetings.FindAsync(request.Id);
        if (meeting == null)
            throw new NotFoundException("Meeting", request.Id);

        var lead = await _context.Leads.FindAsync(meeting.LeadId);
        var user = await _context.Users.FindAsync(meeting.UserId);

        var oldValues = new { meeting.Title, meeting.ScheduledDate };

        meeting.Title = request.Title;
        meeting.Description = request.Description;
        meeting.ScheduledDate = request.ScheduledDate.Kind == DateTimeKind.Utc
            ? request.ScheduledDate
            : DateTime.SpecifyKind(request.ScheduledDate, DateTimeKind.Utc);
        meeting.Duration = request.Duration;
        meeting.Location = request.Location;
        meeting.MeetingUrl = request.MeetingUrl;
        meeting.UpdatedAt = DateTime.UtcNow;

        _context.Meetings.Update(meeting);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Update", "Meeting", request.Id.ToString(),
            oldValues: oldValues,
            newValues: new { request.Title, request.ScheduledDate });

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
            CreatedAt = meeting.CreatedAt
        };

        return Result<MeetingDto>.Success(dto, "Meeting updated successfully.");
    }
}
