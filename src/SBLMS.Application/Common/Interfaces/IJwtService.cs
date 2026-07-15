namespace SBLMS.Application.Common.Interfaces;

public interface IJwtService
{
    Task<(string Token, DateTime Expiration)> GenerateAccessTokenAsync(Guid userId, IEnumerable<string> roles);
    string GenerateRefreshToken();
    Task<bool> ValidateTokenAsync(string token);
    Task<Guid?> GetUserIdFromTokenAsync(string token);
}
