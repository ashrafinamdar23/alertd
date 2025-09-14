import { useCallback, useState } from "react";
import { message } from "antd";
import Container from "../../components/Container";
import ModelList from "../../components/ModelList";
import type { ColumnsType } from "antd/es/table";
import { CustomersAPI, type Customer } from "../../services/customers";
import CoeModal from "../../components/CoeModal";
import CoeForm, { type Field } from "../../components/CoeForm";
import { Form } from "antd";
import { toast } from "../../stores/toast";

const columns: ColumnsType<Customer> = [
  { title: "ID", dataIndex: "id", width: 100 },
  { title: "Name", dataIndex: "name" },
  {
    title: "Created",
    dataIndex: "createdAt",
    render: (v: string) => new Date(v).toLocaleString(),
    width: 200,
  },
];

const createSchema: Field[] = [
  {
    name: "name",
    label: "Name",
    widget: "input",
    required: true,
    rules: [{ max: 255, message: "Max 255 characters" }],
    props: { autoFocus: true, placeholder: "Acme Corp" },
  },
];

export default function CustomersList() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form] = Form.useForm<{ name: string }>();

  const fetchList = useCallback(
    (params: { limit?: number; offset?: number; q?: string }) =>
      CustomersAPI.list(params),
    []
  );

  const [reloadSignal, setReloadSignal] = useState(0);
  const triggerReload = () => setReloadSignal((x) => x + 1);

  const onAdd = () => {
    setFormError(null);
    form.resetFields();
    setOpen(true);
  };

  const submitCreate = async (values: { name: string }) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await CustomersAPI.create({ name: values.name.trim() });
      message.success("Customer created");
      toast.success("Customer created");
      setOpen(false);
      triggerReload();
    } catch (e: any) {
      const status = e?.status as number | undefined;
      const msg = e?.message as string | undefined;
      if (status === 409) {
        form.setFields([{ name: "name", errors: ["Customer already exists"] }]);
        message.warning("Customer already exists");
        toast.warning("Customer already exists");
      } else if (status === 400) {
        setFormError("Invalid input. Please check the form.");
        message.error("Validation error");
      } else {
        setFormError(msg || "Create failed");
        message.error(msg || "Create failed");
        toast.error(msg || "Create failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth={960}>
      <ModelList<Customer>
        title="Customers"
        columns={columns}
        fetchList={fetchList}
        addLabel="New Customer"
        onAdd={onAdd}
        reloadSignal={reloadSignal}
      />

      <CoeModal
        title="New Customer"
        open={open}
        onOk={() => form.submit()}
        onCancel={() => setOpen(false)}
        okText="Create"
        confirmLoading={submitting}
      >
        <CoeForm
          form={form}
          schema={createSchema}
          errorText={formError}
          onSubmit={submitCreate}
        />
      </CoeModal>
    </Container>
  );
}
