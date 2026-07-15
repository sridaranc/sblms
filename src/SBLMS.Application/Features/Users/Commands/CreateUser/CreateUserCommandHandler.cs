using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;
using SBLMS.Domain.Common.Enums;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Result<UserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;

    public CreateUserCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IAuditService auditService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _auditService = auditService;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserDto>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser != null)
            return Result<UserDto>.Failure("A user with this email already exists.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            IsActive = true,
            
            // Professional fields
            Department = request.Department,
            Designation = request.Designation,
            EmployeeId = request.EmployeeId,
            Address = request.Address,
            City = request.City,
            State = request.State,
            ReportingManager = request.ReportingManager
        };

        if (request.FaceDescriptor != null && request.FaceDescriptor.Length > 0)
        {
            var faceDescriptorJson = JsonSerializer.Serialize(request.FaceDescriptor);
            user.FaceDescriptor = faceDescriptorJson;
            user.HasFaceDescriptor = true;
            user.FaceEnrolledAt = DateTime.UtcNow;

            var faceEnrolment = new SBLMS.Domain.Entities.FaceEnrolment
            {
                UserId = user.Id,
                FaceDescriptor = faceDescriptorJson,
                IsActive = true,
                EnrolledAt = DateTime.UtcNow,
                Notes = "Enrolled during registration"
            };
            _context.FaceEnrolments.Add(faceEnrolment);
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var rolesToAssign = request.Roles;
        if (_currentUserService.UserId == null)
        {
            // Anonymous registration: force role to Employee
            rolesToAssign = new List<string> { "Employee" };
        }

        if (rolesToAssign.Any())
        {
            foreach (var roleName in rolesToAssign)
            {
                var role = await _context.Roles
                    .FirstOrDefaultAsync(r => r.Name == roleName, cancellationToken);

                if (role != null)
                {
                    var userRole = new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id
                    };
                    _context.UserRoles.Add(userRole);
                }
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        await _auditService.LogAsync("Create", "User", user.Id.ToString(),
            newValues: new { user.Email, user.FirstName, user.LastName });

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync(cancellationToken);

        var dto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Roles = roles,
            Department = user.Department,
            Designation = user.Designation,
            EmployeeId = user.EmployeeId,
            Address = user.Address,
            City = user.City,
            State = user.State,
            ReportingManager = user.ReportingManager,
            HasFaceDescriptor = user.HasFaceDescriptor,
            FaceEnrolledAt = user.FaceEnrolledAt
        };

        return Result<UserDto>.Success(dto, "User created successfully.");
    }
}
