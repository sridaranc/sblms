using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Queries.GetFollowUpsByLead;

public class GetFollowUpsByLeadQuery : IRequest<Result<List<FollowUpDto>>>
{
    public Guid LeadId { get; set; }
}
