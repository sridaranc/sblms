using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Activities.Commands.LogActivity;
using SBLMS.Application.Features.Activities.DTOs;
using SBLMS.Application.Features.Activities.Queries.GetLeadActivities;
using SBLMS.Application.Features.Activities.Queries.GetMyRecentActivities;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActivitiesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("lead/{leadId:guid}")]
    [ProducesResponseType(typeof(Result<List<ActivityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeadActivities(Guid leadId, [FromQuery] int limit = 50)
    {
        var result = await _mediator.Send(new GetLeadActivitiesQuery { LeadId = leadId, Limit = limit });
        return Ok(result);
    }

    [HttpGet("my/recent")]
    [ProducesResponseType(typeof(Result<List<ActivityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRecentActivities([FromQuery] int limit = 20)
    {
        var result = await _mediator.Send(new GetMyRecentActivitiesQuery { Limit = limit });
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<ActivityDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> LogActivity([FromBody] LogActivityDto dto)
    {
        var command = new LogActivityCommand
        {
            LeadId = dto.LeadId,
            Type = dto.Type,
            Description = dto.Description,
            Metadata = dto.Metadata
        };
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetLeadActivities), new { leadId = dto.LeadId }, result);
    }
}
