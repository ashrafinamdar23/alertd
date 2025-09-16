using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlertPortal.Web.Data;

public sealed class HomeController(AppDbContext db, ILogger<HomeController> logger) : Controller
{
    public async Task<IActionResult> Index()
    {
        var count = await db.Customers.CountAsync();
        ViewData["CustomerCount"] = count;
        logger.LogInformation("Home loaded. Customers={Count}", count);
        return View();
    }
}
