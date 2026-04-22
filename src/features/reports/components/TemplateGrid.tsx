import { Pill } from '@/components/primitives'
import type { ReportTemplate } from '../types'

interface Props {
  templates: ReportTemplate[]
  onUse: (t: ReportTemplate) => void
}

const thumbGradient: Record<string, string> = {
  g1: 'from-brand-600 to-brand-800',
  g2: 'from-success-500 to-success-700',
  g3: 'from-warning-500 to-warning-700',
  g4: 'from-info-600 to-info-700',
  g5: 'from-error-500 to-error-700',
}

export function TemplateGrid({ templates, onUse }: Props) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-6 text-center">
        Nenhum template disponível.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {templates.map((t) => {
        const grad = thumbGradient[t.thumbStyle ?? 'g1'] ?? thumbGradient.g1
        return (
          <button
            key={t.id}
            onClick={() => onUse(t)}
            className="group text-left bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition"
          >
            <div className={`bg-gradient-to-br ${grad} text-white px-3 pt-3 pb-4 h-28 relative`}>
              {t.category && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.06em] bg-white/20 rounded px-2 py-0.5">
                  {t.category}
                </span>
              )}
              <h4 className="text-[14px] font-bold mt-2 truncate">{t.name}</h4>
              <div className="absolute bottom-2 left-3 right-3 flex items-end gap-0.5 h-8">
                {[30, 50, 40, 70, 80, 60, 90].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 bg-white/60 rounded-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="p-3">
              <div className="text-[13px] font-semibold text-neutral-900 truncate">{t.name}</div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-neutral-500">
                <span className="truncate">{t.subtitle ?? `${t.blocks.length} blocos`}</span>
                <Pill tone={t.source === 'official' ? 'brand' : 'neutral'}>
                  {t.source === 'official' ? 'oficial' : 'meu'}
                </Pill>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
