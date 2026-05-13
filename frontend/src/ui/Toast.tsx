import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import './Toast.css';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  tone: ToastTone;
  texto: string;
}

interface ToastCtx {
  push: (tone: ToastTone, texto: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((tone: ToastTone, texto: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, tone, texto }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setClosing(true), 3100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`toast toast-${toast.tone} ${closing ? 'is-out' : ''}`} onClick={onClose}>
      <span className="toast-dot" />
      <span className="toast-txt">{toast.texto}</span>
    </div>
  );
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used inside ToastProvider');
  return c;
}
