// web/src/services/http.ts
import axios from "axios";
import type { AxiosRequestConfig } from "axios"

export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

// Normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    let detail = "Network error or timeout";
    if (err?.response) {
      const data = err.response.data;
      detail =
        typeof data === "string"
          ? data
          : data?.error || data?.message || JSON.stringify(data);
    } else if (err?.message) {
      detail = err.message;
    }
    const e = new Error(`${detail}${status ? ` (${status})` : ""}`);
    (e as any).status = status;
    (e as any).data = err?.response?.data;
    return Promise.reject(e);
  }
);

// Lightweight typed helpers
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.put<T>(url, body, config);
  return data;
}
export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}

// Generic CRUD factory for resource-style endpoints
export function createResource<TList, TOne, TCreate = unknown, TUpdate = unknown>(base: string) {
  return {
    list: (params?: Record<string, unknown>) => get<TList>(base, { params }),
    get: (id: string) => get<TOne>(`${base}/${encodeURIComponent(id)}`),
    create: (payload: TCreate) => post<TOne>(base, payload),
    update: (id: string, payload: TUpdate) => put<TOne>(`${base}/${encodeURIComponent(id)}`, payload),
    remove: (id: string) => del<void>(`${base}/${encodeURIComponent(id)}`),
  };
}
