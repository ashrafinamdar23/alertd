import { get, post } from "./http";

export type Customer = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListResp = {
  items: Customer[];
  limit: number;
  offset: number;
  q?: string;
  total?: number;
};

export const CustomersAPI = {
  list: (params?: { limit?: number; offset?: number; q?: string }) =>
    get<CustomerListResp>("customers", { params }),
  create: (payload: { name: string }) =>
    post<Customer>("customers", payload),
};
