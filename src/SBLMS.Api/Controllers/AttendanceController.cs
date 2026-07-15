using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Attendance.Commands.CheckIn;
using SBLMS.Application.Features.Attendance.Commands.CheckOut;
using SBLMS.Application.Features.Attendance.Commands.ManualEntry;
using SBLMS.Application.Features.Attendance.Queries.GetAttendance;
using SBLMS.Application.Features.Attendance.Queries.GetAttendanceStats;
using SBLMS.Application.Features.Attendance.Queries.GetTeamAttendance;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttendanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("check-in")]
    [ProducesResponseType(typeof(Result<CheckInResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CheckInResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckIn([FromBody] CheckInCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("check-out")]
    [ProducesResponseType(typeof(Result<CheckOutResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CheckOutResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("manual")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<ManualAttendanceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ManualAttendanceResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ManualEntry([FromBody] ManualAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(Result<List<AttendanceResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttendance([FromQuery] Guid? userId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = new GetAttendanceQuery
        {
            UserId = userId,
            StartDate = startDate,
            EndDate = endDate
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(Result<AttendanceStatsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttendanceStats([FromQuery] Guid? userId, [FromQuery] string? month)
    {
        var query = new GetAttendanceStatsQuery
        {
            UserId = userId,
            Month = month
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("team")]
    [ProducesResponseType(typeof(Result<List<TeamAttendanceResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTeamAttendance([FromQuery] string? date)
    {
        var query = new GetTeamAttendanceQuery
        {
            Date = date
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
