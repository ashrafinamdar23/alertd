import { create } from "zustand";
import { message } from "antd";
import type { ReactNode } from "react";

type ToastOptions = { key?: string; durationMs?: number };
type Durations = { successMs: number; errorMs: number; infoMs: number; warningMs: number };

type ToastStore = {
  api: any | null;                       // AntD message instance from useMessage()
  setApi: (api: any) => void;

  durations: Durations;
  setDurations: (d: Partial<Durations>) => void;

  success: (content: ReactNode, opts?: ToastOptions) => void;
  error:   (content: ReactNode, opts?: ToastOptions) => void;
  info:    (content: ReactNode, opts?: ToastOptions) => void;
  warning: (content: ReactNode, opts?: ToastOptions) => void;

  loading: (content: ReactNode, opts?: ToastOptions) => string; // returns key
  close:   (key: string) => void;
};

const msToSec = (ms: number) => Math.max(0, ms) / 1000;
const genKey = () => `toast_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

export const useToastStore = create<ToastStore>((set, get) => ({
  api: null,
  setApi: (api) => set({ api }),

  durations: { successMs: 2000, errorMs: 4000, infoMs: 3000, warningMs: 3000 },
  setDurations: (d) => set((s) => ({ durations: { ...s.durations, ...d } })),

  success: (content, opts) => {
    const ms = opts?.durationMs ?? get().durations.successMs;
    const m = get().api ?? message;
    m.open({ type: "success", content, duration: msToSec(ms), key: opts?.key });
  },
  error: (content, opts) => {
    const ms = opts?.durationMs ?? get().durations.errorMs;
    const m = get().api ?? message;
    m.open({ type: "error", content, duration: msToSec(ms), key: opts?.key });
  },
  info: (content, opts) => {
    const ms = opts?.durationMs ?? get().durations.infoMs;
    const m = get().api ?? message;
    m.open({ type: "info", content, duration: msToSec(ms), key: opts?.key });
  },
  warning: (content, opts) => {
    const ms = opts?.durationMs ?? get().durations.warningMs;
    const m = get().api ?? message;
    m.open({ type: "warning", content, duration: msToSec(ms), key: opts?.key });
  },

  loading: (content, opts) => {
    const key = opts?.key ?? genKey();
    const m = get().api ?? message;
    m.open({ type: "loading", content, duration: 0, key });
    return key;
  },
  close: (key) => {
    const m = get().api ?? message;
    m.destroy(key);
  },
}));

export const toast = {
  success: (c: ReactNode, o?: ToastOptions) => useToastStore.getState().success(c, o),
  error:   (c: ReactNode, o?: ToastOptions) => useToastStore.getState().error(c, o),
  info:    (c: ReactNode, o?: ToastOptions) => useToastStore.getState().info(c, o),
  warning: (c: ReactNode, o?: ToastOptions) => useToastStore.getState().warning(c, o),
  loading: (c: ReactNode, o?: ToastOptions) => useToastStore.getState().loading(c, o),
  close:   (key: string) => useToastStore.getState().close(key),
  setDurations: (d: Partial<Durations>) => useToastStore.getState().setDurations(d),
};
