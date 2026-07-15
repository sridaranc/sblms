using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Queries.GetAllMeetings;

public class GetAllMeetingsQuery : IRequest<Result<List<MeetingDto>>>
{
    public string? Status { get; set; }
    public Guid? UserId { get; set; }
    public Guid? LeadId { get; set; }
}
