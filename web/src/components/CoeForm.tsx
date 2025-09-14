import React from "react";
import { Alert, Form, Input, InputNumber, Select, Switch, DatePicker, Button } from "antd";
import type { FormInstance, Rule } from "antd/es/form";

export type FieldOption = { label: React.ReactNode; value: string | number; disabled?: boolean };

export type Field =
  | { name: string; label: React.ReactNode; widget: "input" | "password" | "textarea" | "email"; placeholder?: string; rules?: Rule[]; required?: boolean; props?: any; }
  | { name: string; label: React.ReactNode; widget: "number"; rules?: Rule[]; required?: boolean; props?: any; }
  | { name: string; label: React.ReactNode; widget: "select"; options: FieldOption[]; rules?: Rule[]; required?: boolean; placeholder?: string; props?: any; }
  | { name: string; label: React.ReactNode; widget: "switch"; rules?: Rule[]; required?: boolean; props?: any; }
  | { name: string; label: React.ReactNode; widget: "date" | "datetime"; rules?: Rule[]; required?: boolean; props?: any; };

export type CoeFormProps<T extends object = any> = {
  form?: FormInstance<T>;
  layout?: "vertical" | "horizontal" | "inline";
  schema: Field[];
  initialValues?: Partial<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  /** Show a submit button (useful when not inside a modal). Default: hidden */
  submitLabel?: string;
  showSubmit?: boolean;
  /** Optional top-level error (e.g., server error) */
  errorText?: string | null;
};

export default function CoeForm<T extends object>({
  form,
  layout = "vertical",
  schema,
  initialValues,
  onSubmit,
  submitLabel = "Submit",
  showSubmit = false,
  errorText,
}: CoeFormProps<T>) {
  const [internalForm] = Form.useForm<T>();
  const usedForm = form ?? internalForm;

  const renderField = (f: Field) => {
    const rules: Rule[] = [
      ...(f.required ? [{ required: true, message: "Required" }] : []),
      ...(f.rules ?? []),
    ];

    switch (f.widget) {
      case "input":
      case "email":
      case "password":
      case "textarea": {
        const common = {
          placeholder: "placeholder" in f ? f.placeholder : undefined,
          ...(f.props || {}),
        };
        const Comp =
          f.widget === "textarea" ? Input.TextArea :
          f.widget === "password" ? Input.Password :
          Input;
        return <Form.Item name={f.name} label={f.label} rules={rules}><Comp {...common} /></Form.Item>;
      }
      case "number":
        return (
          <Form.Item name={f.name} label={f.label} rules={rules}>
            <InputNumber style={{ width: "100%" }} {...(f as any).props} />
          </Form.Item>
        );
      case "select": {
        const { options, placeholder, props } = f as any;
        return (
          <Form.Item name={f.name} label={f.label} rules={rules}>
            <Select options={options} placeholder={placeholder} {...props} />
          </Form.Item>
        );
      }
      case "switch":
        return (
          <Form.Item name={f.name} label={f.label} valuePropName="checked" rules={rules}>
            <Switch {...(f as any).props} />
          </Form.Item>
        );
      case "date":
      case "datetime": {
        const showTime = f.widget === "datetime";
        return (
          <Form.Item name={f.name} label={f.label} rules={rules}>
            <DatePicker style={{ width: "100%" }} showTime={showTime} {...(f as any).props} />
          </Form.Item>
        );
      }
    }
  };

  return (
    <Form<T>
      form={usedForm}
      layout={layout}
      initialValues={initialValues as any}
      onFinish={onSubmit}
    >
      {errorText ? (
        <Alert type="error" showIcon style={{ marginBottom: 12 }} message={errorText} />
      ) : null}

      {schema.map((f) => (
        <React.Fragment key={f.name}>{renderField(f)}</React.Fragment>
      ))}

      {showSubmit && (
        <Form.Item>
          <Button type="primary" htmlType="submit">{submitLabel}</Button>
        </Form.Item>
      )}
    </Form>
  );
}
