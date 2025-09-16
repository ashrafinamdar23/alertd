import { get, post } from "./http";

export type ListSchemaDTO = {
  model: string;
  columns: Array<{
    field: string;
    label: string;
    type: "string" | "number" | "datetime" | "boolean";
    width?: number;
    align?: "left" | "right" | "center";
    sortable?: boolean;
    searchable?: boolean;
  }>;
};

export type UIListSchema = {
  id: number;
  model: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type UIListSchemasResp = {
  items: UIListSchema[];
  limit: number;
  offset: number;
  total: number;
  model?: string;
};

export type UIListSchemaField = {
  id: number;
  schemaId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: "string" | "number" | "datetime" | "boolean";
  width?: number | null;
  align: "left" | "right" | "center";
  sortable: boolean;
  searchable: boolean;
  orderNo: number;
  visible: boolean;
};

export type FormFieldOptionDTO = { label: string; value: string; order: number };
export type FormFieldDTO = {
  name: string; label: string; widget: string; dataType: string;
  required: boolean; maxLen?: number; minLen?: number;
  pattern?: string; placeholder?: string; orderNo: number;
  options?: FormFieldOptionDTO[];
};

export type FormSchemaDTO = { model: string; kind: "create" | "edit"; fields: FormFieldDTO[] };



export const SchemaAdminAPI = {
  listSchemas: (params?: { model?: string; limit?: number; offset?: number }) =>
    get<UIListSchemasResp>("schema/lists", { params }),

  createSchema: (payload: { model: string; isActive?: boolean; version?: number }) =>
    post<UIListSchema>("schema/list", payload),

  activateSchema: (id: number) =>
    post<{ status: string }>(`schema/list/${id}/activate`, {}),

  listFields: (schemaId: number) =>
    get<{ items: UIListSchemaField[] }>(`schema/list/${schemaId}/fields`),
  addField: (schemaId: number, payload: {
    field_name: string; field_label: string; field_type: string;
    width?: number | null; align?: string; sortable?: boolean;
    searchable?: boolean; order_no?: number; visible?: boolean;
  }) => post<UIListSchemaField>(`schema/list/${schemaId}/fields`, payload),
};


export const SchemaAPI = {
  getListSchema: (model: string) =>
    get<ListSchemaDTO>("schema/list", { params: { model } }),

  getFormSchema: (model: string, kind: "create" | "edit") =>
    get<FormSchemaDTO>("schema/form", { params: { model, kind } }),
};