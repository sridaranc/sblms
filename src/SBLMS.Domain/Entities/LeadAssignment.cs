using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class LeadAssignment : BaseEntity
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public Guid? AssignedBy { get; set; }
    public bool IsActive { get; set; } = true;

    public Lead Lead { get; set; } = null!;
    public User User { get; set; } = null!;
}
