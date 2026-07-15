using SBLMS.Domain.Common;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Entities;

public class Activity : BaseEntity
{
    public Guid? LeadId { get; set; }
    public Guid UserId { get; set; }
    public ActivityType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Metadata { get; set; }

    public Lead? Lead { get; set; }
    public User User { get; set; } = null!;
}
