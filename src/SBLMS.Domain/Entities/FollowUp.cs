using SBLMS.Domain.Common;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Entities;

public class FollowUp : AuditableEntity
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public FollowUpStatus Status { get; set; } = FollowUpStatus.Pending;
    public string? Notes { get; set; }
    public string? Outcome { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Lead Lead { get; set; } = null!;
    public User User { get; set; } = null!;
}
