'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const borderColor = isSuccess ? '#10b981' : isError ? '#f43f5e' : '#6366f1';
          const bgColor = isSuccess
            ? 'rgba(6, 78, 59, 0.9)'
            : isError
            ? 'rgba(136, 19, 55, 0.9)'
            : 'rgba(30, 27, 75, 0.9)';

          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                color: '#ffffff',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                animation: 'slideUp 0.3s ease-out',
                fontSize: '0.9rem',
              }}
            >
              {isSuccess && <CheckCircle2 size={18} color="#34d399" />}
              {isError && <AlertCircle size={18} color="#fb7185" />}
              {!isSuccess && !isError && <Info size={18} color="#818cf8" />}

              <span style={{ flex: 1, lineHeight: '1.4' }}>{toast.message}</span>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
