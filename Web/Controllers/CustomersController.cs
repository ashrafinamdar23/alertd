using AlertPortal.Web.Data;
using AlertPortal.Web.Data.Entities;
using AlertPortal.Web.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlertPortal.Web.Forms;
using Coe.UI.Models;

using MySqlConnector; // for MySqlException
using static System.Runtime.InteropServices.JavaScript.JSType;

public sealed class CustomersController(AppDbContext db, ILogger<CustomersController> logger) : Controller
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<CustomersController> _logger = logger;

    // GET /Customers
    public async Task<IActionResult> Index()
    {
        var items = await db.Customers
            .AsNoTracking()
            .OrderBy(c => c.Id)
            .Select(c => new CustomerVm { Id = c.Id, Name = c.Name })
            .ToListAsync();

        return View(items);
    }

    // GET /Customers/Create
    public IActionResult Create() => View(new CustomerVm());

    // POST /Customers/Create
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CustomerVm vm)
    {
        vm.Name = vm.Name?.Trim();
        if (!ModelState.IsValid) return View(vm);

        try
        {
            // Pre-check for nice UX
            if (await _db.Customers.AnyAsync(c => c.Name == vm.Name))
            {
                ModelState.AddModelError(nameof(vm.Name), "A customer with this name already exists.");
                return View(vm);
            }

            _db.Customers.Add(new Customer { Name = vm.Name });
            await _db.SaveChangesAsync();

            TempData["Toast.Success"] = "Customer created.";
            return RedirectToAction(nameof(Index));
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            // Race-condition fallback (DB says duplicate)
            ModelState.AddModelError(nameof(vm.Name), "A customer with this name already exists.");
            return View(vm);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            LogAndAddGenericError(ex);
            return View(vm);
        }
        catch (Exception ex)
        {
            LogAndAddGenericError(ex);
            return View(vm);
        }
    }

    // GET /Customers/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var entity = await db.Customers.FindAsync(id);
        if (entity is null) return NotFound();

        return View(new CustomerVm { Id = entity.Id, Name = entity.Name });
    }

    // POST /Customers/Edit
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(CustomerVm vm)
    {
        vm.Name = vm.Name?.Trim();
        if (!ModelState.IsValid) return View(vm);

        var entity = await _db.Customers.FindAsync(vm.Id);
        if (entity is null) return NotFound();

        try
        {
            var taken = await _db.Customers.AnyAsync(c => c.Id != vm.Id && c.Name == vm.Name);
            if (taken)
            {
                ModelState.AddModelError(nameof(vm.Name), "Another customer already has this name.");
                return View(vm);
            }

            entity.Name = vm.Name;
            await _db.SaveChangesAsync();

            TempData["Toast.Success"] = "Customer updated.";
            return RedirectToAction(nameof(Index));
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            ModelState.AddModelError(nameof(vm.Name), "Another customer already has this name.");
            return View(vm);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            LogAndAddGenericError(ex);
            return View(vm);
        }
        catch (Exception ex)
        {
            LogAndAddGenericError(ex);
            return View(vm);
        }
    }

    // POST /Customers/Delete/5
    // [HttpPost, ValidateAntiForgeryToken]
    //public async Task<IActionResult> Delete(int id)
    // {
    //    var entity = await _db.Customers.FindAsync(id);
    //    if (entity is null)
    //    {
    //        TempData["Toast.Warning"] = "Customer not found.";
    //        return RedirectToAction(nameof(Index));
    //    }
    //
    //    db.Customers.Remove(entity);
    //    await db.SaveChangesAsync();
    //
    //    TempData["Toast.Warning"] = "Customer deleted.";
    //    return RedirectToAction(nameof(Index));
    // }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c is null) return NotFound();
        _db.Customers.Remove(c);
        await _db.SaveChangesAsync();
        return Json(new { ok = true, message = $"Deleted '{c.Name}'" });
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    => ex.InnerException is MySqlException m && m.Number == 1062; // duplicate key

    private void LogAndAddGenericError(Exception ex)
    {
        var cid = GetCorrelationId();
        _logger.LogError(ex, "Unhandled error in Customers (CID={CID})", cid);
        ModelState.AddModelError(string.Empty, $"Sorry, something went wrong. Ref: {cid}");
    }

    private string GetCorrelationId()
    {
        return HttpContext.Response.Headers["X-Correlation-Id"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault()
            ?? HttpContext.TraceIdentifier;
    }
}
