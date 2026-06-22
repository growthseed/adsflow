/**
 * <TemperatureScaleWidget> — Termômetro visual com 5 zonas de temperatura do cliente.
 *
 *   ❄️  Frio (Crítico)       — risco churn alto, sem interação
 *   🟦  Morno (Em Risco)     — engajamento baixo
 *   🟡  Neutro (Estável)     — usa mas não cresce
 *   🟢  Quente (Engajado)    — interage, cresce
 *   🔥  Escaldante (Advocate)— promotor + referenciador
 *
 * Mostra distribuição percentual com animação de barra crescendo.
 */

import { useEffect, useState } from 'react'
import { ChartCard } from '../ChartCard'

export interface TemperaturaBucket {
  bucket: 'critico' | 'em_risco' | 'estavel' | 'engajado' | 'advocate'
  count: number
  membros_amostra?: string[]
}

export interface TemperatureScaleWidgetProps {
  title: string
  subtitle?: string
  buckets: TemperaturaBucket[]
  /** Total geral (pra calcular %) */
  total: number
  height?: number
}

const TEMP_CONFIG = {
  critico:   { label: 'Crítico',    icon: '❄️', color: '#3B82F6', textColor: 'text-blue-700',     bg: 'bg-blue-50',   border: 'border-blue-200',   action: 'Resgate urgente' },
  em_risco:  { label: 'Em risco',   icon: '🟦', color: '#06B6D4', textColor: 'text-cyan-700',     bg: 'bg-cyan-50',   border: 'border-cyan-200',   action: '1:1 prioritário' },
  estavel:   { label: 'Estável',    icon: '🟡', color: '#FFB800', textColor: 'text-amber-700',    bg: 'bg-amber-50',  border: 'border-amber-200',  action: 'Nutrir engajamento' },
  engajado:  { label: 'Engajado',   icon: '🟢', color: '#10B981', textColor: 'text-emerald-700',  bg: 'bg-emerald-50',border: 'border-emerald-200',action: 'Manter ritmo' },
  advocate:  { label: 'Advocate',   icon: '🔥', color: '#EF4444', textColor: 'text-red-700',      bg: 'bg-red-50',    border: 'border-red-200',    action: 'Pedir indicações' },
} as const

const ORDER: TemperaturaBucket['bucket'][] = ['critico', 'em_risco', 'estavel', 'engajado', 'advocate']

export default function TemperatureScaleWidget({
  title, subtitle, buckets, total, height = 320,
}: TemperatureScaleWidgetProps) {
  const [progress, setProgress] = useState(0)

  // Anima entrada
  useEffect(() => {
    const dur = 800
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const e = Math.min(1, (t - start) / dur)
      setProgress(1 - Math.pow(1 - e, 3))
      if (e < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [buckets])

  // Pega counts por bucket (default 0 se não vier)
  const byBucket = new Map(buckets.map((b) => [b.bucket, Number(b.count)]))
  const get = (k: TemperaturaBucket['bucket']) => byBucket.get(k) ?? 0

  // Temperatura média ponderada (escala 1-5)
  const weighted = ORDER.reduce((sum, k, i) => sum + (get(k) * (i + 1)), 0)
  const avgScore = total > 0 ? weighted / total : 0
  const avgConfig = TEMP_CONFIG[ORDER[Math.max(0, Math.min(4, Math.round(avgScore) - 1))]]

  return (
    <ChartCard title={title} subtitle={subtitle} height={height}>
      <div className="h-full flex flex-col">
        {/* Header com média */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Temperatura média</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl">{avgConfig.icon}</span>
              <span className={`text-2xl font-bold ${avgConfig.textColor}`}>{avgConfig.label}</span>
              <span className="text-xs text-gray-400">({avgScore.toFixed(2)}/5)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Total</div>
            <div className="text-xl font-bold text-[#1A1F36]">{total.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        {/* Stacked bar horizontal animada */}
        <div className="mb-4">
          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
            {ORDER.map((k) => {
              const cfg = TEMP_CONFIG[k]
              const v = get(k)
              const pct = total > 0 ? (v / total) * 100 * progress : 0
              return (
                <div
                  key={k}
                  className="h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
                  style={{ width: `${pct}%`, background: cfg.color }}
                  title={`${cfg.label}: ${v} (${((v / total) * 100).toFixed(1)}%)`}
                >
                  {pct > 6 ? Math.round(pct) + '%' : ''}
                </div>
              )
            })}
          </div>
        </div>

        {/* Cards detalhe */}
        <div className="grid grid-cols-5 gap-2 flex-1">
          {ORDER.map((k) => {
            const cfg = TEMP_CONFIG[k]
            const v = get(k)
            const pct = total > 0 ? (v / total) * 100 : 0
            return (
              <div
                key={k}
                className={`p-2 rounded-lg border ${cfg.bg} ${cfg.border} text-center transition-all hover:scale-105`}
              >
                <div className="text-xl mb-0.5">{cfg.icon}</div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.textColor}`}>
                  {cfg.label}
                </div>
                <div className={`text-base font-bold mt-0.5 ${cfg.textColor}`}>
                  {Math.round(v * progress)}
                </div>
                <div className="text-[9px] text-gray-500">{pct.toFixed(0)}%</div>
                <div className="text-[8px] text-gray-400 mt-1 italic">{cfg.action}</div>
              </div>
            )
          })}
        </div>
      </div>
    </ChartCard>
  )
}
