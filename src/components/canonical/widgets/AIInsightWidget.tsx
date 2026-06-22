/**
 * <AIInsightWidget> — Card de insight da IA.
 * Mostra título + descrição + badge de tipo (positive/warning/critical/info)
 * + selo de prioridade. Pensado pra ser empilhado verticalmente no
 * topo do dashboard ("o que olhar primeiro hoje").
 */

import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react'

export type AIInsightType = 'positive' | 'warning' | 'critical' | 'info'
export type AIInsightPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface AIInsight {
  type: AIInsightType
  priority?: AIInsightPriority
  title: string
  description: string
  /** Ação sugerida — texto curto, vira botão se passar onActionClick */
  actionLabel?: string
  onActionClick?: () => void
}

const TYPE_CONFIG: Record<
  AIInsightType,
  { Icon: typeof Sparkles; iconClass: string; bgClass: string; ringClass: string; titleClass: string }
> = {
  positive: {
    Icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    ringClass: 'ring-emerald-200',
    titleClass: 'text-emerald-900',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    ringClass: 'ring-amber-200',
    titleClass: 'text-amber-900',
  },
  critical: {
    Icon: AlertCircle,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-50',
    ringClass: 'ring-red-200',
    titleClass: 'text-red-900',
  },
  info: {
    Icon: Info,
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    ringClass: 'ring-blue-200',
    titleClass: 'text-blue-900',
  },
}

const PRIORITY_BADGE: Record<AIInsightPriority, { label: string; class: string }> = {
  urgent: { label: 'URGENTE', class: 'bg-red-100 text-red-700' },
  high: { label: 'ALTA', class: 'bg-orange-100 text-orange-700' },
  normal: { label: 'NORMAL', class: 'bg-slate-100 text-slate-600' },
  low: { label: 'BAIXA', class: 'bg-slate-50 text-slate-500' },
}

export interface AIInsightWidgetProps {
  /** Lista de insights pra renderizar. Renderiza em ordem (ordene antes de passar). */
  insights: AIInsight[]
  /** Título da seção (default: "Insights da IA") */
  title?: string
  /** Limite de insights a mostrar (default: 3) */
  maxItems?: number
}

export default function AIInsightWidget({
  insights,
  title = 'Insights da IA',
  maxItems = 3,
}: AIInsightWidgetProps) {
  const items = insights.slice(0, maxItems)
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {items.map((ins, i) => {
        const cfg = TYPE_CONFIG[ins.type]
        const pcfg = ins.priority ? PRIORITY_BADGE[ins.priority] : null
        return (
          <div
            key={i}
            className={`rounded-xl ${cfg.bgClass} ring-1 ${cfg.ringClass} p-4 flex gap-3 items-start`}
          >
            <cfg.Icon className={`w-5 h-5 ${cfg.iconClass} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className={`text-sm font-semibold ${cfg.titleClass}`}>{ins.title}</h3>
                {pcfg && (
                  <span
                    className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${pcfg.class}`}
                  >
                    {pcfg.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-700 leading-relaxed">{ins.description}</p>
              {ins.actionLabel && ins.onActionClick && (
                <button
                  onClick={ins.onActionClick}
                  className="mt-3 text-xs font-medium text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
                >
                  {ins.actionLabel} →
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
