using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FollowUps.Commands.CancelFollowUp;

public class CancelFollowUpCommand : IRequest<Result<bool>>
{
    public Guid Id { get; set; }
    public string? Reason { get; set; }
}
