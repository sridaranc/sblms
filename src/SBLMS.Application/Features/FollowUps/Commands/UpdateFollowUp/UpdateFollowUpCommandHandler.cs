using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.FollowUps.Commands.UpdateFollowUp;

public class UpdateFollowUpCommandHandler : IRequestHandler<UpdateFollowUpCommand, Result<FollowUpDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public UpdateFollowUpCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<FollowUpDto>> Handle(UpdateFollowUpCommand request, CancellationToken cancellationToken)
    {
        var followUp = await _context.FollowUps.FindAsync(request.Id);
        if (followUp == null)
            throw new NotFoundException("FollowUp", request.Id);

        var lead = await _context.Leads.FindAsync(followUp.LeadId);
        var user = await _context.Users.FindAsync(followUp.UserId);

        var oldValues = new { followUp.ScheduledDate, followUp.Notes };

        followUp.ScheduledDate = request.ScheduledDate.Kind == DateTimeKind.Utc
            ? request.ScheduledDate
            : DateTime.SpecifyKind(request.ScheduledDate, DateTimeKind.Utc);
        followUp.ScheduledTime = request.ScheduledTime;
        followUp.Notes = request.Notes;
        followUp.UpdatedAt = DateTime.UtcNow;

        _context.FollowUps.Update(followUp);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Update", "FollowUp", request.Id.ToString(),
            oldValues: oldValues,
            newValues: new { request.ScheduledDate, request.Notes });

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
            CreatedAt = followUp.CreatedAt
        };

        return Result<FollowUpDto>.Success(dto, "Follow-up updated successfully.");
    }
}
