using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommand : IRequest<Result<bool>>
{
    public Guid NotificationId { get; set; }
}
