// /Logging/CorrelationIdMiddleware.cs
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AlertPortal.Web.Logging;

public sealed class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-Id";
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);

        // Echo to the response (add only once)
        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey(HeaderName))
                context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        // Make it available to downstream code
        context.Items[HeaderName] = correlationId;

        // Enrich Activity for distributed tracing, if present
        Activity.Current?.SetTag("correlation_id", correlationId);

        // Open a logging scope so every log line gets CorrelationId
        using (_logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
        {
            await _next(context);
        }
    }

    private static string GetOrCreateCorrelationId(HttpContext ctx)
    {
        // 1) Client-provided header (trust but verify it's not empty)
        var fromHeader = ctx.Request.Headers[HeaderName].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(fromHeader))
            return fromHeader!;

        // 2) If there is an Activity (traceparent), reuse its TraceId
        var act = Activity.Current;
        if (act != null && act.TraceId != default)
            return act.TraceId.ToString(); // 32 hex chars

        // 3) Fallback to a new GUID (no dashes)
        return Guid.NewGuid().ToString("N");
    }
}
