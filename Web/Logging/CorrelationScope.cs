using Microsoft.Extensions.Logging;

namespace AlertPortal.Web.Logging;

public static class CorrelationScope
{
    public static IDisposable Begin(ILogger logger, string? correlationId = null)
        => logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = string.IsNullOrWhiteSpace(correlationId)
                ? Guid.NewGuid().ToString("N")
                : correlationId!
        });
}
