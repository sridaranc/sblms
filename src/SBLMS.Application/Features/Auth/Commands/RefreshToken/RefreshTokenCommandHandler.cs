using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Auth.Commands.Login;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<LoginResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ICurrentUserService _currentUserService;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _jwtService = jwtService;
        _currentUserService = currentUserService;
    }

    public async Task<Result<LoginResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var userPrincipal = await _jwtService.GetUserIdFromTokenAsync(request.AccessToken);
        if (userPrincipal == null)
            return Result<LoginResponse>.Failure("Invalid access token.");

        var userId = userPrincipal.Value;

        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && rt.UserId == userId, cancellationToken);

        if (refreshToken == null)
            return Result<LoginResponse>.Failure("Invalid refresh token.");

        if (!refreshToken.IsActive)
            return Result<LoginResponse>.Failure("Refresh token is no longer active.");

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null || !user.IsActive)
            return Result<LoginResponse>.Failure("User not found or inactive.");

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        var (newAccessToken, accessTokenExpiration) = await _jwtService.GenerateAccessTokenAsync(userId, roles);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.ReplacedByToken = newRefreshToken;

        var newRefreshTokenEntity = new Domain.Entities.RefreshToken
        {
            UserId = userId,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = _currentUserService.IpAddress
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
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

        return Result<LoginResponse>.Success(response, "Token refreshed successfully.");
    }
}
