import { Check } from 'lucide-react'

import { ONBOARDING_STEPS, type OnboardingStepKey } from '../types'

interface Props {
  current: OnboardingStepKey
  completed: OnboardingStepKey[]
}

export function StepIndicator({ current, completed }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ONBOARDING_STEPS.map((s, idx) => {
        const isDone = completed.includes(s.key)
        const isCurrent = s.key === current
        const stepTone = isDone
          ? 'bg-success-500 text-white'
          : isCurrent
          ? 'bg-brand-600 text-white'
          : 'bg-neutral-200 text-neutral-500'
        const label = isDone ? 'text-neutral-700 font-semibold' : isCurrent ? 'text-brand-700 font-semibold' : 'text-neutral-500'
        return (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${stepTone}`}>
              {isDone ? <Check size={12} strokeWidth={3} /> : idx + 1}
            </span>
            <span className={`text-[12px] ${label}`}>{s.label}</span>
            {idx < ONBOARDING_STEPS.length - 1 && (
              <span aria-hidden className="w-8 h-px bg-neutral-200" />
            )}
          </div>
        )
      })}
    </div>
  )
}
