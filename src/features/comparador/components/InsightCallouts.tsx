import { ArrowRight, Lightbulb, ShieldAlert, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/primitives'
import type { ComparadorInsight } from '../hooks/useComparadorData'

interface Props {
  insights: ComparadorInsight[]
}

const toneMap = {
  error:   { border: 'border-l-error-500',   icon: ShieldAlert, badge: 'bg-error-100 text-error-700' },
  success: { border: 'border-l-success-500', icon: Trophy,      badge: 'bg-success-100 text-success-700' },
  brand:   { border: 'border-l-brand-600',   icon: Lightbulb,   badge: 'bg-brand-50 text-brand-700' },
} as const

export function InsightCallouts({ insights }: Props) {
  if (insights.length === 0) return null
  return (
    <div className="grid grid-cols-12 gap-4 mt-5">
      {insights.slice(0, 3).map((ins, i) => {
        const cfg = toneMap[ins.tone]
        const Icon = cfg.icon
        return (
          <Card key={i} className={`col-span-12 lg:col-span-4 border-l-[3px] ${cfg.border} p-4`}>
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${cfg.badge}`}
            >
              <Icon size={11} strokeWidth={2} />
              {ins.badge}
            </div>
            <div className="text-sm font-semibold text-neutral-900">{ins.title}</div>
            <p className="text-xs text-neutral-600 mt-1.5 leading-snug">{ins.body}</p>
            {ins.ctaLabel && ins.ctaTo && (
              <Link
                to={ins.ctaTo}
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-700 hover:text-brand-900"
              >
                {ins.ctaLabel} <ArrowRight size={12} />
              </Link>
            )}
          </Card>
        )
      })}
    </div>
  )
}
