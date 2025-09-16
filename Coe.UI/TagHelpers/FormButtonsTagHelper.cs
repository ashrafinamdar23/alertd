using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Coe.UI.TagHelpers;

[HtmlTargetElement("coe-form-buttons", TagStructure = TagStructure.WithoutEndTag)]
public sealed class FormButtonsTagHelper : TagHelper
{
    private readonly IUrlHelperFactory _urlHelperFactory;
    public FormButtonsTagHelper(IUrlHelperFactory urlHelperFactory) => _urlHelperFactory = urlHelperFactory;

    [ViewContext, HtmlAttributeNotBound]
    public required ViewContext ViewContext { get; set; }

    // Submit
    public string SaveText { get; set; } = "Save";
    public string SaveClass { get; set; } = "btn btn-primary";

    // Cancel (MVC)
    public string? CancelController { get; set; }
    public string? CancelAction { get; set; }
    public string? CancelHref { get; set; }
    public string CancelText { get; set; } = "Cancel";
    public string CancelClass { get; set; } = "btn btn-outline-secondary";

    // Razor Pages (legacy support)
    public string? CancelPage { get; set; }

    // Back button if Cancel not specified
    public bool Back { get; set; } = false;
    public string BackText { get; set; } = "Back";
    public string BackClass { get; set; } = "btn btn-outline-secondary";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.Attributes.SetAttribute("class", "d-flex gap-2");

        // Submit
        var submit = new TagBuilder("button");
        submit.Attributes["type"] = "submit";
        submit.AddCssClass(SaveClass);
        submit.InnerHtml.Append(SaveText);
        output.Content.AppendHtml(submit);

        // Cancel / Back
        var url = _urlHelperFactory.GetUrlHelper(ViewContext);
        string? href = null;

        if (!string.IsNullOrWhiteSpace(CancelHref))
            href = CancelHref;
        else if (!string.IsNullOrWhiteSpace(CancelController) && !string.IsNullOrWhiteSpace(CancelAction))
            href = url.Action(CancelAction, CancelController);
        else if (!string.IsNullOrWhiteSpace(CancelPage))
            href = url.Page(CancelPage);

        if (!string.IsNullOrWhiteSpace(href))
        {
            var a = new TagBuilder("a");
            a.Attributes["href"] = href;
            a.AddCssClass(CancelClass);
            a.InnerHtml.Append(CancelText);
            output.Content.AppendHtml(a);
        }
        else if (Back)
        {
            var back = new TagBuilder("button");
            back.Attributes["type"] = "button";
            back.Attributes["onclick"] = "history.back()";
            back.AddCssClass(BackClass);
            back.InnerHtml.Append(BackText);
            output.Content.AppendHtml(back);
        }
    }
}
