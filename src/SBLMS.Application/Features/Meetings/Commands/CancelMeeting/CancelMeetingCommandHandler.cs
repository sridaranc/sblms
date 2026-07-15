using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Meetings.Commands.CancelMeeting;

public class CancelMeetingCommandHandler : IRequestHandler<CancelMeetingCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public CancelMeetingCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<bool>> Handle(CancelMeetingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await _context.Meetings.FindAsync(request.Id);
        if (meeting == null)
            throw new NotFoundException("Meeting", request.Id);

        meeting.Status = MeetingStatus.Cancelled;
        meeting.UpdatedAt = DateTime.UtcNow;

        _context.Meetings.Update(meeting);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Cancel", "Meeting", request.Id.ToString(),
            newValues: new { meeting.Status, Reason = request.Reason });

        return Result<bool>.Success(true, "Meeting cancelled successfully.");
    }
}
