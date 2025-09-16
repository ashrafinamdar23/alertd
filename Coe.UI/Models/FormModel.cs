namespace Coe.UI.Models;

public sealed class FormModel
{
    public string? Id { get; set; }
    public string Action { get; set; } = "/";
    public string Method { get; set; } = "post";      // "post" | "get"
    public string? Enctype { get; set; }              // e.g. "multipart/form-data"
    public bool Antiforgery { get; set; } = true;
    public bool UseAjax { get; set; } = false;        // if true, submit via fetch
    public List<FormField> Fields { get; set; } = new();
    public List<FormButton> Buttons { get; set; } = new();

    public List<string>? Errors { get; set; }
}

public enum FormFieldType
{
    Text, TextArea, Password, Email, Number, Date, DateTime, Select, MultiSelect, Checkbox, Radio, Hidden
}

public sealed class FormField
{
    public string Name { get; set; } = "";            // model binder name
    public string Label { get; set; } = "";
    public FormFieldType Type { get; set; } = FormFieldType.Text;

    public string? Value { get; set; }
    public string? Placeholder { get; set; }
    public string? Help { get; set; }

    // Validation hints (HTML-level)
    public bool Required { get; set; } = false;
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Pattern { get; set; }
    public string? Step { get; set; }                  // for number/date inputs
    public string? Min { get; set; }
    public string? Max { get; set; }
    public int TextAreaRows { get; set; } = 3;

    // Select/radio options
    public List<FormOption>? Options { get; set; }

    // (future) simple cascading
    public string? DataSourceUrl { get; set; }        // optional: AJAX fill
    public string? DependsOn { get; set; }            // name of parent field
}

public sealed class FormOption
{
    public string Value { get; set; } = "";
    public string Text { get; set; } = "";
    public bool Selected { get; set; } = false;
}

public enum FormButtonKind { Submit, Reset, Link, Back }

public sealed class FormButton
{
    public FormButtonKind Kind { get; set; } = FormButtonKind.Submit;
    public string Text { get; set; } = "Save";
    public string Class { get; set; } = "btn btn-primary";
    public string? Href { get; set; }                 // for Kind=Link
}
