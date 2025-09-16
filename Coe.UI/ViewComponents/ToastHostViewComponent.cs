using Microsoft.AspNetCore.Mvc;

namespace Coe.UI.ViewComponents;

public sealed class ToastHostViewComponent : ViewComponent
{
    public IViewComponentResult Invoke() => View(); // renders Default.cshtml
}
