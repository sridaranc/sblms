using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;

namespace SBLMS.Application.Features.Users.Commands.UpdateUser;

public class UpdateUserCommand : IRequest<Result<UserDto>>
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
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
