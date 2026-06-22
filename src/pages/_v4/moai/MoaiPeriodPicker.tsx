/**
 * <MoaiPeriodPicker> — Dropdown de período + toggle comparativo.
 *
 * Diferenciais vs DateRangeSelector base:
 *   - Posiciona dropdown com `right-0` (não vaza à direita)
 *   - Toggle comparativo sempre visível
 *   - Mostra "Comparado com período anterior (X a Y)" inline
 *   - Persiste no MoaiPeriodContext
 *
 * Renderiza no Topbar do MoaiAppShell.
 */

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMoaiPeriod, type DateRange } from '@/contexts/MoaiPeriodContext'

const PRESETS: Array<{ label: string; getValue: () => DateRange }> = [
  { label: 'Hoje', getValue: () => ({ startDate: new Date(), endDate: new Date() }) },
  { label: 'Últimos 7 dias', getValue: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  { label: 'Últimos 30 dias', getValue: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  { label: 'Últimos 90 dias', getValue: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  { label: 'Este mês', getValue: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  { label: 'Mês passado', getValue: () => ({ startDate: startOfMonth(subMonths(new Date(), 1)), endDate: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Este trimestre', getValue: () => ({ startDate: startOfQuarter(new Date()), endDate: new Date() }) },
  { label: 'Trimestre passado', getValue: () => ({ startDate: startOfQuarter(subQuarters(new Date(), 1)), endDate: endOfQuarter(subQuarters(new Date(), 1)) }) },
  { label: 'Este ano', getValue: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
]

export function MoaiPeriodPicker() {
  const { currentRange, compareRange, compareEnabled, presetLabel, setCurrentRange, setCompareEnabled } = useMoaiPeriod()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  const handlePreset = (preset: typeof PRESETS[0]) => {
    setCurrentRange(preset.getValue(), preset.label)
    setOpen(false)
  }

  const isSameDay = currentRange.startDate.toDateString() === currentRange.endDate.toDateString()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md hover:border-[#1A1F36] text-xs"
      >
        <Calendar size={12} className="text-gray-500" />
        <span className="font-medium text-[#1A1F36]">
          {isSameDay
            ? format(currentRange.startDate, 'dd MMM yyyy', { locale: ptBR })
            : `${format(currentRange.startDate, 'dd MMM', { locale: ptBR })} — ${format(currentRange.endDate, 'dd MMM yyyy', { locale: ptBR })}`}
        </span>
        {compareEnabled && (
          <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2">
            vs {format(compareRange.startDate, 'dd MMM', { locale: ptBR })} — {format(compareRange.endDate, 'dd MMM', { locale: ptBR })}
          </span>
        )}
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-50 min-w-[260px] py-2"
        >
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Período</div>
          {PRESETS.map((p) => {
            const active = p.label === presetLabel
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePreset(p)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                  active ? 'text-[#1A1F36] font-semibold' : 'text-gray-700'
                }`}
              >
                {active && <Check size={11} className="text-emerald-600" />}
                {!active && <span className="w-2.5" />}
                {p.label}
              </button>
            )
          })}
          <div className="border-t border-gray-100 mt-1 pt-2 px-3">
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={(e) => setCompareEnabled(e.target.checked)}
                className="rounded"
              />
              Comparar com período anterior
            </label>
            {compareEnabled && (
              <div className="mt-1 text-[10px] text-gray-400">
                {format(compareRange.startDate, 'dd MMM yyyy', { locale: ptBR })} — {format(compareRange.endDate, 'dd MMM yyyy', { locale: ptBR })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
