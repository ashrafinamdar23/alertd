namespace Coe.UI.Models;

public sealed class DataTableModel
{
    public string? Id { get; set; }
    public bool Striped { get; set; } = true;
    public bool Hover { get; set; } = false;
    public bool Center { get; set; } = true;

    public List<DataTableColumn> Columns { get; set; } = new();
    public List<DataTableRow> Rows { get; set; } = new();
}

public sealed class DataTableColumn
{
    public string Header { get; set; } = "";
    /// <summary>Cell key to read from row.Cells</summary>
    public string Key { get; set; } = "";
    /// <summary>text-start|text-center|text-end</summary>
    public string? AlignClass { get; set; } = null;
    public string? WidthStyle { get; set; } = null; // e.g. "80px"
}

public sealed class DataTableRow
{
    /// <summary>Map of cell key -> string html/text</summary>
    public Dictionary<string, string> Cells { get; set; } = new();
    public List<DataTableAction> Actions { get; set; } = new(); // optional
}

public enum DataTableActionType { Link, Post }

public sealed class DataTableAction
{
    public DataTableActionType Type { get; set; } = DataTableActionType.Link;
    public string Text { get; set; } = "";
    /// <summary>Bootstrap button classes, e.g. "btn btn-outline-secondary btn-sm"</summary>
    public string Class { get; set; } = "btn btn-outline-secondary btn-sm";

    // Link action
    public string? Href { get; set; }

    // Post action
    public string? FormAction { get; set; }
    public Dictionary<string, string>? Hidden { get; set; } // extra hidden fields
    public string? ConfirmTitle { get; set; }
    public string? ConfirmBody { get; set; }
    public string? ConfirmClass { get; set; } = "btn-danger";
}
