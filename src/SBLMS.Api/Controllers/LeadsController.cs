using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.Commands.AssignLead;
using SBLMS.Application.Features.Leads.Commands.CreateLead;
using SBLMS.Application.Features.Leads.Commands.DeleteLead;
using SBLMS.Application.Features.Leads.Commands.UpdateLead;
using SBLMS.Application.Features.Leads.Commands.UpdateLeadStatus;
using SBLMS.Application.Features.Leads.DTOs;
using SBLMS.Application.Features.Leads.Queries.GetAllLeads;
using SBLMS.Application.Features.Leads.Queries.GetLeadById;
using SBLMS.Application.Features.Leads.Queries.GetLeadStatistics;
using SBLMS.Application.Features.Leads.Queries.SearchLeads;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly IMediator _mediator;

    public LeadsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Result<List<LeadDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllLeads(
        [FromQuery] string? searchTerm,
        [FromQuery] LeadStatus? status,
        [FromQuery] LeadSource? source,
        [FromQuery] Guid? assignedToUserId)
    {
        var result = await _mediator.Send(new GetAllLeadsQuery
        {
            SearchTerm = searchTerm,
            Status = status,
            Source = source,
            AssignedToUserId = assignedToUserId
        });
        return Ok(result);
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(Result<List<LeadDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchLeads([FromQuery] string q)
    {
        var result = await _mediator.Send(new SearchLeadsQuery { SearchTerm = q });
        return Ok(result);
    }

    [HttpGet("statistics")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<LeadStatisticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeadStatistics()
    {
        var result = await _mediator.Send(new GetLeadStatisticsQuery());
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Result<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLeadById(Guid id)
    {
        var result = await _mediator.Send(new GetLeadByIdQuery { Id = id });
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<LeadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result<LeadDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetLeadById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(Result<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadDto dto)
    {
        var command = new UpdateLeadCommand
        {
            Id = id,
            CompanyName = dto.CompanyName,
            CustomerName = dto.CustomerName,
            MobileNumber = dto.MobileNumber,
            AlternativeNumber = dto.AlternativeNumber,
            EmailAddress = dto.EmailAddress,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            Country = dto.Country,
            PostalCode = dto.PostalCode,
            IndustryType = dto.IndustryType,
            BusinessCategory = dto.BusinessCategory,
            CompanySize = dto.CompanySize,
            Website = dto.Website,
            Source = dto.Source,
            ExpectedBudget = dto.ExpectedBudget,
            Requirements = dto.Requirements,
            Notes = dto.Notes,
            CustomerPriority = dto.CustomerPriority,
            Value = dto.Value,
            TaxId = dto.TaxId,
            AnnualRevenue = dto.AnnualRevenue,
            EmployeeCount = dto.EmployeeCount,
            Fax = dto.Fax,
            LinkedInUrl = dto.LinkedInUrl,
            SkypeId = dto.SkypeId,
            CampaignSource = dto.CampaignSource,
            LeadSourceDetails = dto.LeadSourceDetails,
            Addresses = dto.Addresses,
            ContactPersons = dto.ContactPersons
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLead(Guid id)
    {
        var result = await _mediator.Send(new DeleteLeadCommand { Id = id });
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(Result<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLeadStatus(Guid id, [FromBody] UpdateLeadStatusDto dto)
    {
        var command = new UpdateLeadStatusCommand
        {
            LeadId = id,
            Status = dto.Status,
            Notes = dto.Notes
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}/assign")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    [ProducesResponseType(typeof(Result<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignLead(Guid id, [FromBody] AssignLeadDto dto)
    {
        var command = new AssignLeadCommand
        {
            LeadId = id,
            UserId = dto.UserId
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("bulk-assign")]
    [Authorize(Roles = "SuperAdmin,Admin,Manager")]
    public async Task<IActionResult> BulkAssignLeads([FromBody] BulkAssignDto dto)
    {
        var results = new List<object>();
        foreach (var leadId in dto.LeadIds)
        {
            var command = new AssignLeadCommand
            {
                LeadId = leadId,
                UserId = dto.UserId
            };
            var result = await _mediator.Send(command);
            results.Add(new { LeadId = leadId, Success = result.IsSuccess, Message = result.Message });
        }
        return Ok(Result<object>.Success(results, $"Assigned {dto.LeadIds.Count} leads."));
    }
}
