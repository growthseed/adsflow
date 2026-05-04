/**
 * Portal V2 — painel "Dados"
 *
 * Substitui o placeholder "em breve". Mostra ao cliente, sem
 * jargão de tráfego pago:
 *   1. Período + investimento total
 *   2. Distribuição por canal (Google / Meta)
 *   3. Campanhas ativas com performance
 *   4. Histórico mensal pra comparativo
 *   5. Notas operacionais (ex: "campanha retomada em 29/04")
 */

import { Info } from 'lucide-react'
import { formatMetric } from '@/lib/formatMetric'
import type {
  PortalCampaignRow,
  PortalChannelRow,
  PortalMonthlyRow,
} from '../types'

interface Props {
  periodLabel: string | null
  spend: number | null
  channels: PortalChannelRow[]
  campaigns: PortalCampaignRow[]
  monthly: PortalMonthlyRow[]
  notes: string[]
}

export function PortalDadosView({
  periodLabel,
  spend,
  channels,
  campaigns,
  monthly,
  notes,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Cabeçalho do período */}
      <div className="bg-white border border-neutral-100 rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 mb-1">
          Período
        </div>
        <div className="text-[15px] font-semibold text-neutral-900">
          {periodLabel ?? 'Sem período definido'}
        </div>
        {spend != null && (
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xs text-neutral-500">Investimento total</span>
            <span className="text-[20px] font-bold tabular text-neutral-900">
              {formatMetric(spend, 'currency')}
            </span>
          </div>
        )}
      </div>

      {/* Distribuição por canal */}
      {channels.length > 0 && (
        <Section title="Investimento por canal">
          <div className="space-y-3">
            {channels.map((c) => {
              const total = channels.reduce((acc, x) => acc + x.spend, 0)
              const pct = total > 0 ? (c.spend / total) * 100 : 0
              return (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700">{c.label}</span>
                    <span className="tabular text-neutral-900 font-semibold">
                      {formatMetric(c.spend, 'currency')}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: c.color }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-500">
                    {pct.toFixed(0)}% · {c.conversions} conversões
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Campanhas */}
      {campaigns.length > 0 && (
        <Section title={`Campanhas (${campaigns.length})`}>
          <div className="divide-y divide-neutral-100">
            {campaigns.map((c, idx) => (
              <CampaignRow key={`${c.name}-${idx}`} c={c} />
            ))}
          </div>
        </Section>
      )}

      {/* Histórico mensal */}
      {monthly.length > 0 && (
        <Section title="Histórico mensal">
          <div className="space-y-1.5">
            {monthly.map((m) => (
              <MonthlyRow key={m.month} m={m} />
            ))}
          </div>
        </Section>
      )}

      {/* Notas operacionais */}
      {notes.length > 0 && (
        <Section title="Observações">
          <ul className="space-y-2">
            {notes.map((n, i) => (
              <li key={i} className="flex gap-2 text-xs text-neutral-700 leading-snug">
                <Info size={12} className="mt-0.5 shrink-0 text-amber-500" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {channels.length === 0 && campaigns.length === 0 && monthly.length === 0 && (
        <div className="bg-white border border-neutral-100 rounded-xl p-6 text-center">
          <div className="text-sm font-semibold text-neutral-900 mb-1">
            Sem dados de tráfego no período
          </div>
          <p className="text-xs text-neutral-500">
            As campanhas serão atualizadas assim que entrarem em veiculação.
          </p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 mb-3">
        {title}
      </div>
      {children}
    </div>
  )
}

function CampaignRow({ c }: { c: PortalCampaignRow }) {
  const isActive = c.status === 'enabled' || c.status === 'ENABLED'
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-neutral-900 truncate">
            {c.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-500">
            <span>{c.channel}</span>
            <span>·</span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {isActive ? 'Ativa' : 'Pausada'}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[13px] font-bold tabular text-neutral-900">
            {formatMetric(c.spend, 'currency')}
          </div>
          <div className="text-[10px] text-neutral-500 tabular">
            {c.conversions} conv · {c.cpl != null ? formatMetric(c.cpl, 'currency') : '—'} CPL
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthlyRow({ m }: { m: PortalMonthlyRow }) {
  // Barra horizontal proporcional ao spend máximo do array — calculado no caller
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-20 shrink-0 text-[11px] font-medium text-neutral-700">
        {m.label}
        {m.partial && (
          <span className="ml-1 text-[9px] text-neutral-400">(parc.)</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-[11px] tabular">
          <span className="text-neutral-500">
            {m.conversions} conv
          </span>
          <span className="font-semibold text-neutral-900">
            {formatMetric(m.spend, 'currency')}
          </span>
        </div>
      </div>
    </div>
  )
}
