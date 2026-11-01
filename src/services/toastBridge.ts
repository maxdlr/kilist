import type { ToastType } from "@/providers/ToastProvider";

// Bridges toast triggering into non-React code (e.g. SWR's global onError
// config), which can't call the useToast hook directly.
let trigger: ((message: string, type?: ToastType) => void) | null = null;

export const setToastTrigger = (
  fn: (message: string, type?: ToastType) => void,
) => {
  trigger = fn;
};

export const notifyToast = (message: string, type?: ToastType) => {
  trigger?.(message, type);
};
