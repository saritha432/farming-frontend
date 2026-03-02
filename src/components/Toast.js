import React, { useEffect } from 'react';

const TOAST_TTL = 3500;

function Toast({ message, type = 'info', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(), TOAST_TTL);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`toast toast-${type}`} role="alert">
      {message}
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

export function useToast(addToast) {
  return (message, type = 'info') => addToast({ id: Date.now(), message, type });
}
