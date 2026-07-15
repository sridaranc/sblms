using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Queries.GetMeetingById;

public class GetMeetingByIdQuery : IRequest<Result<MeetingDto>>
{
    public Guid Id { get; set; }
}
