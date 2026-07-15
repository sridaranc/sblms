using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Activities.DTOs;

public class ActivityDto
{
    public Guid Id { get; set; }
    public Guid? LeadId { get; set; }
    public string? LeadNumber { get; set; }
    public string? CustomerName { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public ActivityType Type { get; set; }
    public string TypeName => Type.ToString();
    public string Description { get; set; } = string.Empty;
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class LogActivityDto
{
    public Guid? LeadId { get; set; }
    public ActivityType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Metadata { get; set; }
}
