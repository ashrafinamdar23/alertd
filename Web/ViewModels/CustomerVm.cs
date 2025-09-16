using System.ComponentModel.DataAnnotations;

namespace AlertPortal.Web.ViewModels;

public sealed class CustomerVm
{
    public int Id { get; set; }

    [Required, StringLength(128)]
    public string Name { get; set; } = "";
}
