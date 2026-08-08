import React, { useState, useCallback, createContext, useContext, useRef } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  success: {
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-500/30',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    text: 'text-emerald-200',
  },
  error: {
    bg: 'bg-red-950/90',
    border: 'border-red-500/30',
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    text: 'text-red-200',
  },
  warning: {
    bg: 'bg-amber-950/90',
    border: 'border-amber-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    text: 'text-amber-200',
  },
  info: {
    bg: 'bg-sky-950/90',
    border: 'border-sky-500/30',
    icon: <Info className="w-4 h-4 text-sky-400" />,
    text: 'text-sky-200',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${++idCounter.current}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-2.5 ${style.bg} ${style.border} border backdrop-blur-xl rounded-xl px-4 py-3 shadow-2xl animate-fade-in-up pointer-events-auto`}
              role="alert"
              aria-live="assertive"
            >
              <span className="flex-shrink-0 mt-0.5">{style.icon}</span>
              <p className={`text-xs ${style.text} leading-relaxed flex-grow`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors"
                aria-label="Zavřít oznámení"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}