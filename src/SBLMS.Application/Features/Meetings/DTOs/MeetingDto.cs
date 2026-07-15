using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Meetings.DTOs;

public class MeetingDto
{
    public Guid Id { get; set; }
    public Guid LeadId { get; set; }
    public string LeadNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? Location { get; set; }
    public string? MeetingUrl { get; set; }
    public MeetingStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMeetingDto
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? Location { get; set; }
    public string? MeetingUrl { get; set; }
}

public class UpdateMeetingDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? Location { get; set; }
    public string? MeetingUrl { get; set; }
}

public class CompleteMeetingDto
{
    public string? Outcome { get; set; }
    public string? Notes { get; set; }
}
