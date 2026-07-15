using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Notifications.DTOs;

namespace SBLMS.Application.Features.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQuery : IRequest<Result<List<NotificationDto>>>
{
    public bool? UnreadOnly { get; set; }
    public int Limit { get; set; } = 50;
}
