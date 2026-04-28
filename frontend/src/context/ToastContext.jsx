import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ── Toast Container ───────────────────────────────────────────────────────────

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
      zIndex: 9999, maxWidth: '360px', width: '100%',
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.85rem 1rem', borderRadius: '0.6rem',
            background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            borderLeft: `4px solid ${TOAST_COLORS[t.type]}`,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <span style={{
            flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
            background: TOAST_COLORS[t.type], color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {ICONS[t.type]}
          </span>
          <span style={{ flex: 1, fontSize: '0.875rem', lineHeight: '1.5', color: '#1e293b' }}>
            {t.message}
          </span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.1rem',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

const TOAST_COLORS = {
  success: '#10b981',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
};
