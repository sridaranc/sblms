using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Commands.UpdateFollowUp;

public class UpdateFollowUpCommand : IRequest<Result<FollowUpDto>>
{
    public Guid Id { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? ScheduledTime { get; set; }
    public string? Notes { get; set; }
}
