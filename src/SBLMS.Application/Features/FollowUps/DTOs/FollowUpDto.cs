using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.FollowUps.DTOs;

public class FollowUpDto
{
    public Guid Id { get; set; }
    public Guid LeadId { get; set; }
    public string LeadNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public FollowUpStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Notes { get; set; }
    public string? Outcome { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateFollowUpDto
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public string? Notes { get; set; }
}

public class UpdateFollowUpDto
{
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public string? Notes { get; set; }
}

public class CompleteFollowUpDto
{
    public string? Outcome { get; set; }
    public string? Notes { get; set; }
}

public class FollowUpStatisticsDto
{
    public int TotalFollowUps { get; set; }
    public int PendingFollowUps { get; set; }
    public int CompletedFollowUps { get; set; }
    public int OverdueFollowUps { get; set; }
    public int TodayFollowUps { get; set; }
}
