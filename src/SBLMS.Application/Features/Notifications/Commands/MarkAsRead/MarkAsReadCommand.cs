using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Notifications.DTOs;

namespace SBLMS.Application.Features.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommand : IRequest<Result<bool>>
{
    public Guid NotificationId { get; set; }
}
