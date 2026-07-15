using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Commands.CreateFollowUp;

public class CreateFollowUpCommand : IRequest<Result<FollowUpDto>>
{
    public Guid LeadId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public string? Notes { get; set; }
}
