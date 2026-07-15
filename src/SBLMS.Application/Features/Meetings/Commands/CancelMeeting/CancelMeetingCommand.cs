using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Meetings.Commands.CancelMeeting;

public class CancelMeetingCommand : IRequest<Result<bool>>
{
    public Guid Id { get; set; }
    public string? Reason { get; set; }
}
