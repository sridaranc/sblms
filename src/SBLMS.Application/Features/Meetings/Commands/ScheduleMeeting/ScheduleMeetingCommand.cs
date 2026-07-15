using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Commands.ScheduleMeeting;

public class ScheduleMeetingCommand : IRequest<Result<MeetingDto>>
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
