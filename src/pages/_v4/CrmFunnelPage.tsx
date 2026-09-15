/**
 * ============================================
 * CRM Funil de Vendas — G4 Scale / Lovable pattern
 * ============================================
 * Etapas do funil, taxa de conversão, atividade vendedores.
 * Rota: /c/:clientSlug/crm/funil
 */

import { useParams } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { PageHeader } from '@/components/canonical'
import { useResolvedAgencyClient } from '@/hooks/useResolvedAgencyClient'

// Mock — substituir por dados reais do Kommo via MCP
const FUNNEL = [
  { stage: 'Leads', count: 4820, conv: 100 },
  { stage: 'Qualificação', count: 2410, conv: 50 },
  { stage: 'Reunião agendada', count: 1284, conv: 26.6 },
  { stage: 'Reunião realizada', count: 942, conv: 19.5 },
  { stage: 'Proposta', count: 528, conv: 10.9 },
  { stage: 'Negociação', count: 312, conv: 6.5 },
  { stage: 'Fechado/Ganho', count: 184, conv: 3.8 },
]

const REPS = [
  { name: 'Camila Reis', deals: 42, won: 18, revenue: 412300 },
  { name: 'Lucas Andrade', deals: 38, won: 14, revenue: 318400 },
  { name: 'Bruna Tavares', deals: 51, won: 22, revenue: 528900 },
  { name: 'Felipe Marques', deals: 29, won: 9, revenue: 224100 },
  { name: 'Júlia Nogueira', deals: 44, won: 19, revenue: 461200 },
]

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
      <div className={`text-[11px] uppercase tracking-widest font-medium ${primary ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>
        {label}
      </div>
      <div className={`mt-2 text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${primary ? 'text-white' : 'text-[var(--text-primary)]'}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs font-medium ${primary ? 'text-white/90' : positive ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}>
        {delta}
        <span className={`ml-1 ${primary ? 'text-white/60' : 'text-[var(--text-tertiary)]'}`}>vs. período anterior</span>
      </div>
    </div>
  )
}

export default function CrmFunnelPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const client = useResolvedAgencyClient(clientSlug)

  const total = FUNNEL[0].count
  const won = FUNNEL[FUNNEL.length - 1].count
  const meetings = FUNNEL.find(s => s.stage === 'Reunião realizada')?.count ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Comercial · Funil de vendas`}
        subtitle="Acompanhe etapas, taxa de conversão, atendimentos e reuniões."
        breadcrumbs={[
          { label: client?.name || clientSlug || '' },
          { label: 'CRM' },
          { label: 'Funil' },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiSimple label="Leads no período" value={total.toLocaleString('pt-BR')} delta="+12,4%" primary />
        <KpiSimple label="Reuniões realizadas" value={meetings.toLocaleString('pt-BR')} delta="+8,1%" />
        <KpiSimple label="Taxa lead → ganho" value={`${((won / total) * 100).toFixed(1)}%`} delta="+0,6p.p." />
        <KpiSimple label="Negócios fechados" value={won.toLocaleString('pt-BR')} delta="+18,2%" />
      </div>

      {/* Funil + Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funil barras */}
        <div className="lg:col-span-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Funil — etapas</h3>
          <div className="space-y-3">
            {FUNNEL.map((s, i) => {
              const widthPct = (s.count / total) * 100
              const next = FUNNEL[i + 1]
              const dropoff = next ? (((s.count - next.count) / s.count) * 100).toFixed(1) : null
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[var(--text-primary)]">{i + 1}. {s.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-[var(--text-tertiary)]">{s.count.toLocaleString('pt-BR')}</span>
                      <span className="tabular-nums text-[var(--text-secondary)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[11px]">{s.conv.toFixed(1)}%</span>
                      {dropoff && <span className="text-[11px] text-[var(--color-error-600)] tabular-nums">−{dropoff}%</span>}
                    </div>
                  </div>
                  <div className="h-9 rounded-md bg-[var(--color-neutral-100)] overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center px-3 text-xs font-medium text-white"
                      style={{ width: `${widthPct}%`, background: 'var(--gradient-primary)', opacity: 1 - i * 0.06 }}
                    >
                      {widthPct > 12 && s.count.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vendedores */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Atividades dos vendedores</h3>
          <div className="space-y-4">
            {REPS.map(r => (
              <div key={r.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-[var(--text-primary)]">{r.name}</span>
                  <span className="text-[var(--text-tertiary)] tabular-nums text-xs">{r.won}/{r.deals}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(r.won / r.deals) * 100}%`, background: 'var(--gradient-primary)' }} />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--text-tertiary)]">
                  <span>Win rate {((r.won / r.deals) * 100).toFixed(0)}%</span>
                  <span className="tabular-nums">R$ {(r.revenue / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart conversão por etapa */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-5" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Conversão por etapa</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={FUNNEL} layout="vertical" margin={{ left: 30, right: 16 }}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="stage" type="category" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} width={140} />
              <Tooltip contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} />
              <Bar dataKey="count" fill="var(--color-brand-600)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
