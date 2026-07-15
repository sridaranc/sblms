using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Models;
using SBLMS.Application.AiLeads;
using SBLMS.Domain.Entities;
using SBLMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using SBLMS.Domain.Common.Enums;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiLeadsController : ControllerBase
{
    private readonly SBLMSDbContext _context;
    private readonly IMediator _mediator;
    private readonly IAiLeadService _aiLeadService;

    public AiLeadsController(SBLMSDbContext context, IMediator mediator, IAiLeadService aiLeadService)
    {
        _context = context;
        _mediator = mediator;
        _aiLeadService = aiLeadService;
    }

    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] AiLeadSearchDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var request = new AiLeadRequest
        {
            Keywords = dto.Keywords,
            Country = dto.Country,
            Industry = dto.Industry,
            Prompt = dto.Prompt,
            AiProvider = dto.AiProvider ?? "Groq",
            UserId = userId.Value,
            Status = "Completed"
        };

        // Call real AI service
        var aiResults = await _aiLeadService.SearchLeadsAsync(
            dto.Keywords, dto.Country, dto.Industry, dto.Prompt, dto.AiProvider ?? "Groq");

        var results = new List<AiLeadResult>();
        foreach (var aiResult in aiResults)
        {
            var result = new AiLeadResult
            {
                CompanyName = aiResult.CompanyName,
                ContactPerson = aiResult.ContactPerson,
                EmailAddress = aiResult.EmailAddress,
                ContactPersonEmail = aiResult.ContactPersonEmail,
                Phone = aiResult.Phone,
                Mobile = aiResult.Mobile,
                Address = aiResult.Address,
                City = aiResult.City,
                State = aiResult.State,
                Country = aiResult.Country,
                PostalCode = aiResult.PostalCode,
                Website = aiResult.Website,
                NatureOfBusiness = aiResult.NatureOfBusiness,
                Industry = aiResult.Industry,
                CompanySize = aiResult.CompanySize,
                LinkedInUrl = aiResult.LinkedInUrl,
                FoundedYear = aiResult.FoundedYear,
                RevenueRange = aiResult.RevenueRange,
                RequestId = request.Id,
                Request = request
            };

            // Check for duplicates against existing leads
            var companyExists = await _context.Leads.AnyAsync(l =>
                l.CompanyName != null && l.CompanyName.ToLower() == result.CompanyName.ToLower());

            var emailExists = !string.IsNullOrEmpty(result.EmailAddress) &&
                await _context.Leads.AnyAsync(l =>
                    l.EmailAddress != null && l.EmailAddress.ToLower() == result.EmailAddress.ToLower());

            result.IsDuplicate = companyExists || emailExists;
            results.Add(result);
            request.Results.Add(result);
        }

        request.ResultsCount = results.Count;

        _context.AiLeadRequests.Add(request);
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Success(new
        {
            RequestId = request.Id,
            ResultsCount = results.Count,
            DuplicatesSkipped = results.Count(r => r.IsDuplicate),
            Provider = dto.AiProvider ?? "Groq",
            Results = results.Select(r => new AiLeadResultDto
            {
                Id = r.Id,
                CompanyName = r.CompanyName,
                ContactPerson = r.ContactPerson,
                EmailAddress = r.EmailAddress,
                ContactPersonEmail = r.ContactPersonEmail,
                Phone = r.Phone,
                Mobile = r.Mobile,
                Address = r.Address,
                City = r.City,
                State = r.State,
                Country = r.Country,
                PostalCode = r.PostalCode,
                Website = r.Website,
                NatureOfBusiness = r.NatureOfBusiness,
                Industry = r.Industry,
                CompanySize = r.CompanySize,
                LinkedInUrl = r.LinkedInUrl,
                FoundedYear = r.FoundedYear,
                RevenueRange = r.RevenueRange,
                IsDuplicate = r.IsDuplicate,
                IsConfirmed = r.IsConfirmed
            })
        }));
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.AiLeadRequests
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AiLeadRequestDto
            {
                Id = r.Id,
                Keywords = r.Keywords,
                Country = r.Country,
                Industry = r.Industry,
                Prompt = r.Prompt,
                AiProvider = r.AiProvider,
                ResultsCount = r.ResultsCount,
                Status = r.Status,
                UserName = r.User != null ? r.User.FirstName + " " + r.User.LastName : "Unknown",
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(Result<object>.Success(new { items, totalCount = total, pageNumber, pageSize }));
    }

    [HttpGet("requests/{id}")]
    public async Task<IActionResult> GetRequest(Guid id)
    {
        var request = await _context.AiLeadRequests
            .Include(r => r.Results)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return NotFound();

        return Ok(Result<object>.Success(new
        {
            Id = request.Id,
            Keywords = request.Keywords,
            Country = request.Country,
            Industry = request.Industry,
            Prompt = request.Prompt,
            AiProvider = request.AiProvider,
            ResultsCount = request.ResultsCount,
            Status = request.Status,
            UserName = request.User?.FirstName + " " + request.User?.LastName,
            CreatedAt = request.CreatedAt,
            Results = request.Results.Select(r => new AiLeadResultDto
            {
                Id = r.Id,
                CompanyName = r.CompanyName,
                ContactPerson = r.ContactPerson,
                EmailAddress = r.EmailAddress,
                ContactPersonEmail = r.ContactPersonEmail,
                Phone = r.Phone,
                Mobile = r.Mobile,
                Address = r.Address,
                City = r.City,
                State = r.State,
                Country = r.Country,
                PostalCode = r.PostalCode,
                Website = r.Website,
                NatureOfBusiness = r.NatureOfBusiness,
                Industry = r.Industry,
                CompanySize = r.CompanySize,
                LinkedInUrl = r.LinkedInUrl,
                FoundedYear = r.FoundedYear,
                RevenueRange = r.RevenueRange,
                IsDuplicate = r.IsDuplicate,
                IsConfirmed = r.IsConfirmed
            })
        }));
    }

    [HttpPost("confirm/{resultId}")]
    public async Task<IActionResult> ConfirmLead(Guid resultId)
    {
        try
        {
            var result = await _context.AiLeadResults
                .Include(r => r.Request)
                .FirstOrDefaultAsync(r => r.Id == resultId);
            if (result == null) return NotFound(Result<object>.Failure("AI lead result not found."));

            var userId = GetUserId();
            if (userId == null) return Unauthorized(Result<object>.Failure("User not authenticated."));

            if (string.IsNullOrWhiteSpace(result.CompanyName))
                return BadRequest(Result<object>.Failure("Company name is required."));

            // Check for duplicate company in existing leads
            var companyNameLower = result.CompanyName.ToLower();
            var exists = await _context.Leads.AnyAsync(l =>
                l.CompanyName != null && l.CompanyName.ToLower() == companyNameLower);

            if (exists)
            {
                result.IsDuplicate = true;
                await _context.SaveChangesAsync();
                return Ok(Result<object>.Failure("This company already exists as a lead."));
            }

            // Map AI provider to LeadSource
            var leadSource = MapAiProviderToLeadSource(result.Request?.AiProvider);

            var fullDetails = $"Generated from AI ({result.Request?.AiProvider ?? "Unknown"}). Keywords: {result.Request?.Keywords}\n";
            if (!string.IsNullOrEmpty(result.EmailAddress)) fullDetails += $"Emails: {result.EmailAddress}\n";
            if (!string.IsNullOrEmpty(result.Phone)) fullDetails += $"Phones: {result.Phone}\n";
            if (!string.IsNullOrEmpty(result.Mobile)) fullDetails += $"Mobiles: {result.Mobile}\n";
            if (!string.IsNullOrEmpty(result.Address)) fullDetails += $"Address: {result.Address}\n";
            if (!string.IsNullOrEmpty(result.LinkedInUrl)) fullDetails += $"LinkedIn: {result.LinkedInUrl}\n";
            if (result.FoundedYear != null) fullDetails += $"Founded Year: {result.FoundedYear}\n";
            if (!string.IsNullOrEmpty(result.RevenueRange)) fullDetails += $"Revenue: {result.RevenueRange}\n";

            // Create lead from AI result, ensuring fields do not exceed database column limits
            var lead = new Lead
            {
                CompanyName = Truncate(result.CompanyName, 200),
                CustomerName = Truncate(result.ContactPerson ?? result.CompanyName, 200) ?? "Unknown",
                EmailAddress = Truncate(result.EmailAddress, 256),
                MobileNumber = Truncate(result.Mobile, 20),
                AlternativeNumber = Truncate(result.Phone, 20),
                Address = Truncate(result.Address, 500),
                City = Truncate(result.City, 100),
                State = Truncate(result.State, 100),
                Country = Truncate(result.Country, 100),
                PostalCode = Truncate(result.PostalCode, 20),
                Website = Truncate(result.Website, 500),
                IndustryType = Truncate(result.Industry, 100),
                BusinessCategory = Truncate(result.NatureOfBusiness, 100),
                CompanySize = Truncate(result.CompanySize, 50),
                Source = leadSource,
                Notes = Truncate(fullDetails, 2000),
                Status = LeadStatus.New,
                LeadNumber = await GenerateLeadNumber(),
                CreatedBy = userId
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            result.IsConfirmed = true;
            result.ConfirmedLeadId = lead.Id;
            await _context.SaveChangesAsync();

            return Ok(Result<object>.Success(new { LeadId = lead.Id, LeadNumber = lead.LeadNumber }, "Lead created successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, Result<object>.Failure($"Failed to confirm lead: {ex.Message}"));
        }
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }

    private string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= maxLength ? value : value.Substring(0, maxLength);
    }

    private async Task<string> GenerateLeadNumber()
    {
        var count = await _context.Leads.CountAsync();
        var seq = count + 1;
        // Ensure uniqueness in case of deletions
        while (await _context.Leads.AnyAsync(l => l.LeadNumber == $"LD-{seq.ToString("D4")}"))
            seq++;
        return $"LD-{seq.ToString("D4")}";
    }

    private LeadSource MapAiProviderToLeadSource(string? provider)
    {
        return provider?.ToLower() switch
        {
            "openai" or "chatgpt" => LeadSource.AI_OpenAI,
            "gemini" or "google gemini" or "google" => LeadSource.AI_GoogleGemini,
            "claude" or "anthropic" => LeadSource.AI_Claude,
            "groq" => LeadSource.AI_Groq,
            "huggingface" or "hugging face" => LeadSource.AI_HuggingFace,
            "ollama" or "local" => LeadSource.Other,
            "openrouter" => LeadSource.Other,
            _ => LeadSource.Other
        };
    }
}

public class AiLeadSearchDto
{
    public string Keywords { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Prompt { get; set; }
    public string? AiProvider { get; set; } = "Groq";
}

public class AiLeadRequestDto
{
    public Guid Id { get; set; }
    public string Keywords { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Prompt { get; set; }
    public string AiProvider { get; set; } = "Groq";
    public int ResultsCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AiLeadResultDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? EmailAddress { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Website { get; set; }
    public string? NatureOfBusiness { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string? LinkedInUrl { get; set; }
    public int? FoundedYear { get; set; }
    public string? RevenueRange { get; set; }
    public bool IsDuplicate { get; set; }
    public bool IsConfirmed { get; set; }
}
