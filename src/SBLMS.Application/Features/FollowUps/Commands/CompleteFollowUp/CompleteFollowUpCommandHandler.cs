using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.FollowUps.Commands.CompleteFollowUp;

public class CompleteFollowUpCommandHandler : IRequestHandler<CompleteFollowUpCommand, Result<FollowUpDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public CompleteFollowUpCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    public async Task<Result<FollowUpDto>> Handle(CompleteFollowUpCommand request, CancellationToken cancellationToken)
    {
        var followUp = await _context.FollowUps.FindAsync(request.Id);
        if (followUp == null)
            throw new NotFoundException("FollowUp", request.Id);

        var lead = await _context.Leads.FindAsync(followUp.LeadId);
        var user = await _context.Users.FindAsync(followUp.UserId);

        followUp.Status = FollowUpStatus.Completed;
        followUp.Outcome = request.Outcome;
        followUp.CompletedAt = DateTime.UtcNow;
        followUp.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.Notes))
        {
            followUp.Notes = string.IsNullOrEmpty(followUp.Notes)
                ? request.Notes
                : $"{followUp.Notes}\n\n{request.Notes}";
        }

        var activity = new Activity
        {
            LeadId = followUp.LeadId,
            UserId = _currentUserService.UserId ?? Guid.Empty,
            Type = ActivityType.FollowUp,
            Description = $"Follow-up completed" +
                          (string.IsNullOrEmpty(request.Outcome) ? "" : $". Outcome: {request.Outcome}")
        };
        _context.Activities.Add(activity);

        _context.FollowUps.Update(followUp);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Complete", "FollowUp", request.Id.ToString(),
            newValues: new { followUp.Status, followUp.Outcome });

        var dto = new FollowUpDto
        {
            Id = followUp.Id,
            LeadId = followUp.LeadId,
            LeadNumber = lead?.LeadNumber ?? string.Empty,
            CustomerName = lead?.CustomerName ?? string.Empty,
            UserId = followUp.UserId,
            UserName = user?.FullName ?? string.Empty,
            ScheduledDate = followUp.ScheduledDate,
            ScheduledTime = followUp.ScheduledTime,
            Status = followUp.Status,
            Notes = followUp.Notes,
            Outcome = followUp.Outcome,
            CompletedAt = followUp.CompletedAt,
            CreatedAt = followUp.CreatedAt
        };

        return Result<FollowUpDto>.Success(dto, "Follow-up completed successfully.");
    }
}
