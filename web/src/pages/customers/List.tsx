import { useCallback, useState } from "react";
import ResourceList from "../_shared/ResourceList";
import { CustomersAPI } from "../../services/customers";
import { SchemaAPI, type FormSchemaDTO } from "../../services/schema";
import CoeForm, { type Field } from "../../components/CoeForm";
import CoeModal from "../../components/CoeModal";
import { toast } from "../../stores/toast";

function mapFormToCoeFields(fs: FormSchemaDTO): Field[] {
  return fs.fields
    .filter((f) => f)
    .sort((a, b) => a.orderNo - b.orderNo)
    .map<Field>((f) => {
      const base = { name: f.name, label: f.label, required: f.required } as any;
      const rules = [];
      if (f.maxLen) rules.push({ max: f.maxLen });
      if (f.minLen) rules.push({ min: f.minLen });
      if (f.pattern) rules.push({ pattern: new RegExp(f.pattern) });

      if (f.widget === "select") {
        return {
          ...base,
          widget: "select",
          options: (f.options || []).map((o) => ({ label: o.label, value: o.value })),
          rules,
          props: { placeholder: f.placeholder },
        };
      }

      const widgetMap: Record<string, Field["widget"]> = {
        input: "input",
        number: "number",
        switch: "switch",
        date: "date",
        datetime: "datetime",
        textarea: "textarea",
        password: "password",
        email: "email",
      };
      const widget = widgetMap[f.widget] || "input";
      return { ...base, widget, rules, props: { placeholder: f.placeholder } } as Field;
    });
}

export default function CustomersList() {
  // list fetcher
  const fetchList = useCallback(
    (params: { limit?: number; offset?: number; q?: string }) => CustomersAPI.list(params),
    []
  );

  // parent-controlled reload signal (used to refresh ResourceList after create)
  const [reloadSignal, setReloadSignal] = useState(0);
  const triggerReload = () => setReloadSignal((x) => x + 1);

  // runtime form schema state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formFields, setFormFields] = useState<Field[] | null>(null);

  const onAdd = async () => {
    try {
      const fs = await SchemaAPI.getFormSchema("customer", "create");
      setFormFields(mapFormToCoeFields(fs));
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "No active create form schema");
    }
  };

  const submitCreate = async (values: Record<string, any>) => {
    setSubmitting(true);
    try {
      // minimal payload for now
      await CustomersAPI.create({ name: String(values.name || "").trim() });
      toast.success("Customer created");
      setOpen(false);
      triggerReload(); // refresh list
    } catch (e: any) {
      toast.error(e?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ResourceList<any>
        model="customer"
        title="Customers"
        fetchList={fetchList}
        create={undefined}          // we're managing the modal ourselves
        reloadSignal={reloadSignal} // <-- wire the reload signal
      />

      <CoeModal
        title="New Customer"
        open={open}
        onOk={() =>
          (document.querySelector("form") as HTMLFormElement)?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          )
        }
        onCancel={() => setOpen(false)}
        okText="Create"
        confirmLoading={submitting}
      >
        {formFields ? (
          <CoeForm schema={formFields} onSubmit={submitCreate} />
        ) : (
          <div>Loading form...</div>
        )}
      </CoeModal>

      {/* Temporary FAB to open the modal; optionally move into ResourceList header later */}
      <div style={{ position: "fixed", right: 16, bottom: 16 }}>
        <button className="ant-btn ant-btn-primary" onClick={onAdd}>
          New Customer
        </button>
      </div>
    </>
  );
}
