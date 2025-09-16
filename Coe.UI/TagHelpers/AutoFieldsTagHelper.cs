using System.Linq;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Coe.UI.TagHelpers;

[HtmlTargetElement("coe-auto-fields", Attributes = "asp-for")]
public sealed class AutoFieldsTagHelper : TagHelper
{
    private readonly IHtmlGenerator _gen;
    public AutoFieldsTagHelper(IHtmlGenerator gen) => _gen = gen;

    [HtmlAttributeName("asp-for")]
    public required ModelExpression For { get; set; }

    [HtmlAttributeNotBound]
    [ViewContext] public required ViewContext ViewContext { get; set; }

    /// Comma-separated property names to include (optional).
    public string? Include { get; set; }

    /// Comma-separated property names to exclude (optional).
    public string? Exclude { get; set; }

    /// Default textarea rows (used for DataType = MultilineText).
    public int TextAreaRows { get; set; } = 3;

    /// Default textarea cols; set 0 to omit the attribute for Bootstrap width.
    public int TextAreaCols { get; set; } = 0;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = null;

        var include = ToSet(Include);
        var exclude = ToSet(Exclude);

        var props = For.ModelExplorer.Properties
            .Where(p => !p.Metadata.IsComplexType)
            .Where(p => p.Metadata.PropertyName is not null)
            .Where(p => include.Count == 0 || include.Contains(p.Metadata.PropertyName!))
            .Where(p => !exclude.Contains(p.Metadata.PropertyName!))
            .ToList();

        var content = new DefaultTagHelperContent();

        foreach (var prop in props)
        {
            var name = ViewContext.ViewData.TemplateInfo.GetFullHtmlFieldName(prop.Metadata.PropertyName!);
            var underlying = prop.Metadata.UnderlyingOrModelType ?? prop.ModelType;
            var dataType = prop.Metadata.DataTypeName; // e.g. "MultilineText", "Password"

            if (underlying == typeof(bool))
            {
                var wrap = new TagBuilder("div");
                wrap.AddCssClass("mb-3 form-check");

                var input = _gen.GenerateCheckBox(ViewContext, prop, name, isChecked: null, htmlAttributes: new { @class = "form-check-input" });
                var label = _gen.GenerateLabel(ViewContext, prop, name, labelText: null, htmlAttributes: new { @class = "form-check-label" });
                var val = _gen.GenerateValidationMessage(ViewContext, prop, name, message: null, tag: null, htmlAttributes: new { @class = "text-danger" });

                wrap.InnerHtml.AppendHtml(input);
                wrap.InnerHtml.AppendHtml(label);
                wrap.InnerHtml.AppendHtml(val);
                content.AppendHtml(wrap);
                continue;
            }

            var group = new TagBuilder("div");
            group.AddCssClass("mb-3");

            var lbl = _gen.GenerateLabel(ViewContext, prop, name, labelText: null, htmlAttributes: new { @class = "form-label" });
            group.InnerHtml.AppendHtml(lbl);

            TagBuilder inputEl;

            if (string.Equals(dataType, "MultilineText", System.StringComparison.OrdinalIgnoreCase))
            {
                inputEl = _gen.GenerateTextArea(ViewContext, prop, name, TextAreaRows, TextAreaCols, new { @class = "form-control" });
                if (TextAreaCols <= 0) inputEl.Attributes.Remove("cols"); // keep Bootstrap width
            }
            else if (string.Equals(dataType, "Password", System.StringComparison.OrdinalIgnoreCase))
            {
                inputEl = _gen.GeneratePassword(ViewContext, prop, name, value: null, htmlAttributes: new { @class = "form-control" });
            }
            else
            {
                inputEl = _gen.GenerateTextBox(ViewContext, prop, name, value: null, format: null, htmlAttributes: new { @class = "form-control" });

                // Optional type hints:
                // if (string.Equals(dataType, "EmailAddress", StringComparison.OrdinalIgnoreCase)) inputEl.Attributes["type"] = "email";
                // if (underlying == typeof(int) || underlying == typeof(long) || underlying == typeof(decimal) || underlying == typeof(double)) inputEl.Attributes["type"] = "number";
            }

            group.InnerHtml.AppendHtml(inputEl);

            var valmsg = _gen.GenerateValidationMessage(ViewContext, prop, name, message: null, tag: null, htmlAttributes: new { @class = "text-danger" });
            group.InnerHtml.AppendHtml(valmsg);

            content.AppendHtml(group);
        }

        output.Content.SetHtmlContent(content);
    }

    private static HashSet<string> ToSet(string? csv) =>
        string.IsNullOrWhiteSpace(csv)
            ? new(StringComparer.OrdinalIgnoreCase)
            : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                 .ToHashSet(StringComparer.OrdinalIgnoreCase);
}
