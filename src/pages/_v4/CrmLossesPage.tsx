/**
 * ============================================
 * CRM Perdas — G4 Scale / Lovable pattern
 * ============================================
 * Motivos de perda, valor não convertido, evolução semanal.
 * Rota: /c/:clientSlug/crm/perdas
 */

import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Cell, Legend,
} from 'recharts'
import { PageHeader } from '@/components/canonical'
import { getClientBySlug } from '@/services/adapters/clickupAdapter'

const LOSS_REASONS = [
  { reason: 'Preço acima do orçamento', count: 142, pct: 28.4, value: 1240000 },
  { reason: 'Sem fit de produto', count: 98, pct: 19.6, value: 820000 },
  { reason: 'Escolheu concorrente', count: 84, pct: 16.8, value: 1180000 },
  { reason: 'Sem retorno do lead', count: 72, pct: 14.4, value: 540000 },
  { reason: 'Timing — não é o momento', count: 58, pct: 11.6, value: 720000 },
  { reason: 'Falta de decisão interna', count: 46, pct: 9.2, value: 480000 },
]

const LOSS_TIMESERIES = [
  { week: 'S1', price: 28, fit: 21, comp: 18, noresp: 14 },
  { week: 'S2', price: 32, fit: 19, comp: 22, noresp: 12 },
  { week: 'S3', price: 26, fit: 24, comp: 17, noresp: 16 },
  { week: 'S4', price: 35, fit: 22, comp: 21, noresp: 13 },
  { week: 'S5', price: 30, fit: 18, comp: 25, noresp: 17 },
  { week: 'S6', price: 38, fit: 20, comp: 19, noresp: 15 },
]

const PALETTE = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)', 'var(--color-neutral-400)']

function KpiSimple({ label, value, delta, primary }: {
  label: string; value: string; delta: string; primary?: boolean
}) {
  const positive = delta.startsWith('+')
  return (
    <div
      className={`rounded-xl p-5 ${primary ? 'text-white' : 'bg-[var(--surface-card)] border border-[var(--border-subtle)]'}`}
      style={primary
        ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-elegant)' }
        : { boxShadow: 'var(--shadow-soft)' }
      }
    >
      <div className={`text-[11px] uppercase tracking-widest font-medium ${primary ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>{label}</div>
      <div className={`mt-2 text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${primary ? 'text-white' : 'text-[var(--text-primary)]'}`}>{value}</div>
      <div className={`mt-2 text-xs font-medium ${primary ? 'text-white/90' : positive ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}>
        {delta} <span className={`ml-1 ${primary ? 'text-white/60' : 'text-[var(--text-tertiary)]'}`}>vs. período anterior</span>
      </div>
    </div>
  )
}

export default function CrmLossesPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const client = useMemo(() => clientSlug ? getClientBySlug(clientSlug) : undefined, [clientSlug])

  const totalLost = LOSS_REASONS.reduce((s, r) => s + r.count, 0)
  const lostValue = LOSS_REASONS.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comercial · Perdas"
        subtitle="Entenda os principais motivos de perda e o valor que está deixando de ser convertido."
        breadcrumbs={[{ label: client?.name || '' }, { label: 'CRM' }, { label: 'Perdas' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiSimple label="Negócios perdidos" value={totalLost.toLocaleString('pt-BR')} delta="-4,2%" primary />
        <KpiSimple label="Valor não convertido" value={`R$ ${(lostValue / 1_000_000).toFixed(2)}M`} delta="+1,8%" />
        <KpiSimple label="Ticket médio perdido" value={`R$ ${(lostValue / totalLost / 1000).toFixed(1)}k`} delta="-2,4%" />
        <KpiSimple label="Loss rate" value="61,6%" delta="-2,1p.p." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking */}
        <div className="lg:col-span-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Ranking de motivos de perda</h3>
          <div className="space-y-4">
            {LOSS_REASONS.map((r, i) => (
              <div key={r.reason}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded text-[10px] font-bold flex items-center justify-center text-white" style={{ background: PALETTE[i] }}>{i + 1}</span>
                    <span className="font-medium text-[var(--text-primary)]">{r.reason}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[var(--text-tertiary)] tabular-nums">{r.count} casos</span>
                    <span className="tabular-nums border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[11px]">{r.pct.toFixed(1)}%</span>
                    <span className="tabular-nums font-semibold text-[var(--color-error-600)]">−R$ {(r.value / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.pct * 2.8}%`, background: PALETTE[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution bar */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Distribuição</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LOSS_REASONS} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="reason" type="category" hide />
                <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {LOSS_REASONS.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Evolução semanal */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Evolução dos motivos por semana</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={LOSS_TIMESERIES} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar stackId="a" dataKey="price" fill="var(--chart-1)" name="Preço" />
              <Bar stackId="a" dataKey="fit" fill="var(--chart-3)" name="Sem fit" />
              <Bar stackId="a" dataKey="comp" fill="var(--chart-2)" name="Concorrente" />
              <Bar stackId="a" dataKey="noresp" fill="var(--chart-4)" name="Sem retorno" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
