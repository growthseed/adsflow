/**
 * <AttributionDonutWidget> — Donut de atribuição cross-platform.
 * Mostra qual plataforma trouxe mais receita atribuída.
 * Responde a pergunta: "Meta ou Google trouxe a venda?"
 */

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export interface AttributionItem {
  [key: string]: unknown
  
  platform: string
  /** Nome amigável (ex: "Meta Ads", "Google Ads", "LinkedIn") */
  label: string
  /** Investimento na plataforma (R$) */
  spend: number
  /** Receita atribuída (R$) */
  revenue: number
  /** ROAS calculado */
  roas: number
  /** Cor da fatia */
  color: string
}

export interface AttributionDonutProps {
  title?: string
  subtitle?: string
  data: AttributionItem[]
  height?: number
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)
}

export default function AttributionDonutWidget({
  title = 'Atribuição por Plataforma',
  subtitle = 'Receita atribuída × Investimento',
  data,
  height = 320,
}: AttributionDonutProps) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalSpend = data.reduce((s, d) => s + d.spend, 0)
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">ROAS Blended</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {blendedRoas.toFixed(1).replace('.', ',')}x
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div style={{ height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="revenue"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={3}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, entry) => {
                  const v = Number(value)
                  const item = (entry as { payload: AttributionItem }).payload
                  return [
                    `${formatCurrency(v)} (ROAS ${item.roas.toFixed(1)}x)`,
                    item.label,
                  ]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((d, i) => {
            const pctRevenue = totalRevenue ? (d.revenue / totalRevenue) * 100 : 0
            const pctSpend = totalSpend ? (d.spend / totalSpend) * 100 : 0
            const efficient = d.roas >= blendedRoas
            return (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="w-3 h-3 rounded-sm shrink-0 mt-1.5"
                  style={{ background: d.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {d.label}
                    </p>
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        efficient ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {d.roas.toFixed(1)}x ROAS
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 text-[11px] text-slate-500 tabular-nums">
                    <span>
                      Receita: <strong className="text-slate-700">{formatCurrency(d.revenue)}</strong>{' '}
                      ({pctRevenue.toFixed(0)}%)
                    </span>
                    <span>
                      Invest: <strong className="text-slate-700">{formatCurrency(d.spend)}</strong>{' '}
                      ({pctSpend.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
