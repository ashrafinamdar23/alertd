using AlertPortal.Web.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AlertPortal.Web.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasCharSet("utf8mb4");

        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(b);
    }

    // Optional: cross-cutting conventions
    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        // Example: store DateTime with microseconds
        builder.Properties<DateTime>().HaveColumnType("datetime(6)");
        base.ConfigureConventions(builder);
    }
}
