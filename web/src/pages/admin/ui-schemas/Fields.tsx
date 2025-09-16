import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Tag } from "antd";
import Container from "../../../components/Container";
import ModelList from "../../../components/ModelList";
import CoeModal from "../../../components/CoeModal";
import CoeForm, { type Field } from "../../../components/CoeForm";
import type { ColumnsType } from "antd/es/table";
import { SchemaAdminAPI, type UIListSchemaField } from "../../../services/schema";
import { toast } from "../../../stores/toast";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function AdminUISchemaFields() {
  const { id } = useParams();                 // schema id
  const q = useQuery();
  const model = q.get("model") || "";

  const schemaId = Number(id || 0);
  const [reloadSignal, setReloadSignal] = useState(0);
  const triggerReload = () => setReloadSignal((x) => x + 1);

  const columns: ColumnsType<UIListSchemaField> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Field", dataIndex: "fieldName" },
    { title: "Label", dataIndex: "fieldLabel" },
    { title: "Type", dataIndex: "fieldType", width: 110 },
    { title: "Width", dataIndex: "width", width: 90, render: (v) => v ?? <Tag>auto</Tag> },
    { title: "Align", dataIndex: "align", width: 100 },
    { title: "Sortable", dataIndex: "sortable", width: 110, render: (v) => v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag> },
    { title: "Searchable", dataIndex: "searchable", width: 120, render: (v) => v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag> },
    { title: "Order", dataIndex: "orderNo", width: 90 },
    { title: "Visible", dataIndex: "visible", width: 100, render: (v) => v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag> },
  ];

  // fetch fields (ModelList expects items/limit/offset)
  const fetchList = useCallback(async () => {
    if (!schemaId) return { items: [], limit: 100, offset: 0 };
    const res = await SchemaAdminAPI.listFields(schemaId);
    return { items: res.items, limit: 100, offset: 0 };
  }, [schemaId]);

  // Create Field modal
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createSchema: Field[] = [
  { name: "field_name",  label: "Field Name",  widget: "input",  required: true, rules: [{ max: 100 }], props: { placeholder: "createdAt" } },
  { name: "field_label", label: "Field Label", widget: "input",  required: true, rules: [{ max: 255 }] },

  // ✅ options belong at top-level (not under props)
  { name: "field_type",  label: "Field Type",  widget: "select", required: true,
    options: [
      { label: "String", value: "string" },
      { label: "Number", value: "number" },
      { label: "Datetime", value: "datetime" },
      { label: "Boolean", value: "boolean" },
    ]
  },

  { name: "width",       label: "Width (px)",  widget: "number", required: false, props: { min: 0 } },

  // ✅ same here
  { name: "align",       label: "Align",       widget: "select", required: false,
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ]
  },

  { name: "sortable",    label: "Sortable",    widget: "switch" },
  { name: "searchable",  label: "Searchable",  widget: "switch" },
  { name: "order_no",    label: "Order",       widget: "number", required: false, props: { min: 0, defaultValue: 10 } },
  { name: "visible",     label: "Visible",     widget: "switch", required: false, props: { defaultChecked: true } },
];

  const submitCreate = async (values: any) => {
    if (!schemaId) return;
    setSubmitting(true);
    try {
      await SchemaAdminAPI.addField(schemaId, values);
      toast.success("Field added");
      setOpen(false);
      triggerReload();
    } catch (e: any) {
      toast.error(e?.message || "Add field failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Title
  const title = model ? `Fields — ${model} (schema ${schemaId})` : `Fields (schema ${schemaId})`;

  // Let ModelList reload when we add a field
  useEffect(() => { /* no-op here; control via reloadSignal */ }, [reloadSignal]);

  return (
    <Container maxWidth={1200}>
      <ModelList<UIListSchemaField>
        title={title}
        columns={columns}
        fetchList={fetchList}
        addLabel="Add Field"
        onAdd={() => setOpen(true)}
        reloadSignal={reloadSignal}
      />

      <CoeModal
        title="Add Field"
        open={open}
        onOk={() => (document.querySelector("form") as HTMLFormElement)?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))}
        onCancel={() => setOpen(false)}
        okText="Create"
        confirmLoading={submitting}
      >
        <CoeForm schema={createSchema} onSubmit={submitCreate} />
      </CoeModal>
    </Container>
  );
}
