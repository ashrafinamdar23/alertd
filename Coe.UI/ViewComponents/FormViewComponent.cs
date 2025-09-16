using Coe.UI.Models;
using Microsoft.AspNetCore.Mvc;

namespace Coe.UI.ViewComponents;

public sealed class FormViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(FormModel model) => View(model);
}
