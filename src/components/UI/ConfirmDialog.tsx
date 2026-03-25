/**
 * CONFIRM DIALOG SYSTEM
 * Efeito Digital - Ads Flow
 *
 * Substitui window.confirm/alert por modal estilizado.
 * Usar: const confirmed = await confirm({ title, message })
 */

import { useState, useCallback, createContext, useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Trash2, Info } from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

type DialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
}

type ResolverFn = (value: boolean) => void

// =====================================================
// CONTEXT
// =====================================================

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmDialogProvider')
  return ctx.confirm
}

// =====================================================
// VARIANT CONFIG
// =====================================================

const VARIANT_CONFIG: Record<DialogVariant, {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  btnClass: string
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    btnClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    btnClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    btnClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
}

// =====================================================
// PROVIDER
// =====================================================

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<ResolverFn | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const handleClose = (result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }

  const variant = options?.variant || 'danger'
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modal overlay */}
      {options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-[fadeIn_150ms_ease-out]"
            onClick={() => handleClose(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-[scaleIn_150ms_ease-out]">
            <div className="p-6">
              {/* Icon + Content */}
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {options.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {options.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              >
                {options.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={() => handleClose(true)}
                autoFocus
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 ${config.btnClass}`}
              >
                {options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
