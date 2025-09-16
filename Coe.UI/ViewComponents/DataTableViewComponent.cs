using Coe.UI.Models;
using Microsoft.AspNetCore.Mvc;

namespace Coe.UI.ViewComponents;

public sealed class DataTableViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(DataTableModel model) => View(model);
}
