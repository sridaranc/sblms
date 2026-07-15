using Hangfire.Dashboard;

namespace SBLMS.Api.Filters;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // In production, restrict to Admin role
        return true;
    }
}
