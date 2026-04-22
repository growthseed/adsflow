import type { PortalGoalRing as Goal } from '../types'

interface Props {
  goal: Goal
}

const toneStroke: Record<Goal['tone'], string> = {
  success: 'var(--color-success-500)',
  warning: 'var(--color-warning-500)',
  error:   'var(--color-error-500)',
}
const toneText: Record<Goal['tone'], string> = {
  success: 'text-success-700',
  warning: 'text-warning-600',
  error:   'text-error-600',
}

/**
 * Anel radial compacto (52px) — usado em lista de metas do Portal.
 */
export function PortalGoalRingCard({ goal }: Props) {
  const pct = goal.target > 0 ? Math.max(0, Math.min(100, (goal.current / goal.target) * 100)) : 0
  const C = 2 * Math.PI * 15
  const offset = C * (1 - pct / 100)
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative w-[52px] h-[52px] shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-neutral-100)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={toneStroke[goal.tone]}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div
          className={`absolute inset-0 grid place-items-center text-[13px] font-bold tabular ${toneText[goal.tone]}`}
        >
          {Math.round(pct)}%
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-neutral-900 truncate">{goal.label}</div>
        <div className="text-[11px] text-neutral-500 truncate tabular">{goal.subtitle}</div>
      </div>
    </div>
  )
}
