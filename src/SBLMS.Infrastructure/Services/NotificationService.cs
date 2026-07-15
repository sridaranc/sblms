using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;
using SBLMS.Infrastructure.Persistence;

namespace SBLMS.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly SBLMSDbContext _context;

    public NotificationService(SBLMSDbContext context)
    {
        _context = context;
    }

    public async Task CreateNotificationAsync(Guid userId, string title, string message, string type, string? link = null)
    {
        var notificationType = Enum.TryParse<NotificationType>(type, true, out var parsed)
            ? parsed : NotificationType.Info;

        await CreateNotificationAsync(userId, title, message, notificationType, link);
    }

    public async Task CreateNotificationAsync(Guid userId, string title, string message, NotificationType type, string? link = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Link = link,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public Task SendRealTimeNotificationAsync(Guid userId, string title, string message, string type, string? link = null)
    {
        // SignalR notification will be handled by the hub
        // This is called from the API layer after creating the notification
        return Task.CompletedTask;
    }
}
