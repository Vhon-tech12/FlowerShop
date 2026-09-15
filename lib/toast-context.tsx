'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  description?: string;
  type: 'success' | 'error' | 'info';
  actionLabel?: string;
  actionUrl?: string;
}

interface ToastContextType {
  showToast: (options: {
    message: string;
    description?: string;
    type?: 'success' | 'error' | 'info';
    actionLabel?: string;
    actionUrl?: string;
  }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    ({
      message,
      description,
      type = 'success',
      actionLabel,
      actionUrl,
    }: {
      message: string;
      description?: string;
      type?: 'success' | 'error' | 'info';
      actionLabel?: string;
      actionUrl?: string;
    }) => {
      const id = Date.now();
      const newToast: Toast = {
        id,
        message,
        description,
        type,
        actionLabel,
        actionUrl,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full max-w-sm animate-slide-down overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
            style={{
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  toast.type === 'success'
                    ? 'bg-green-100 text-green-600'
                    : toast.type === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {toast.type === 'success' && (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{toast.message}</p>
                {toast.description && (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {toast.description}
                  </p>
                )}
                {toast.actionLabel && toast.actionUrl && (
                  <a
                    href={toast.actionUrl}
                    className="mt-2 inline-flex items-center text-sm font-medium text-pink-600 hover:underline"
                  >
                    {toast.actionLabel} →
                  </a>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-gray-100">
              <div
                className={`h-full ${
                  toast.type === 'success'
                    ? 'bg-green-500'
                    : toast.type === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  animation: 'progress 4s linear forwards',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};