using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Features.Meetings.Commands.CancelMeeting;
using SBLMS.Application.Features.Meetings.Commands.CompleteMeeting;
using SBLMS.Application.Features.Meetings.Commands.ScheduleMeeting;
using SBLMS.Application.Features.Meetings.Commands.UpdateMeeting;
using SBLMS.Application.Features.Meetings.DTOs;
using SBLMS.Application.Features.Meetings.Queries.GetAllMeetings;
using SBLMS.Application.Features.Meetings.Queries.GetMeetingById;
using SBLMS.Application.Features.Meetings.Queries.GetMeetingsByDateRange;
using SBLMS.Application.Features.Meetings.Queries.GetMeetingsByLead;
using SBLMS.Application.Features.Meetings.Queries.GetMyMeetings;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public MeetingsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<List<MeetingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllMeetings(
        [FromQuery] string? status,
        [FromQuery] Guid? userId,
        [FromQuery] Guid? leadId)
    {
        var result = await _mediator.Send(new GetAllMeetingsQuery
        {
            Status = status,
            UserId = userId,
            LeadId = leadId
        });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Result<MeetingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMeetingById(Guid id)
    {
        var result = await _mediator.Send(new GetMeetingByIdQuery { Id = id });
        return Ok(result);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(Result<List<MeetingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyMeetings([FromQuery] bool? includeCompleted)
    {
        var result = await _mediator.Send(new GetMyMeetingsQuery { IncludeCompleted = includeCompleted });
        return Ok(result);
    }

    [HttpGet("by-date-range")]
    [ProducesResponseType(typeof(Result<List<MeetingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeetingsByDateRange([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var result = await _mediator.Send(new GetMeetingsByDateRangeQuery
        {
            StartDate = start,
            EndDate = end
        });
        return Ok(result);
    }

    [HttpGet("lead/{leadId:guid}")]
    [ProducesResponseType(typeof(Result<List<MeetingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeetingsByLead(Guid leadId)
    {
        var result = await _mediator.Send(new GetMeetingsByLeadQuery { LeadId = leadId });
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<MeetingDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result<MeetingDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ScheduleMeeting([FromBody] CreateMeetingDto dto)
    {
        var command = new ScheduleMeetingCommand
        {
            LeadId = dto.LeadId,
            UserId = _currentUser.UserId ?? dto.UserId,
            Title = dto.Title,
            Description = dto.Description,
            ScheduledDate = dto.ScheduledDate,
            Duration = dto.Duration,
            Location = dto.Location,
            MeetingUrl = dto.MeetingUrl
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetMeetingsByLead), new { leadId = dto.LeadId }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(Result<MeetingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMeeting(Guid id, [FromBody] UpdateMeetingDto dto)
    {
        var command = new UpdateMeetingCommand
        {
            Id = id,
            Title = dto.Title,
            Description = dto.Description,
            ScheduledDate = dto.ScheduledDate,
            Duration = dto.Duration,
            Location = dto.Location,
            MeetingUrl = dto.MeetingUrl
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}/cancel")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelMeeting(Guid id, [FromBody] CancelMeetingCommand command)
    {
        command.Id = id;
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}/complete")]
    [ProducesResponseType(typeof(Result<MeetingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteMeeting(Guid id, [FromBody] CompleteMeetingDto dto)
    {
        var command = new CompleteMeetingCommand
        {
            Id = id,
            Outcome = dto.Outcome,
            Notes = dto.Notes
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
