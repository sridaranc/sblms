using SBLMS.Domain.Common;
using SBLMS.Domain.Common.Enums;

namespace SBLMS.Domain.Entities;

public class LeadAddress : AuditableEntity
{
    public Guid LeadId { get; set; }
    public AddressLabel Label { get; set; } = AddressLabel.Address1;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    public Lead Lead { get; set; } = null!;
}
