namespace AlertPortal.Web.Data.Entities;

public sealed class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public DateTime CreatedAtUtc { get; set; }  // set by DB default
}