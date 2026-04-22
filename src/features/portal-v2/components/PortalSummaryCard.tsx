import { Sparkles } from 'lucide-react'

interface Props {
  summary: string
}

/**
 * Card "Resumo da semana" — gradient brand, gerado pela AdsFlow AI
 * (ou fallback textual derivado de métricas).
 */
export function PortalSummaryCard({ summary }: Props) {
  return (
    <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-4">
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold mb-2">
        <Sparkles size={10} /> Resumo da semana
      </div>
      <p className="text-[15px] leading-snug text-neutral-800 tracking-[-0.01em]">
        {summary}
      </p>
    </div>
  )
}
