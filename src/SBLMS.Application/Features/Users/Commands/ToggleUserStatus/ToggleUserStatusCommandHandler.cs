using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Users.DTOs;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Users.Commands.ToggleUserStatus;

public class ToggleUserStatusCommandHandler : IRequestHandler<ToggleUserStatusCommand, Result<UserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public ToggleUserStatusCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<UserDto>> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
            throw new NotFoundException(nameof(User), request.Id);

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("ToggleStatus", "User", request.Id.ToString(),
            newValues: new { user.IsActive });

        var dto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            ProfileImageUrl = user.ProfileImageUrl,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
        };

        return Result<UserDto>.Success(dto, $"User {(user.IsActive ? "activated" : "deactivated")} successfully.");
    }
}
