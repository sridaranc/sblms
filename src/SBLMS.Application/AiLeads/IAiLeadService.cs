namespace SBLMS.Application.AiLeads;

public interface IAiLeadService
{
    Task<List<AiLeadResultDto>> SearchLeadsAsync(string keywords, string country, string? industry, string? prompt, string provider);
}

public class AiLeadResultDto
{
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
}
