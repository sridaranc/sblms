using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Notifications.Commands.DeleteNotification;
using SBLMS.Application.Features.Notifications.Commands.MarkAllAsRead;
using SBLMS.Application.Features.Notifications.Commands.MarkAsRead;
using SBLMS.Application.Features.Notifications.DTOs;
using SBLMS.Application.Features.Notifications.Queries.GetMyNotifications;
using SBLMS.Application.Features.Notifications.Queries.GetUnreadCount;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [HttpGet("my")]
    [ProducesResponseType(typeof(Result<List<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications([FromQuery] bool? unreadOnly, [FromQuery] int limit = 50, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        var result = await _mediator.Send(new GetMyNotificationsQuery { UnreadOnly = unreadOnly, Limit = limit });
        return Ok(result);
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(Result<NotificationStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var result = await _mediator.Send(new GetUnreadCountQuery());
        return Ok(result);
    }

    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var result = await _mediator.Send(new MarkAsReadCommand { NotificationId = id });
        return Ok(result);
    }

    [HttpPut("read-all")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var result = await _mediator.Send(new MarkAllAsReadCommand());
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var result = await _mediator.Send(new DeleteNotificationCommand { NotificationId = id });
        return Ok(result);
    }
}
