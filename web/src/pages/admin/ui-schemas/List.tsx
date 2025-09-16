import { useCallback, useState } from "react";
import { Button, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import Container from "../../../components/Container";
import ModelList from "../../../components/ModelList";
import CoeModal from "../../../components/CoeModal";
import CoeForm, { type Field } from "../../../components/CoeForm";
import type { ColumnsType } from "antd/es/table";
import { SchemaAdminAPI, type UIListSchema } from "../../../services/schema";
import { toast } from "../../../stores/toast";

const columns: ColumnsType<UIListSchema> = [
  { title: "ID", dataIndex: "id", width: 90 },
  { title: "Model", dataIndex: "model" },
  { title: "Active", dataIndex: "isActive", width: 110,
    render: (v: boolean) => (v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>) },
  { title: "Version", dataIndex: "version", width: 100 },
  { title: "Updated", dataIndex: "updatedAt", width: 200,
    render: (v: string) => new Date(v).toLocaleString() },
];

const createSchema: Field[] = [
  { name: "model",   label: "Model",   widget: "input",  required: true,
    rules: [{ max: 100, message: "Max 100 chars" }], props: { placeholder: "customer" } },
  { name: "version", label: "Version", widget: "number", required: false, props: { min: 1, defaultValue: 1 } },
  { name: "isActive",label: "Active now?", widget: "switch", required: false },
];

export default function AdminUISchemaList() {
  const nav = useNavigate();

  // load list: map q => model filter
  const fetchList = useCallback(async (params: { limit?: number; offset?: number; q?: string }) => {
    const res = await SchemaAdminAPI.listSchemas({
      limit: params.limit, offset: params.offset,
      model: params.q && params.q.trim() ? params.q.trim() : undefined,
    });
    // ModelList expects {items, limit, offset, q?, total?}
    return { items: res.items, limit: res.limit, offset: res.offset, total: res.total, q: res.model };
  }, []);

  // create-modal state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reloadSignal, setReloadSignal] = useState(0);
  const triggerReload = () => setReloadSignal((x) => x + 1);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        model: String(values.model).trim(),
        version: values.version ?? 1,
        isActive: !!values.isActive,
      };
      const created = await SchemaAdminAPI.createSchema(payload);
      toast.success("Schema created");
      if (payload.isActive && !created.isActive) {
        // backend might create inactive; activate explicitly
        await SchemaAdminAPI.activateSchema(created.id);
        toast.success("Schema activated");
      }
      setOpen(false);
      triggerReload();
    } catch (e: any) {
      toast.error(e?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const actionsColumn = (row: UIListSchema) => (
    <div style={{ display: "flex", gap: 8 }}>
      <Button
        size="small"
        disabled={row.isActive}
        onClick={async () => {
          try {
            await SchemaAdminAPI.activateSchema(row.id);
            toast.success("Activated");
            triggerReload();
          } catch (e: any) { toast.error(e?.message || "Activate failed"); }
        }}
      >
        Activate
      </Button>
      <Button
        size="small"
        onClick={() => nav(`/admin/ui-schemas/${row.id}/fields?model=${encodeURIComponent(row.model)}`)}
      >
        Manage Fields
      </Button>
    </div>
  );

  return (
    <Container maxWidth={1100}>
      <ModelList<UIListSchema>
        title="UI Schemas"
        columns={columns}
        fetchList={fetchList}
        addLabel="New Schema"
        onAdd={() => setOpen(true)}
        reloadSignal={reloadSignal}
        actionsColumn={actionsColumn}
      />

      <CoeModal
        title="New UI Schema"
        open={open}
        onOk={() => (document.querySelector("form") as HTMLFormElement)?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))}
        onCancel={() => setOpen(false)}
        okText="Create"
        confirmLoading={submitting}
      >
        <CoeForm schema={createSchema} onSubmit={handleCreate} />
      </CoeModal>
    </Container>
  );
}
