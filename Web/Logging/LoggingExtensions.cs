// /Logging/LoggingExtensions.cs
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AlertPortal.Web.Logging;

public static class LoggingExtensions
{
    /// <summary>
    /// Registers common logging for the app. 
    /// Picks up settings from appsettings.json -> "Logging" (formatter, timestamps, scopes).
    /// Adds lightweight HTTP request/response logging with safe defaults.
    /// </summary>
    public static WebApplicationBuilder AddCommonLogging(this WebApplicationBuilder builder)
    {
        // Respect your appsettings "Logging" section, but remove duplicate providers.
        builder.Logging.ClearProviders();
        builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
        builder.Logging.AddConsole(); // formatter & options come from appsettings

        // HTTP logging (access logs) — headers only, no bodies by default.
        builder.Services.AddHttpLogging(options =>
        {
            options.LoggingFields =
                HttpLoggingFields.RequestPropertiesAndHeaders |
                HttpLoggingFields.ResponsePropertiesAndHeaders |
                HttpLoggingFields.Duration;

            // Don’t log bodies (PII/large); keep limits at 0.
            options.RequestBodyLogLimit = 0;
            options.ResponseBodyLogLimit = 0;

            // Allowlist a few headers you care about.
            options.RequestHeaders.Add("X-Correlation-Id");
            options.ResponseHeaders.Add("X-Correlation-Id");

            // Common sensitive headers are automatically redacted by ASP.NET Core,
            // but keep Authorization out of the allowlist on purpose.
        });

        return builder;
    }

    /// <summary>
    /// Adds the common logging middleware pipeline:
    /// CorrelationId → HTTP logging.
    /// </summary>
    public static IApplicationBuilder UseCommonLogging(this IApplicationBuilder app)
    {
        // Your custom middleware that creates/propagates CorrelationId
        // and opens a logging scope (we’ll add this file when you ask).
        app.UseMiddleware<CorrelationIdMiddleware>();

        // Built-in request/response access logs (uses the options above).
        app.UseHttpLogging();

        return app;
    }
}
