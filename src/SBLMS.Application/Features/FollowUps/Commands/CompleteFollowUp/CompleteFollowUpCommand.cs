using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FollowUps.DTOs;

namespace SBLMS.Application.Features.FollowUps.Commands.CompleteFollowUp;

public class CompleteFollowUpCommand : IRequest<Result<FollowUpDto>>
{
    public Guid Id { get; set; }
    public string? Outcome { get; set; }
    public string? Notes { get; set; }
}
