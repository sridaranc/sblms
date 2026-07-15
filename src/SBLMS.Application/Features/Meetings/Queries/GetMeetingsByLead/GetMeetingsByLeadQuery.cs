using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Queries.GetMeetingsByLead;

public class GetMeetingsByLeadQuery : IRequest<Result<List<MeetingDto>>>
{
    public Guid LeadId { get; set; }
}
