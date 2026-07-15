using MediatR;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public MarkAsReadCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(MarkAsReadCommand request, CancellationToken cancellationToken)
    {
        var notification = await _context.Notifications.FindAsync(request.NotificationId);
        if (notification == null)
            throw new NotFoundException("Notification", request.NotificationId);

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;

        _context.Notifications.Update(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Notification marked as read.");
    }
}
