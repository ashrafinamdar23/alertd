using AlertPortal.Web.Data;
using AlertPortal.Web.Endpoints.Filters;
using AlertPortal.Web.Logging; //  add this at the top
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;



var builder = WebApplication.CreateBuilder(args);

var cs = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(cs, ServerVersion.AutoDetect(cs),
        mySql => mySql.EnableRetryOnFailure());
});


builder.Services.AddScoped<AlertPortal.Web.Forms.CustomerFormFactory>();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.AddCommonLogging();

// builder.Services.AddControllersWithViews(); // MVC

builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});

// builder.Services.AddRazorPages();

var app = builder.Build();

// Typical prod-only bits first
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Common logging init
app.UseCommonLogging();

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseStatusCodePagesWithReExecute("/Error/{0}");

// (auth later, if/when added)
// app.UseAuthentication();
// app.UseAuthorization();

// (endpoints later)
// app.MapRazorPages();
// Conventional route (default)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// app.MapRazorPages();




app.Run();

