using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.FollowUps.Commands.CreateFollowUp;

public class CreateFollowUpCommandHandler : IRequestHandler<CreateFollowUpCommand, Result<FollowUpDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public CreateFollowUpCommandHandler(
        IApplicationDbContext context,
        IAuditService auditService,
        INotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<Result<FollowUpDto>> Handle(CreateFollowUpCommand request, CancellationToken cancellationToken)
    {
        var lead = await _context.Leads.FindAsync(request.LeadId);
        if (lead == null)
            throw new NotFoundException("Lead", request.LeadId);

        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
            throw new NotFoundException("User", request.UserId);

        var followUp = new FollowUp
        {
            LeadId = request.LeadId,
            UserId = request.UserId,
            ScheduledDate = request.ScheduledDate.Kind == DateTimeKind.Utc
                ? request.ScheduledDate
                : DateTime.SpecifyKind(request.ScheduledDate, DateTimeKind.Utc),
            ScheduledTime = request.ScheduledTime,
            Notes = request.Notes,
            Status = FollowUpStatus.Pending
        };

        _context.FollowUps.Add(followUp);

        var activity = new Activity
        {
            LeadId = request.LeadId,
            UserId = request.UserId,
            Type = ActivityType.FollowUp,
            Description = $"Follow-up scheduled for {request.ScheduledDate:yyyy-MM-dd}" +
                          (string.IsNullOrEmpty(request.ScheduledTime) ? "" : $" at {request.ScheduledTime}")
        };
        _context.Activities.Add(activity);

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Create", "FollowUp", followUp.Id.ToString(),
            newValues: new { followUp.LeadId, followUp.ScheduledDate });

        await _notificationService.CreateNotificationAsync(
            request.UserId,
            "Follow-Up Scheduled",
            $"A follow-up has been scheduled for lead {lead.LeadNumber} on {request.ScheduledDate:yyyy-MM-dd}",
            NotificationType.Info,
            $"/leads/{lead.Id}");

        var dto = new FollowUpDto
        {
            Id = followUp.Id,
            LeadId = followUp.LeadId,
            LeadNumber = lead.LeadNumber,
            CustomerName = lead.CustomerName,
            UserId = followUp.UserId,
            UserName = user.FullName,
            ScheduledDate = followUp.ScheduledDate,
            ScheduledTime = followUp.ScheduledTime,
            Status = followUp.Status,
            Notes = followUp.Notes,
            CreatedAt = followUp.CreatedAt
        };

        return Result<FollowUpDto>.Success(dto, "Follow-up created successfully.");
    }
}
