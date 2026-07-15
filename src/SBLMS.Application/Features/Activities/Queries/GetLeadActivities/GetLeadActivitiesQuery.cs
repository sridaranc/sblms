using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.DTOs;

namespace SBLMS.Application.Features.Activities.Queries.GetLeadActivities;

public class GetLeadActivitiesQuery : IRequest<Result<List<ActivityDto>>>
{
    public Guid LeadId { get; set; }
    public int Limit { get; set; } = 50;
}
