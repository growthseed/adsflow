import { Construction } from 'lucide-react'

interface ComingSoonProps {
  title: string
  eyebrow?: string
  description?: string
}

export function ComingSoon({ title, eyebrow, description }: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-brand-50 grid place-items-center text-brand-600">
          <Construction size={26} strokeWidth={1.8} />
        </div>
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">{title}</h1>
        {description && (
          <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}
