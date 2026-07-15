using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class AiLeadRequest : AuditableEntity
{
    public string Keywords { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Prompt { get; set; }
    public string AiProvider { get; set; } = "OpenAI";
    public int ResultsCount { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public ICollection<AiLeadResult> Results { get; set; } = new List<AiLeadResult>();
}
