using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.Commands.ExportAttendanceToExcel;
using SBLMS.Application.Features.Reports.Commands.ExportAttendanceToPdf;
using SBLMS.Application.Features.Reports.Commands.ExportClientsToExcel;
using SBLMS.Application.Features.Reports.Commands.ExportClientsToPdf;
using SBLMS.Application.Features.Reports.Commands.ExportFollowUpsToExcel;
using SBLMS.Application.Features.Reports.Commands.ExportFollowUpsToPdf;
using SBLMS.Application.Features.Reports.Commands.ExportLeadsToExcel;
using SBLMS.Application.Features.Reports.Commands.ExportMeetingsToExcel;
using SBLMS.Application.Features.Reports.Commands.ExportMeetingsToPdf;
using SBLMS.Application.Features.Reports.Commands.ExportPerformanceToPdf;
using SBLMS.Application.Features.Reports.Commands.ExportUsersToExcel;
using SBLMS.Application.Features.Reports.Commands.ExportUsersToPdf;
using SBLMS.Application.Features.Reports.Queries.GetAttendanceReport;
using SBLMS.Application.Features.Reports.Queries.GetClientReport;
using SBLMS.Application.Features.Reports.Queries.GetConversionReport;
using SBLMS.Application.Features.Reports.Queries.GetDashboardStats;
using SBLMS.Application.Features.Reports.Queries.GetFollowUpReport;
using SBLMS.Application.Features.Reports.Queries.GetLeadsByStatusReport;
using SBLMS.Application.Features.Reports.Queries.GetMeetingReport;
using SBLMS.Application.Features.Reports.Queries.GetPerformanceReport;
using SBLMS.Application.Features.Reports.Queries.GetUserEntryReport;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var result = await _mediator.Send(new GetDashboardStatsQuery());
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("leads-by-status")]
    public async Task<IActionResult> GetLeadsByStatus()
    {
        var result = await _mediator.Send(new GetLeadsByStatusReportQuery());
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("conversion")]
    public async Task<IActionResult> GetConversionReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetConversionReportQuery { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformanceReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetPerformanceReportQuery { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("followups")]
    public async Task<IActionResult> GetFollowUpReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetFollowUpReportQuery { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("meetings")]
    public async Task<IActionResult> GetMeetingReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetMeetingReportQuery { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendanceReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new GetAttendanceReportQuery { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("clients")]
    public async Task<IActionResult> GetClientReport()
    {
        var result = await _mediator.Send(new GetClientReportQuery());
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUserEntryReport()
    {
        var result = await _mediator.Send(new GetUserEntryReportQuery());
        if (!result.IsSuccess) return BadRequest(Result<object>.Failure(result.Errors));
        return Ok(Result<object>.Success(result.Data));
    }

    [HttpGet("export/leads/excel")]
    public async Task<IActionResult> ExportLeadsToExcel()
    {
        var result = await _mediator.Send(new ExportLeadsToExcelCommand());
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Leads.xlsx");
    }

    [HttpGet("export/performance/pdf")]
    public async Task<IActionResult> ExportPerformanceToPdf()
    {
        var result = await _mediator.Send(new ExportPerformanceToPdfCommand());
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/pdf", "Performance.pdf");
    }

    [HttpGet("export/followups/excel")]
    public async Task<IActionResult> ExportFollowUpsToExcel([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new ExportFollowUpsToExcelCommand { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "FollowUps.xlsx");
    }

    [HttpGet("export/meetings/excel")]
    public async Task<IActionResult> ExportMeetingsToExcel([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new ExportMeetingsToExcelCommand { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Meetings.xlsx");
    }

    [HttpGet("export/attendance/excel")]
    public async Task<IActionResult> ExportAttendanceToExcel([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new ExportAttendanceToExcelCommand { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Attendance.xlsx");
    }

    [HttpGet("export/clients/excel")]
    public async Task<IActionResult> ExportClientsToExcel()
    {
        var result = await _mediator.Send(new ExportClientsToExcelCommand());
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Clients.xlsx");
    }

    [HttpGet("export/users/excel")]
    public async Task<IActionResult> ExportUsersToExcel()
    {
        var result = await _mediator.Send(new ExportUsersToExcelCommand());
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Users.xlsx");
    }

    [HttpGet("export/followups/pdf")]
    public async Task<IActionResult> ExportFollowUpsToPdf([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new ExportFollowUpsToPdfCommand { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/pdf", "FollowUps.pdf");
    }

    [HttpGet("export/meetings/pdf")]
    public async Task<IActionResult> ExportMeetingsToPdf([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new ExportMeetingsToPdfCommand { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/pdf", "Meetings.pdf");
    }

    [HttpGet("export/attendance/pdf")]
    public async Task<IActionResult> ExportAttendanceToPdf([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _mediator.Send(new ExportAttendanceToPdfCommand { StartDate = startDate, EndDate = endDate });
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/pdf", "Attendance.pdf");
    }

    [HttpGet("export/clients/pdf")]
    public async Task<IActionResult> ExportClientsToPdf()
    {
        var result = await _mediator.Send(new ExportClientsToPdfCommand());
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/pdf", "Clients.pdf");
    }

    [HttpGet("export/users/pdf")]
    public async Task<IActionResult> ExportUsersToPdf()
    {
        var result = await _mediator.Send(new ExportUsersToPdfCommand());
        if (!result.IsSuccess) return BadRequest(result.Errors);
        return File(result.Data!, "application/pdf", "Users.pdf");
    }
}
