using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }

    // Professional fields
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public string? EmployeeId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ReportingManager { get; set; }

    // Face recognition fields
    public string? FaceDescriptor { get; set; } // JSON serialized float array
    public bool HasFaceDescriptor { get; set; }
    public DateTime? FaceEnrolledAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Lead> CreatedLeads { get; set; } = new List<Lead>();
    public ICollection<LeadAssignment> AssignedLeads { get; set; } = new List<LeadAssignment>();
    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<FaceEnrolment> FaceEnrolments { get; set; } = new List<FaceEnrolment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public string FullName => $"{FirstName} {LastName}";
}
