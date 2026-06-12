import { useEffect } from 'react';
import type { ToastItem } from '../types';

interface Props {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function Toast({ toasts, onRemove }: Props) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast-${toast.type}`} onClick={() => onRemove(toast.id)}>
      {toast.message}
    </div>
  );
}
