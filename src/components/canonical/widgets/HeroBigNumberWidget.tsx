/**
 * <HeroBigNumberWidget> — Hero gigante de página executiva.
 * Mostra um KPI principal em tamanho grande, variação % vs período
 * anterior e sinalizador semáforo (🟢🟡🟠🔴). Usado no topo do
 * Portal Público.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface HeroBigNumberProps {
  /** Rótulo do indicador (ex: "Receita Atribuída", "ROAS") */
  label: string
  /** Valor atual formatado (ex: "R$ 36.000", "5,2x", "127 leads") */
  value: string
  /** Variação % vs período anterior (-0.15 = -15%, 0.23 = +23%) */
  variationPct?: number | null
  /** Rótulo do período anterior usado na comparação (ex: "vs. Fev/26") */
  comparisonLabel?: string
  /** Se a variação é positiva ou negativa pro negócio.
   *  Default true (maior = melhor). Use false para CPL/CAC. */
  higherIsBetter?: boolean
  /** Status do KPI: green/yellow/orange/red. Se não passar, calcula da variação. */
  signalColor?: 'green' | 'yellow' | 'orange' | 'red'
  /** Texto curto explicativo abaixo do valor */
  helperText?: string
}

const SIGNAL_CONFIG = {
  green:  { bg: 'bg-emerald-50',  ring: 'ring-emerald-200',  emoji: '🟢', text: 'text-emerald-700' },
  yellow: { bg: 'bg-amber-50',    ring: 'ring-amber-200',    emoji: '🟡', text: 'text-amber-700' },
  orange: { bg: 'bg-orange-50',   ring: 'ring-orange-200',   emoji: '🟠', text: 'text-orange-700' },
  red:    { bg: 'bg-red-50',      ring: 'ring-red-200',      emoji: '🔴', text: 'text-red-700' },
}

export default function HeroBigNumberWidget({
  label,
  value,
  variationPct,
  comparisonLabel,
  higherIsBetter = true,
  signalColor,
  helperText,
}: HeroBigNumberProps) {
  // Calcula sinal automaticamente se não foi passado
  const computedSignal: keyof typeof SIGNAL_CONFIG = (() => {
    if (signalColor) return signalColor
    if (variationPct == null) return 'yellow'
    const v = higherIsBetter ? variationPct : -variationPct
    if (v >= 0.05) return 'green'
    if (v >= -0.05) return 'yellow'
    if (v >= -0.20) return 'orange'
    return 'red'
  })()
  const cfg = SIGNAL_CONFIG[computedSignal]

  const variationDisplay =
    variationPct == null
      ? null
      : `${variationPct > 0 ? '+' : ''}${(variationPct * 100).toFixed(1).replace('.', ',')}%`

  const trendIcon =
    variationPct == null || Math.abs(variationPct) < 0.01
      ? Minus
      : variationPct > 0
        ? TrendingUp
        : TrendingDown
  const Trend = trendIcon

  const trendColor =
    variationPct == null
      ? 'text-slate-400'
      : (higherIsBetter ? variationPct > 0 : variationPct < 0)
        ? 'text-emerald-600'
        : 'text-red-600'

  return (
    <div className={`rounded-2xl ${cfg.bg} ring-1 ${cfg.ring} p-8 md:p-10`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-5xl md:text-6xl font-bold text-slate-900 leading-none tracking-tight tabular-nums">
            {value}
          </p>
          {helperText && (
            <p className="mt-3 text-sm text-slate-600">{helperText}</p>
          )}
          {variationPct != null && (
            <div className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${trendColor}`}>
              <Trend className="w-4 h-4" />
              <span>{variationDisplay}</span>
              {comparisonLabel && (
                <span className="text-slate-500 font-normal ml-1">
                  {comparisonLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text} text-sm font-semibold ring-1 ${cfg.ring}`}>
          <span>{cfg.emoji}</span>
        </div>
      </div>
    </div>
  )
}
