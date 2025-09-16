using Coe.UI.Models;
using AlertPortal.Web.ViewModels;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;

namespace AlertPortal.Web.Forms;

public sealed class CustomerFormFactory(LinkGenerator links)
{
    public FormModel BuildCreate(string? presetName = null)
        => new()
        {
            Action = links.GetPathByAction("Create", "Customers")!,
            Method = "post",
            Fields =
            {
                new FormField
                {
                    Name = "Name",
                    Label = "Name",
                    Type = FormFieldType.Text,
                    Value = presetName,
                    Required = true,
                    MaxLength = 128,
                    Placeholder = "Enter customer name"
                }
            },
            Buttons =
            {
                new FormButton { Kind = FormButtonKind.Submit, Text = "Create", Class = "btn btn-primary" },
                new FormButton { Kind = FormButtonKind.Back,   Text = "Back",   Class = "btn btn-outline-secondary" }
            }
        };

    public FormModel BuildEdit(CustomerVm vm)
        => new()
        {
            Action = links.GetPathByAction("Edit", "Customers")!,
            Method = "post",
            Fields =
            {
                new FormField { Name = "Id",   Type = FormFieldType.Hidden, Value = vm.Id.ToString() },
                new FormField { Name = "Name", Label = "Name", Type = FormFieldType.Text, Value = vm.Name, Required = true, MaxLength = 128 }
            },
            Buttons =
            {
                new FormButton { Kind = FormButtonKind.Submit, Text = "Save",   Class = "btn btn-primary" },
                new FormButton { Kind = FormButtonKind.Link,   Text = "Cancel", Class = "btn btn-outline-secondary", Href = links.GetPathByAction("Index","Customers") }
            }
        };

    public void AddErrors(FormModel form, ModelStateDictionary ms)
    {
        var errors = ms.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        if (errors.Count > 0) form.Errors = errors;
    }
}
