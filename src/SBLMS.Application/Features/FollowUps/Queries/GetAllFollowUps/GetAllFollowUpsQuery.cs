using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Queries.GetAllFollowUps;

public class GetAllFollowUpsQuery : IRequest<Result<List<FollowUpDto>>>
{
    public string? Status { get; set; }
    public Guid? LeadId { get; set; }
    public Guid? UserId { get; set; }
}
