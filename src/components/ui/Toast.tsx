'use client'

import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const newToast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const typeStyles = {
    success: {
      border: "rgb(0, 255, 0)",
      bg: "rgba(0, 255, 0, 0.1)",
      text: "rgb(0, 255, 0)",
      icon: "✓",
    },
    error: {
      border: "rgb(255, 0, 0)",
      bg: "rgba(255, 0, 0, 0.1)",
      text: "rgb(255, 0, 0)",
      icon: "✗",
    },
    warning: {
      border: "rgb(255, 255, 0)",
      bg: "rgba(255, 255, 0, 0.1)",
      text: "rgb(255, 255, 0)",
      icon: "⚠",
    },
    info: {
      border: "rgb(0, 255, 255)",
      bg: "rgba(0, 255, 255, 0.1)",
      text: "rgb(0, 255, 255)",
      icon: "ℹ",
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div
      className="max-w-sm w-full pointer-events-auto animate-slide-up font-pixel text-xs pixel-box"
      style={{
        backgroundColor: "rgba(28, 0, 51, 0.95)",
        border: `4px solid ${style.border}`,
        boxShadow: `inset 0 0 10px ${style.border}, 0 0 20px ${style.border}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-start p-3">
        <div className="flex-shrink-0 mr-3">
          <div
            className="w-4 h-4 flex items-center justify-center text-lg leading-none"
            style={{ color: style.text }}
          >
            {style.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-pixel text-xs font-bold mb-1 uppercase tracking-wider"
            style={{ color: style.text }}
          >
            {toast.title}
          </p>
          {toast.message && (
            <p
              className="font-pixel text-xs leading-relaxed"
              style={{ color: "rgb(255, 255, 255)" }}
            >
              {toast.message}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 ml-3">
          <button
            className="pixel-button-cyan text-xs px-2 py-1"
            onClick={() => onRemove(toast.id)}
            style={{
              minWidth: "auto",
              padding: "4px 8px",
              fontSize: "10px",
              border: `2px solid ${style.border}`,
              color: style.text,
              backgroundColor: "transparent",
            }}
          >
            ✗
          </button>
        </div>
      </div>
    </div>
  );
}
