using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class FaceEnrolment : BaseEntity
{
    public Guid UserId { get; set; }
    public string FaceDescriptor { get; set; } = string.Empty; // JSON serialized float array
    public bool IsActive { get; set; } = true;
    public DateTime? EnrolledAt { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
    public int VerificationCount { get; set; } = 0;
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}
