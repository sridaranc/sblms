using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Queries.GetFollowUpById;

public class GetFollowUpByIdQuery : IRequest<Result<FollowUpDto>>
{
    public Guid Id { get; set; }
}
