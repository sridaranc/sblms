using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Leads.DTOs;

namespace SBLMS.Application.Features.Leads.Commands.CreateLead;

public class CreateLeadCommand : IRequest<Result<LeadDto>>
{
    public string? CompanyName { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    public string? AlternativeNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? IndustryType { get; set; }
    public string? BusinessCategory { get; set; }
    public string? CompanySize { get; set; }
    public string? Website { get; set; }
    public Domain.Common.Enums.LeadSource Source { get; set; } = Domain.Common.Enums.LeadSource.Other;
    public decimal? ExpectedBudget { get; set; }
    public string? Requirements { get; set; }
    public string? Notes { get; set; }
    public string? CustomerPriority { get; set; }
    public decimal? Value { get; set; }
    public string? TaxId { get; set; }
    public decimal? AnnualRevenue { get; set; }
    public int? EmployeeCount { get; set; }
    public string? Fax { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? SkypeId { get; set; }
    public string? CampaignSource { get; set; }
    public string? LeadSourceDetails { get; set; }
    public List<CreateLeadAddressDto> Addresses { get; set; } = new();
    public List<CreateLeadContactPersonDto> ContactPersons { get; set; } = new();
}
