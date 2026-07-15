namespace SBLMS.Application.Common.Interfaces;

public interface INotificationService
{
    Task CreateNotificationAsync(Guid userId, string title, string message, string type, string? link = null);
    Task CreateNotificationAsync(Guid userId, string title, string message, Domain.Common.Enums.NotificationType type, string? link = null);
    Task SendRealTimeNotificationAsync(Guid userId, string title, string message, string type, string? link = null);
}
