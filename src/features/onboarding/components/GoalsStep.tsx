import { Plus, Sparkles, Trash2 } from 'lucide-react'

import { Card } from '@/components/primitives'
import type { OnboardingGoal } from '../types'

interface Props {
  goals: OnboardingGoal[]
  clientName: string
  onAdd: () => void
  onPatch: (id: string, patch: Partial<OnboardingGoal>) => void
  onRemove: (id: string) => void
  onSuggestWithAI?: () => void
  onUseTemplate?: () => void
}

const metricOptions: Array<{ value: OnboardingGoal['metric']; label: string }> = [
  { value: 'leads', label: 'Leads (total trimestre)' },
  { value: 'cpl',   label: 'CPL (teto)' },
  { value: 'roas',  label: 'ROAS mínimo' },
  { value: 'sales', label: 'Vendas atribuídas' },
  { value: 'ctr',   label: 'CTR mínimo' },
  { value: 'spend', label: 'Investido (teto)' },
]

export function GoalsStep({ goals, clientName, onAdd, onPatch, onRemove, onSuggestWithAI, onUseTemplate }: Props) {
  return (
    <Card className="p-5">
      <h2 className="text-[18px] font-bold text-neutral-900">
        Defina as metas do {clientName || 'cliente'}
      </h2>
      <p className="text-[13px] text-neutral-500 mt-1 mb-4">
        As metas alimentam o pacing, os alertas automáticos e o portal. Comece com 1 ou 2 —
        dá pra refinar depois com base no histórico.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {onSuggestWithAI && (
          <button
            onClick={onSuggestWithAI}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-300 bg-brand-50 text-brand-700 text-[12px] font-semibold"
          >
            <Sparkles size={12} /> Sugerir com IA
          </button>
        )}
        {onUseTemplate && (
          <button
            onClick={onUseTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-700 text-[12px] font-semibold hover:bg-neutral-50"
          >
            Usar template (educação)
          </button>
        )}
      </div>

      <div className="eyebrow text-neutral-600 mb-2">Metas do trimestre</div>
      <div className="space-y-2">
        {goals.length === 0 && (
          <p className="text-[12px] text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-4">
            Nenhuma meta adicionada ainda. Clique em “Adicionar outra meta” para começar.
          </p>
        )}
        {goals.map((g) => (
          <div key={g.id} className="grid grid-cols-[1fr_160px_160px_40px] gap-2 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] eyebrow text-neutral-600">Métrica</span>
              <select
                value={g.metric}
                onChange={(e) =>
                  onPatch(g.id, { metric: e.target.value as OnboardingGoal['metric'] })
                }
                className="h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white"
              >
                {metricOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] eyebrow text-neutral-600">Valor alvo</span>
              <input
                type="number"
                value={g.targetValue}
                onChange={(e) => onPatch(g.id, { targetValue: Number(e.target.value) })}
                className="h-10 px-3 border border-neutral-200 rounded-lg text-[13px] tabular"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] eyebrow text-neutral-600">Distribuição</span>
              <select
                value={g.distribution}
                onChange={(e) =>
                  onPatch(g.id, {
                    distribution: e.target.value as OnboardingGoal['distribution'],
                  })
                }
                className="h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white"
              >
                <option value="linear">Linear</option>
                <option value="seasonal">Sazonal</option>
                <option value="monthly_avg">Média mensal</option>
              </select>
            </label>
            <button
              onClick={() => onRemove(g.id)}
              aria-label="remover meta"
              className="h-10 grid place-items-center rounded-md text-neutral-500 hover:bg-error-50 hover:text-error-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-900"
      >
        <Plus size={14} /> Adicionar outra meta
      </button>
    </Card>
  )
}
