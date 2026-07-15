using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Queries.GetMyFollowUps;

public class GetMyFollowUpsQuery : IRequest<Result<List<FollowUpDto>>>
{
    public bool? IncludeCompleted { get; set; }
}
