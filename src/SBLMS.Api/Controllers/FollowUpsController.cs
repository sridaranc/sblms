using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Features.FollowUps.Commands.CancelFollowUp;
using SBLMS.Application.Features.FollowUps.Commands.CompleteFollowUp;
using SBLMS.Application.Features.FollowUps.Commands.CreateFollowUp;
using SBLMS.Application.Features.FollowUps.Commands.UpdateFollowUp;
using SBLMS.Application.Features.FollowUps.DTOs;
using SBLMS.Application.Features.FollowUps.Queries.GetAllFollowUps;
using SBLMS.Application.Features.FollowUps.Queries.GetFollowUpById;
using SBLMS.Application.Features.FollowUps.Queries.GetFollowUpsByLead;
using SBLMS.Application.Features.FollowUps.Queries.GetMyFollowUps;
using SBLMS.Application.Features.FollowUps.Queries.GetOverdueFollowUps;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowUpsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public FollowUpsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<List<FollowUpDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllFollowUps(
        [FromQuery] string? status,
        [FromQuery] Guid? leadId,
        [FromQuery] Guid? userId)
    {
        var result = await _mediator.Send(new GetAllFollowUpsQuery
        {
            Status = status,
            LeadId = leadId,
            UserId = userId
        });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Result<FollowUpDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFollowUpById(Guid id)
    {
        var result = await _mediator.Send(new GetFollowUpByIdQuery { Id = id });
        return Ok(result);
    }

    [HttpGet("lead/{leadId:guid}")]
    [ProducesResponseType(typeof(Result<List<FollowUpDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFollowUpsByLead(Guid leadId)
    {
        var result = await _mediator.Send(new GetFollowUpsByLeadQuery { LeadId = leadId });
        return Ok(result);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(Result<List<FollowUpDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyFollowUps([FromQuery] bool? includeCompleted)
    {
        var result = await _mediator.Send(new GetMyFollowUpsQuery { IncludeCompleted = includeCompleted });
        return Ok(result);
    }

    [HttpGet("overdue")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<List<FollowUpDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverdueFollowUps()
    {
        var result = await _mediator.Send(new GetOverdueFollowUpsQuery());
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<FollowUpDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result<FollowUpDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFollowUp([FromBody] CreateFollowUpDto dto)
    {
        var command = new CreateFollowUpCommand
        {
            LeadId = dto.LeadId,
            UserId = _currentUser.UserId ?? dto.UserId,
            ScheduledDate = dto.ScheduledDate,
            ScheduledTime = dto.ScheduledTime,
            Notes = dto.Notes
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetFollowUpsByLead), new { leadId = dto.LeadId }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(Result<FollowUpDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFollowUp(Guid id, [FromBody] UpdateFollowUpDto dto)
    {
        var command = new UpdateFollowUpCommand
        {
            Id = id,
            ScheduledDate = dto.ScheduledDate,
            ScheduledTime = dto.ScheduledTime,
            Notes = dto.Notes
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}/complete")]
    [ProducesResponseType(typeof(Result<FollowUpDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteFollowUp(Guid id, [FromBody] CompleteFollowUpDto dto)
    {
        var command = new CompleteFollowUpCommand
        {
            Id = id,
            Outcome = dto.Outcome,
            Notes = dto.Notes
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}/cancel")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelFollowUp(Guid id, [FromBody] CancelFollowUpCommand command)
    {
        command.Id = id;
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
