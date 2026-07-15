using System.Security.Claims;

namespace SBLMS.Api.Extensions;

public static class ClaimsExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("User not authenticated.");

        return Guid.Parse(userId);
    }

    public static string GetUserEmail(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }

    public static IEnumerable<string> GetUserRoles(this ClaimsPrincipal principal)
    {
        return principal.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value);
    }

    public static bool IsInRole(this ClaimsPrincipal principal, string role)
    {
        return principal.GetUserRoles().Contains(role);
    }
}
