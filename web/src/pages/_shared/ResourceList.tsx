import { useEffect, useState, useCallback } from "react";
import { Alert, Tag, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import Container from "../../components/Container";
import ModelList from "../../components/ModelList";
import CoeModal from "../../components/CoeModal";
import CoeForm, { type Field } from "../../components/CoeForm";
import { SchemaAPI, type ListSchemaDTO } from "../../services/schema";
import { toast } from "../../stores/toast";

type ListParams = { limit?: number; offset?: number; q?: string };
type FetchListResp<T> = { items: T[]; limit: number; offset: number; total?: number };

type CreateConfig = {
  schema: Field[];
  submit: (values: any) => Promise<void>;
  addLabel?: string;
  okText?: string;
};

type Props<T extends object> = {
  model: string;
  title?: string;
  fetchList: (params: ListParams) => Promise<FetchListResp<T>>;
  create?: CreateConfig; // optional: if omitted, hides Add button
  /** External trigger to force a reload (e.g., parent increments a counter) */
  reloadSignal?: number | string;
};

export default function ResourceList<T extends object>({
  model,
  title,
  fetchList,
  create,
  reloadSignal,
}: Props<T>) {
  const [schemaCols, setSchemaCols] = useState<ColumnsType<T> | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);

  // modal/create state (only if create is provided)
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // load list schema (NO FALLBACK)
  useEffect(() => {
    let mounted = true;
    setSchemaLoading(true);
    setSchemaError(null);
    (async () => {
      try {
        const s: ListSchemaDTO = await SchemaAPI.getListSchema(model);
        if (!mounted) return;

        const cols: ColumnsType<T> = s.columns.map((c) => {
          const col: any = { title: c.label, dataIndex: c.field };
          if (c.width) col.width = c.width;
          if (c.align) col.align = c.align;
          switch (c.type) {
            case "datetime":
              col.render = (v: string | null) => (v ? new Date(v).toLocaleString() : "-");
              break;
            case "boolean":
              col.render = (v: boolean) => (v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>);
              break;
          }
          return col;
        });

        setSchemaCols(cols);
      } catch (e: any) {
        const msg = e?.message || "No active list schema found";
        setSchemaError(msg);
      } finally {
        setSchemaLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [model]);

  // internal reload (used after create)
  const [internalReload, setInternalReload] = useState(0);
  const triggerInternalReload = () => setInternalReload((x) => x + 1);

  // combine external + internal signals so any change forces ModelList reload
  const combinedReload = `${reloadSignal ?? ""}-${internalReload}`;

  const onSubmitCreate = useCallback(
    async (values: any) => {
      if (!create) return;
      setSubmitting(true);
      try {
        await create.submit(values);
        toast.success("Created");
        setOpen(false);
        triggerInternalReload();
      } catch (e: any) {
        toast.error(e?.message || "Create failed");
      } finally {
        setSubmitting(false);
      }
    },
    [create]
  );

  if (schemaLoading) {
    return (
      <Container maxWidth={960}>
        <div style={{ display: "grid", placeItems: "center", height: 160 }}>
          <Spin />
        </div>
      </Container>
    );
  }

  if (schemaError || !schemaCols) {
    return (
      <Container maxWidth={960}>
        <Alert
          type="error"
          showIcon
          message={`Cannot render ${title || model}`}
          description={schemaError || "No active list schema configured for this model."}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth={960}>
      <ModelList<T>
        title={title || model}
        columns={schemaCols}
        fetchList={fetchList}
        addLabel={create?.addLabel || "Add"}
        onAdd={create ? () => setOpen(true) : undefined}
        reloadSignal={combinedReload}
      />

      {create && (
        <CoeModal
          title={create.addLabel || "Add"}
          open={open}
          onOk={() =>
            (document.querySelector("form") as HTMLFormElement)?.dispatchEvent(
              new Event("submit", { cancelable: true, bubbles: true })
            )
          }
          onCancel={() => setOpen(false)}
          okText={create.okText || "Create"}
          confirmLoading={submitting}
        >
          <CoeForm schema={create.schema} onSubmit={onSubmitCreate} />
        </CoeModal>
      )}
    </Container>
  );
}
