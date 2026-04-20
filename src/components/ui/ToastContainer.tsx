import { useEffect, useState } from "react";
import { Check, Info, X, AlertCircle } from "lucide-react";
import { useToastStore, type Toast } from "@/stores/useToastStore";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const Icon = toast.type === "error" ? AlertCircle : toast.type === "info" ? Info : Check;
  const iconColor =
    toast.type === "error"
      ? "text-red-400"
      : toast.type === "info"
        ? "text-blue-400"
        : "text-green-400";

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 min-w-[240px] max-w-[360px] px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl transition-all duration-200 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm text-[var(--text-primary)] leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => dismiss(toast.id)}
        className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
