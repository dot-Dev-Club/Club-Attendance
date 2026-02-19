import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X, Sparkles } from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    info: <AlertCircle className="w-6 h-6" />,
  };

  const colors = {
    success: 'bg-white dark:bg-slate-800 text-success-700 dark:text-success-300 border-success-300 dark:border-success-600',
    error: 'bg-white dark:bg-slate-800 text-danger-700 dark:text-danger-300 border-danger-300 dark:border-danger-600',
    info: 'bg-white dark:bg-slate-800 text-info-700 dark:text-info-300 border-info-300 dark:border-info-600',
  };

  const iconBg = {
    success: 'bg-success-100 dark:bg-success-900/40 text-success-600 dark:text-success-400',
    error: 'bg-danger-100 dark:bg-danger-900/40 text-danger-600 dark:text-danger-400',
    info: 'bg-info-100 dark:bg-info-900/40 text-info-600 dark:text-info-400',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-0 top-0 z-[100] pointer-events-none flex justify-center pt-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto absolute flex flex-col items-center gap-3 px-8 py-5 rounded-2xl border-2 shadow-2xl min-w-[320px] max-w-[420px] ${colors[toast.type]}`}
            >
              {/* Celebration sparkles for success */}
              {toast.type === 'success' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], rotate: [0, 15, -10] }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute -top-3 -left-3 text-amber-400"
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], rotate: [0, -15, 10] }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.15 }}
                    className="absolute -top-3 -right-3 text-amber-400"
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.6], rotate: [0, 20, -5] }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-amber-400"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                </>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg[toast.type]}`}
              >
                {icons[toast.type]}
              </motion.div>

              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-base font-semibold text-center text-slate-800 dark:text-slate-100"
              >
                {toast.message}
              </motion.span>

              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
