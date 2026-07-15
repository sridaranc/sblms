using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Notifications.Commands.MarkAllAsRead;

public class MarkAllAsReadCommand : IRequest<Result<bool>>
{
}
