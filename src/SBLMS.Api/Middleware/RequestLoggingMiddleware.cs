using System.Diagnostics;

namespace SBLMS.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString();

        context.Request.Headers.TryGetValue("X-Request-Id", out var existingRequestId);
        if (string.IsNullOrEmpty(existingRequestId))
            context.Request.Headers["X-Request-Id"] = requestId;

        _logger.LogInformation("HTTP {Method} {Path} started",
            context.Request.Method, context.Request.Path);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation("HTTP {Method} {Path} completed {StatusCode} in {ElapsedMs}ms",
                context.Request.Method, context.Request.Path, context.Response.StatusCode, stopwatch.ElapsedMilliseconds);
        }
    }
}
