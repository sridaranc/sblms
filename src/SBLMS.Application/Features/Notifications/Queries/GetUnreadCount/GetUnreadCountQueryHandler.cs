using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Notifications.DTOs;

namespace SBLMS.Application.Features.Notifications.Queries.GetUnreadCount;

public class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, Result<NotificationStatsDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUnreadCountQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<NotificationStatsDto>> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
            return Result<NotificationStatsDto>.Failure("User not authenticated.");

        var totalCount = await _context.Notifications
            .CountAsync(n => n.UserId == _currentUserService.UserId.Value, cancellationToken);

        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == _currentUserService.UserId.Value && !n.IsRead, cancellationToken);

        var stats = new NotificationStatsDto
        {
            TotalNotifications = totalCount,
            UnreadCount = unreadCount
        };

        return Result<NotificationStatsDto>.Success(stats);
    }
}
