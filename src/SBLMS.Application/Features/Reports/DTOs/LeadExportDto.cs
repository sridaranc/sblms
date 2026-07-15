namespace SBLMS.Application.Features.Reports.DTOs;

public class LeadExportDto
{
    public string LeadNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? EmailAddress { get; set; }
    public string? MobileNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public decimal? Value { get; set; }
    public DateTime CreatedAt { get; set; }
}
