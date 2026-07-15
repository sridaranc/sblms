using SBLMS.Domain.Common;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Entities;

public class Meeting : AuditableEntity
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? Location { get; set; }
    public string? MeetingUrl { get; set; }
    public MeetingType MeetingType { get; set; } = MeetingType.GoogleMeet;
    public string? ClientEmail { get; set; }
    public string? ClientName { get; set; }
    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;
    public MeetingSetupStatus SetupStatus { get; set; } = MeetingSetupStatus.NotStarted;
    public Guid? SetupByUserId { get; set; }
    public User? SetupByUser { get; set; }
    public DateTime? SentAt { get; set; }
    public string? SentToEmail { get; set; }
    public ClientMeetingResponse ClientResponse { get; set; } = ClientMeetingResponse.Pending;
    public DateTime? ClientRespondedAt { get; set; }
    public string? AttendeeEmails { get; set; }
    public string? AttendeeNames { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Lead Lead { get; set; } = null!;
    public User User { get; set; } = null!;
}
