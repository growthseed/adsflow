interface HealthScoreProps {
  score: number
  tone: 'success' | 'warning' | 'error'
}

const toneClasses: Record<HealthScoreProps['tone'], string> = {
  success: 'bg-success-100 text-success-700 border-success-100',
  warning: 'bg-warning-100 text-warning-700 border-warning-100',
  error:   'bg-error-100 text-error-700 border-error-100',
}

/**
 * Pill de saúde — score 0-100 com ponto colorido. Nunca usa apenas
 * cor (a11y handoff V2): sempre acompanhado do número.
 */
export function HealthScore({ score, tone }: HealthScoreProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold tabular ${toneClasses[tone]}`}
    >
      <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}
    </span>
  )
}
