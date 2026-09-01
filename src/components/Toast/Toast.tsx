import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import './Toast.css';

const TOAST_AUTO_HIDE_MS = 5000;

interface ToastItem {
  id: number;
  message: string;
}

interface ToastValue {
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

/** ToastProvider renders auto-hiding popups; useToast() shows them. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showError = useCallback(
    (message: string) => {
      const id = nextId.current + 1;
      nextId.current = id;
      setToasts((prev) => [...prev, { id, message }]);
      window.setTimeout(() => dismiss(id), TOAST_AUTO_HIDE_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className="toast toast--error"
            onClick={() => dismiss(toast.id)}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
