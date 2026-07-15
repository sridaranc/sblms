using MediatR;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Features.AuditLogs.DTOs;
using SBLMS.Application.Features.AuditLogs.Queries.GetAllAuditLogs;
using SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByDateRange;
using SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByEntity;
using SBLMS.Application.Features.AuditLogs.Queries.GetAuditLogByUser;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuditLogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetAllAuditLogsQuery query)
    {
        var result = await _mediator.Send(query);
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return Ok(result.Data);
    }

    [HttpGet("date-range")]
    public async Task<IActionResult> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string? entityType = null)
    {
        var result = await _mediator.Send(new GetAuditLogByDateRangeQuery
        {
            StartDate = startDate,
            EndDate = endDate,
            EntityName = entityType
        });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return Ok(result.Data);
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<IActionResult> GetByEntity(string entityType, string entityId)
    {
        var result = await _mediator.Send(new GetAuditLogByEntityQuery
        {
            EntityName = entityType,
            EntityId = entityId
        });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return Ok(result.Data);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(Guid userId, [FromQuery] int limit = 50)
    {
        var result = await _mediator.Send(new GetAuditLogByUserQuery
        {
            UserId = userId,
            Limit = limit
        });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return Ok(result.Data);
    }
}
