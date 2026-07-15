using SBLMS.Domain.Common.Enums;

namespace SBLMS.Application.Features.Leads.DTOs;

public class LeadDto
{
    public Guid Id { get; set; }
    public string LeadNumber { get; set; } = string.Empty;
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
    public LeadSource Source { get; set; }
    public string SourceName => Source.ToString();
    public decimal? ExpectedBudget { get; set; }
    public string? Requirements { get; set; }
    public string? Notes { get; set; }
    public string? CustomerPriority { get; set; }
    public LeadStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? Value { get; set; }
    public string? TaxId { get; set; }
    public decimal? AnnualRevenue { get; set; }
    public int? EmployeeCount { get; set; }
    public string? Fax { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? SkypeId { get; set; }
    public string? CampaignSource { get; set; }
    public string? LeadSourceDetails { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public List<LeadAddressDto> Addresses { get; set; } = new();
    public List<LeadContactPersonDto> ContactPersons { get; set; } = new();
    public List<LeadAssignmentDto> Assignments { get; set; } = new();
    public int FollowUpCount { get; set; }
    public int MeetingCount { get; set; }
}

public class LeadAddressDto
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
}

public class LeadContactPersonDto
{
    public Guid Id { get; set; }
    public int SortOrder { get; set; }
    public string? Name { get; set; }
    public string? Designation { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
}

public class LeadAssignmentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public string? AssignedByName { get; set; }
    public bool IsActive { get; set; }
}

public class CreateLeadAddressDto
{
    public string Label { get; set; } = "Address1";
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
}

public class CreateLeadContactPersonDto
{
    public int SortOrder { get; set; }
    public string? Name { get; set; }
    public string? Designation { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
}

public class CreateLeadDto
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
    public LeadSource Source { get; set; } = LeadSource.Other;
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

public class UpdateLeadDto
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
    public LeadSource Source { get; set; }
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

public class AssignLeadDto
{
    public Guid UserId { get; set; }
}

public class BulkAssignDto
{
    public List<Guid> LeadIds { get; set; } = new();
    public Guid UserId { get; set; }
}

public class UpdateLeadStatusDto
{
    public LeadStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class LeadStatisticsDto
{
    public int TotalLeads { get; set; }
    public int NewLeads { get; set; }
    public int ContactedLeads { get; set; }
    public int FollowUpLeads { get; set; }
    public int MeetingScheduledLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public int LostLeads { get; set; }
    public int ClosedLeads { get; set; }
    public decimal TotalValue { get; set; }
    public decimal ConversionRate { get; set; }
    public int TodayFollowUps { get; set; }
    public int UpcomingMeetings { get; set; }
}
