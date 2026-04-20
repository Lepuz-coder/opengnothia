import { create } from "zustand";

export type ToastType = "success" | "info" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

const TOAST_TTL_MS = 3000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, type = "success") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().dismiss(id);
    }, TOAST_TTL_MS);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function showToast(message: string, type?: ToastType) {
  useToastStore.getState().show(message, type);
}
