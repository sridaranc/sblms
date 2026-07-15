using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class ClientProject : AuditableEntity
{
    public Guid ClientId { get; set; }
    public Client? Client { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Budget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "Planning";
    public string? Notes { get; set; }
}
