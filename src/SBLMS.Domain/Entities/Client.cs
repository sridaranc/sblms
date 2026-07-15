using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class Client : AuditableEntity
{
    public string ClientNumber { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string? EmailAddress { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? AlternativePhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Website { get; set; }
    public string? NatureOfBusiness { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string? BusinessRegistrationNumber { get; set; }
    public string? TaxIdentificationNumber { get; set; }
    public string? GSTNumber { get; set; }
    public string? AnnualRevenue { get; set; }
    public string? YearEstablished { get; set; }
    public string? ContactPersonRole { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? SecondaryContactName { get; set; }
    public string? SecondaryContactEmail { get; set; }
    public string? SecondaryContactPhone { get; set; }
    public string? PreferredCommunication { get; set; }
    public string? PaymentTerms { get; set; }
    public string? CreditLimit { get; set; }
    public string? Currency { get; set; }
    public string? ContractStartDate { get; set; }
    public string? ContractEndDate { get; set; }
    public decimal? LifetimeValue { get; set; }
    public string? CustomerPriority { get; set; }
    public string? Rating { get; set; }
    public string Status { get; set; } = "Active";
    public string? Tags { get; set; }
    public string? Notes { get; set; }
    public Guid? SourceLeadId { get; set; }
    public Lead? SourceLead { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public ICollection<ClientProject> Projects { get; set; } = new List<ClientProject>();
}
