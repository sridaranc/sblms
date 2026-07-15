using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.DTOs;

namespace SBLMS.Application.Features.Activities.Queries.GetMyRecentActivities;

public class GetMyRecentActivitiesQuery : IRequest<Result<List<ActivityDto>>>
{
    public int Limit { get; set; } = 20;
}
