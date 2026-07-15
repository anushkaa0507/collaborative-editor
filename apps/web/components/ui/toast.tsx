"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

let toasts: ToastItem[] = [];
let listeners: Array<(toasts: ToastItem[]) => void> = [];

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function subscribe(listener: (toasts: ToastItem[]) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getToasts() {
  return toasts;
}

function getServerToasts(): ToastItem[] {
  return [];
}

function addToast(message: string, type: ToastType = "info") {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, message }];
  emit();
  setTimeout(() => removeToast(id), 4000);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function showSuccess(message: string) {
  addToast(message, "success");
}

function showError(message: string) {
  addToast(message, "error");
}

export function useToast() {
  const toasts = useSyncExternalStore(subscribe, getToasts, getServerToasts);

  return {
    toasts,
    showToast: addToast,
    showSuccess,
    showError,
    dismiss: removeToast,
  };
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const styles =
    toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-ink";

  const icon = toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "•";

  return (
    <div
      onClick={onDismiss}
      className={`pointer-events-auto px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white cursor-pointer flex items-center gap-3 min-w-[260px] max-w-sm transition-all duration-300 ${styles} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <span className="text-base leading-none w-4 text-center">{icon}</span>
      <span className="flex-1">{toast.message}</span>
    </div>
  );
}