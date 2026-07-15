using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Notifications.DTOs;

namespace SBLMS.Application.Features.Notifications.Queries.GetUnreadCount;

public class GetUnreadCountQuery : IRequest<Result<NotificationStatsDto>>
{
}
