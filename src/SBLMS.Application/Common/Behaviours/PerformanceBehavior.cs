using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace SBLMS.Application.Common.Behaviours;

public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;
    private readonly Stopwatch _timer = new();

    public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        _timer.Start();
        var response = await next();
        _timer.Stop();

        if (_timer.ElapsedMilliseconds > 500)
        {
            _logger.LogWarning("Long running request: {Name} ({ElapsedMilliseconds} ms) {@Request}",
                typeof(TRequest).Name, _timer.ElapsedMilliseconds, request);
        }

        return response;
    }
}
