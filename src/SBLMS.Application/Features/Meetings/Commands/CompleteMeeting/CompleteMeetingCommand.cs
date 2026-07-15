using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Meetings.DTOs;

namespace SBLMS.Application.Features.Meetings.Commands.CompleteMeeting;

public class CompleteMeetingCommand : IRequest<Result<MeetingDto>>
{
    public Guid Id { get; set; }
    public string? Outcome { get; set; }
    public string? Notes { get; set; }
}
