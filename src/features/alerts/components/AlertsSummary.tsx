import { Card } from '@/components/primitives'

interface Props {
  azul: number
  risco: number
  criticas: number
  rulesActive: number
  totalClients: number
}

export function AlertsSummary({ azul, risco, criticas, rulesActive, totalClients }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <Cell tone="success" label="Metas no azul" value={azul} sub={`de ${totalClients} · carteira`} />
      <Cell tone="warning" label="Em risco" value={risco} sub="pacing abaixo do ideal" />
      <Cell tone="error" label="Críticas" value={criticas} sub="precisam ação hoje" />
      <Cell tone="brand" label="Regras ativas" value={rulesActive} sub="multi-canal" />
    </div>
  )
}

const toneMap = {
  success: 'border-l-success-500 text-success-600',
  warning: 'border-l-warning-500 text-warning-600',
  error: 'border-l-error-500 text-error-600',
  brand: 'border-l-brand-600 text-brand-700',
} as const

function Cell({
  tone,
  label,
  value,
  sub,
}: {
  tone: keyof typeof toneMap
  label: string
  value: number
  sub: string
}) {
  return (
    <Card className={`p-4 border-l-[4px] ${toneMap[tone].split(' ')[0]}`}>
      <div className="eyebrow text-neutral-500">{label}</div>
      <div className={`text-[28px] font-bold tabular mt-1 ${toneMap[tone].split(' ')[1]}`}>
        {value}
      </div>
      <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>
    </Card>
  )
}
