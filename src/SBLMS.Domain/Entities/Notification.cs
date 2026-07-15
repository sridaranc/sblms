using SBLMS.Domain.Common;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public bool IsRead { get; set; }
    public string? Link { get; set; }

    public User User { get; set; } = null!;
}
