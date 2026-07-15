using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.FollowUps.Commands.CancelFollowUp;

public class CancelFollowUpCommandHandler : IRequestHandler<CancelFollowUpCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public CancelFollowUpCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<bool>> Handle(CancelFollowUpCommand request, CancellationToken cancellationToken)
    {
        var followUp = await _context.FollowUps.FindAsync(request.Id);
        if (followUp == null)
            throw new NotFoundException("FollowUp", request.Id);

        followUp.Status = FollowUpStatus.Cancelled;
        followUp.UpdatedAt = DateTime.UtcNow;

        _context.FollowUps.Update(followUp);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Cancel", "FollowUp", request.Id.ToString(),
            newValues: new { followUp.Status, Reason = request.Reason });

        return Result<bool>.Success(true, "Follow-up cancelled successfully.");
    }
}
