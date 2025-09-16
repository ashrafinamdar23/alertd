namespace Coe.UI.Models;

public sealed class DataTableModel
{
    public string? Id { get; set; }
    public bool Striped { get; set; } = true;
    public bool Hover { get; set; } = false;
    public bool Center { get; set; } = true;

    // NEW: used by the VC for the card header
    public string? Title { get; set; }
    public DataTableHeaderAction? HeaderAction { get; set; }

    // NEW: used by the VC to render the pager row
    public DataTablePagination? Pager { get; set; }

    // Add full borders via VC when true (VC can toggle table-bordered)
    public bool Bordered { get; set; } = true;

    // Control Actions column UI
    public string? ActionsHeader { get; set; } = null;      // e.g., "Actions"
    public string? ActionsColumnWidth { get; set; } = "160px";

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

    // Optional: per-row styling/attrs if you later need them
    public string? RowClass { get; set; }
    public Dictionary<string, string>? DataAttributes { get; set; }
}

public sealed class DataTableHeaderAction
{
    public string Text { get; set; } = "Add";
    public string Href { get; set; } = "#";
    public string Class { get; set; } = "btn btn-primary";
    public string? IconClass { get; set; } // e.g. "bi bi-plus"
}

public sealed class DataTablePagination
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalItems { get; set; } = 0;
    public string QueryParam { get; set; } = "page";
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

    
    // ---- New: arbitrary data-* attributes for Link actions (used by JS handlers) ----
    public Dictionary<string, string>? DataAttributes { get; set; } = new();

    // ---- New (optional): HTTP method hint for fetch-based actions (e.g., "POST", "DELETE") ----
    public string? Method { get; set; }
    public bool Disabled { get; set; } = false; // if you want to gray-out buttons conditionally


}
