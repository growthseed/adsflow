/**
 * MoaiPeriodContext — período global compartilhado entre TODOS os módulos MOAI.
 *
 * Mantém:
 *   - `currentRange` — período selecionado (default: últimos 30 dias)
 *   - `compareRange` — período anterior automático (mesmo tamanho, deslocado pra trás)
 *   - `compareEnabled` — toggle comparativo on/off
 *
 * Todos os hooks Sales/CX/Conteudo/Membros lêem daqui e passam ao RPC.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

export interface DateRange {
  startDate: Date
  endDate: Date
}

interface MoaiPeriodContextValue {
  currentRange: DateRange
  compareRange: DateRange
  compareEnabled: boolean
  presetLabel: string
  setCurrentRange: (r: DateRange, label?: string) => void
  setCompareEnabled: (b: boolean) => void
  /** Formato ISO (YYYY-MM-DD) — pra passar pra RPCs */
  iso: {
    start: string
    end: string
    compareStart: string
    compareEnd: string
  }
}

const MoaiPeriodContext = createContext<MoaiPeriodContextValue | null>(null)

// Default: últimos 30 dias
function defaultRange(): DateRange {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 29)
  return { startDate: start, endDate: today }
}

function computeCompareRange(current: DateRange): DateRange {
  const diff = current.endDate.getTime() - current.startDate.getTime()
  const compareEnd = new Date(current.startDate.getTime() - 86_400_000) // 1 dia antes do start
  const compareStart = new Date(compareEnd.getTime() - diff)
  return { startDate: compareStart, endDate: compareEnd }
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function MoaiPeriodProvider({ children }: { children: ReactNode }) {
  const [currentRange, _setCurrentRange] = useState<DateRange>(defaultRange())
  const [presetLabel, setPresetLabel] = useState('Últimos 30 dias')
  const [compareEnabled, setCompareEnabled] = useState(true)

  const setCurrentRange = useCallback((r: DateRange, label?: string) => {
    _setCurrentRange(r)
    if (label) setPresetLabel(label)
    else setPresetLabel('Personalizado')
  }, [])

  const compareRange = useMemo(() => computeCompareRange(currentRange), [currentRange])

  const iso = useMemo(() => ({
    start: toISO(currentRange.startDate),
    end: toISO(currentRange.endDate),
    compareStart: toISO(compareRange.startDate),
    compareEnd: toISO(compareRange.endDate),
  }), [currentRange, compareRange])

  return (
    <MoaiPeriodContext.Provider value={{
      currentRange, compareRange, compareEnabled, presetLabel,
      setCurrentRange, setCompareEnabled, iso,
    }}>
      {children}
    </MoaiPeriodContext.Provider>
  )
}

export function useMoaiPeriod() {
  const ctx = useContext(MoaiPeriodContext)
  if (!ctx) {
    // Fallback seguro se usar fora do provider (não quebra)
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 29)
    const cur = { startDate: start, endDate: today }
    const comp = computeCompareRange(cur)
    return {
      currentRange: cur,
      compareRange: comp,
      compareEnabled: false,
      presetLabel: 'Últimos 30 dias',
      setCurrentRange: () => {},
      setCompareEnabled: () => {},
      iso: {
        start: toISO(cur.startDate),
        end: toISO(cur.endDate),
        compareStart: toISO(comp.startDate),
        compareEnd: toISO(comp.endDate),
      },
    } as MoaiPeriodContextValue
  }
  return ctx
}
