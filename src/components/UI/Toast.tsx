/**
 * TOAST NOTIFICATION SYSTEM
 * Efeito Digital - Ads Flow
 *
 * Notificações globais (sucesso, erro, info, warning).
 * Usar: toast.success('Relatório exportado!')
 */

import { useState, useCallback, createContext, useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastContextType {
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

// =====================================================
// CONTEXT
// =====================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// =====================================================
// CONFIG
// =====================================================

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
  },
}

// =====================================================
// PROVIDER
// =====================================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev, { id, type, message, duration }])

    // Auto-remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast: ToastContextType = {
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => {
          const config = TOAST_CONFIG[t.type]
          const Icon = config.icon
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-[slideIn_0.3s_ease-out] max-w-sm ${config.bg} ${config.border}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${config.text}`} />
              <p className={`text-sm font-medium flex-1 ${config.text}`}>{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className={`p-0.5 rounded hover:bg-black/5 ${config.text} opacity-60 hover:opacity-100 flex-shrink-0`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// =====================================================
// HOOK
// =====================================================

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}
