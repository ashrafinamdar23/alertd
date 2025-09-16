// /Endpoints/Filters/EndpointLoggingFilter.cs
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;

namespace AlertPortal.Web.Endpoints.Filters;

public sealed class EndpointLoggingFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var logger = ctx.HttpContext.RequestServices.GetRequiredService<ILogger<EndpointLoggingFilter>>();
        var path = ctx.HttpContext.Request.Path;

        logger.LogInformation("Handling {Path}", path);

        var result = await next(ctx);

        logger.LogInformation("Handled {Path} with {StatusCode}", path, ctx.HttpContext.Response.StatusCode);
        return result;
    }
}
