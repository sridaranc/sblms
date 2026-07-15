using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Auth.Commands.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public LogoutCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    public async Task<Result<bool>> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId.HasValue)
        {
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == _currentUserService.UserId.Value && rt.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Logout", "User", _currentUserService.UserId.Value.ToString());
        }

        return Result<bool>.Success(true, "Logged out successfully.");
    }
}
