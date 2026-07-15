using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Exceptions;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService,
        IAuditService auditService,
        INotificationService notificationService)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user == null)
            return Result<LoginResponse>.Failure("Invalid email or password.");

        if (!user.IsActive)
            return Result<LoginResponse>.Failure("Your account has been deactivated. Please contact administrator.");

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return Result<LoginResponse>.Failure("Invalid email or password.");

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        var (accessToken, accessTokenExpiration) = await _jwtService.GenerateAccessTokenAsync(user.Id, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = _currentUserService.IpAddress
        };

        _context.RefreshTokens.Add(refreshTokenEntity);

        user.LastLoginAt = DateTime.UtcNow;
        user.LastLoginIp = _currentUserService.IpAddress;
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("Login", "User", user.Id.ToString());

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiration = accessTokenExpiration,
            User = new UserResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                ProfileImageUrl = user.ProfileImageUrl,
                Roles = roles
            }
        };

        return Result<LoginResponse>.Success(response, "Login successful.");
    }
}
