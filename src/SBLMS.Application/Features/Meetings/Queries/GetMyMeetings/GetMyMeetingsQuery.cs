using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Queries.GetMyMeetings;

public class GetMyMeetingsQuery : IRequest<Result<List<MeetingDto>>>
{
    public bool? IncludeCompleted { get; set; }
}
