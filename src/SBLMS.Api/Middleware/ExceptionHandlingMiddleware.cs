using System.Net;
using System.Text.Json;
using SBLMS.Application.Common.Exceptions;

namespace SBLMS.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");

            if (!context.Response.HasStarted)
            {
                await HandleExceptionAsync(context, ex);
            }
            else
            {
                _logger.LogWarning(ex, "Exception occurred after response started, cannot write error response");
            }
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        HttpStatusCode statusCode;
        object response;

        switch (exception)
        {
            case ValidationException ex:
                statusCode = HttpStatusCode.BadRequest;
                response = new { success = false, message = "Validation failed", errors = ex.Errors };
                break;
            case NotFoundException ex:
                statusCode = HttpStatusCode.NotFound;
                response = new { success = false, message = ex.Message };
                break;
            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                response = new { success = false, message = "Unauthorized access" };
                break;
            default:
                statusCode = HttpStatusCode.InternalServerError;
                response = new { success = false, message = "An internal server error occurred" };
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
