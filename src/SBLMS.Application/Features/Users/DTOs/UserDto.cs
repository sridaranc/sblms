namespace SBLMS.Application.Features.Users.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();

    // Professional fields
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public string? EmployeeId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ReportingManager { get; set; }

    // Face recognition
    public bool HasFaceDescriptor { get; set; }
    public DateTime? FaceEnrolledAt { get; set; }
}

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public List<string> Roles { get; set; } = new();

    // Professional fields
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public string? EmployeeId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ReportingManager { get; set; }

    // Face recognition
    public float[]? FaceDescriptor { get; set; }
}

public class UpdateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public List<string> Roles { get; set; } = new();

    // Professional fields
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public string? EmployeeId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ReportingManager { get; set; }

    // Face recognition
    public float[]? FaceDescriptor { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
