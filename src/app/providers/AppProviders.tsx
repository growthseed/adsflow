import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from '@/contexts/AuthContext'
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { ToastProvider } from '@/components/UI/Toast'
import { ConfirmDialogProvider } from '@/components/UI/ConfirmDialog'
import { CommandPaletteProvider } from '@/components/UI/CommandPalette'

// React Query — staleTime 5min, gcTime 30min
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
})

/**
 * Encapsula todos os providers globais do app em uma única árvore.
 * Ordem importa: Auth precisa de QueryClient; CommandPalette precisa
 * do Router; ToastProvider precisa estar acima do Confirm (confirm
 * dispara toast em alguns fluxos).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DateRangeProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <BrowserRouter>
                <CommandPaletteProvider>{children}</CommandPaletteProvider>
              </BrowserRouter>
            </ConfirmDialogProvider>
          </ToastProvider>
        </DateRangeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
