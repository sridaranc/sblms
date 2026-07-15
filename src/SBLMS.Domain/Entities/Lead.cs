using SBLMS.Domain.Common;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Entities;

public class Lead : AuditableEntity
{
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
    public LeadSource Source { get; set; } = LeadSource.Other;
    public decimal? ExpectedBudget { get; set; }
    public string? Requirements { get; set; }
    public string? Notes { get; set; }
    public string? CustomerPriority { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public decimal? Value { get; set; }

    public string? TaxId { get; set; }
    public decimal? AnnualRevenue { get; set; }
    public int? EmployeeCount { get; set; }
    public string? Fax { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? SkypeId { get; set; }
    public string? CampaignSource { get; set; }
    public string? LeadSourceDetails { get; set; }

    public ICollection<LeadAddress> Addresses { get; set; } = new List<LeadAddress>();
    public ICollection<LeadContactPerson> ContactPersons { get; set; } = new List<LeadContactPerson>();
    public ICollection<LeadAssignment> Assignments { get; set; } = new List<LeadAssignment>();
    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<FileAttachment> Attachments { get; set; } = new List<FileAttachment>();
}
