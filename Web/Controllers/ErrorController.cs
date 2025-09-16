using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

public sealed class ErrorController : Controller
{
    [Route("Error/404")]
    public IActionResult NotFoundPage()
    {
        Response.StatusCode = 404;
        var feature = HttpContext.Features.Get<IStatusCodeReExecuteFeature>();
        // Pass the original URL to the view (optional)
        return View("NotFound", feature);
    }

    // (Optional) other codes:
    [Route("Error/{code:int}")]
    public IActionResult StatusCodePage(int code)
    {
        Response.StatusCode = code;
        return View("StatusCode", code);
    }
}
