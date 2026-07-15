using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace SBLMS.Api.Hubs;

public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        var roles = Context.User?.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value) ?? Enumerable.Empty<string>();

        foreach (var role in roles)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendNotificationToUser(string userId, string title, string message, string type, string? link = null)
    {
        await Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
        {
            title,
            message,
            type,
            link,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task SendNotificationToRole(string role, string title, string message, string type, string? link = null)
    {
        await Clients.Group($"role_{role}").SendAsync("ReceiveNotification", new
        {
            title,
            message,
            type,
            link,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyLeadUpdated(Guid leadId, string action)
    {
        await Clients.All.SendAsync("LeadUpdated", new
        {
            leadId,
            action,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyFollowUpReminder(Guid userId, string leadNumber, string customerName, DateTime scheduledDate)
    {
        await Clients.Group($"user_{userId}").SendAsync("FollowUpReminder", new
        {
            leadNumber,
            customerName,
            scheduledDate,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyMeetingReminder(Guid userId, string title, DateTime scheduledDate)
    {
        await Clients.Group($"user_{userId}").SendAsync("MeetingReminder", new
        {
            title,
            scheduledDate,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyStatusChanged(Guid leadId, string oldStatus, string newStatus)
    {
        await Clients.All.SendAsync("LeadStatusChanged", new
        {
            leadId,
            oldStatus,
            newStatus,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyLeadAssigned(Guid userId, string leadNumber, string customerName)
    {
        await Clients.Group($"user_{userId}").SendAsync("LeadAssigned", new
        {
            leadNumber,
            customerName,
            timestamp = DateTime.UtcNow
        });
    }
}
