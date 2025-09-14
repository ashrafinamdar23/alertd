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
    const msg = err?.response
      ? `HTTP ${err.response.status}: ${
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data)
        }`
      : err?.request
      ? "Network error or timeout"
      : err?.message || "Unknown error";
    return Promise.reject(new Error(msg));
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
