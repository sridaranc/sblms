using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Queries.GetMeetingsByDateRange;

public class GetMeetingsByDateRangeQuery : IRequest<Result<List<MeetingDto>>>
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
