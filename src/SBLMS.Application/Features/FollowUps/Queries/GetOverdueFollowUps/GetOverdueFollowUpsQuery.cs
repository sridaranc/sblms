using MediatR;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Queries.GetOverdueFollowUps;

public class GetOverdueFollowUpsQuery : IRequest<Result<List<FollowUpDto>>>
{
}
