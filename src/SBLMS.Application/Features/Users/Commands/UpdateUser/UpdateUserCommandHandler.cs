using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Users.Commands.UpdateUser;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Result<UserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public UpdateUserCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<UserDto>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
            throw new NotFoundException(nameof(User), request.Id);

        var oldValues = new { user.Email, user.FirstName, user.LastName, user.PhoneNumber, user.IsActive };

        user.Email = request.Email;
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;
        user.IsActive = request.IsActive;

        // Professional fields
        user.Department = request.Department;
        user.Designation = request.Designation;
        user.EmployeeId = request.EmployeeId;
        user.Address = request.Address;
        user.City = request.City;
        user.State = request.State;
        user.ReportingManager = request.ReportingManager;

        // Face descriptor
        if (request.FaceDescriptor != null && request.FaceDescriptor.Length > 0)
        {
            user.FaceDescriptor = JsonSerializer.Serialize(request.FaceDescriptor);
            user.HasFaceDescriptor = true;
            user.FaceEnrolledAt = DateTime.UtcNow;
        }

        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);

        var existingRoles = await _context.UserRoles
            .Where(ur => ur.UserId == request.Id)
            .ToListAsync(cancellationToken);

        _context.UserRoles.RemoveRange(existingRoles);

        if (request.Roles.Any())
        {
            foreach (var roleName in request.Roles)
            {
                var role = await _context.Roles
                    .FirstOrDefaultAsync(r => r.Name == roleName, cancellationToken);

                if (role != null)
                {
                    var userRole = new UserRole
                    {
                        UserId = request.Id,
                        RoleId = role.Id
                    };
                    _context.UserRoles.Add(userRole);
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Update", "User", request.Id.ToString(),
            oldValues: oldValues,
            newValues: new { request.FirstName, request.LastName, request.PhoneNumber, request.IsActive });

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == request.Id)
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
            Phone = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Roles = roles,
            Department = user.Department,
            Designation = user.Designation,
            EmployeeId = user.EmployeeId,
            Address = user.Address,
            City = user.City,
            State = user.State,
            ReportingManager = user.ReportingManager,
            HasFaceDescriptor = user.HasFaceDescriptor,
            FaceEnrolledAt = user.FaceEnrolledAt,
        };

        return Result<UserDto>.Success(dto, "User updated successfully.");
    }
}
