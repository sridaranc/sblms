using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class LeadContactPerson : AuditableEntity
{
    public Guid LeadId { get; set; }
    public int SortOrder { get; set; }
    public string? Name { get; set; }
    public string? Designation { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }

    public Lead Lead { get; set; } = null!;
}
