/**
 * MoaiCxModule — Customer Success (CX & NPS).
 * Dados reais:
 *   - 92 respostas NPS Conselhos 2026 (nota CS média 9.45/10)
 *   - 248 respostas NPS Alavanca (satisfação geral 4.81/5)
 *   - 32 conselhos com Health Score · 6 em risco
 *   - 513 reposições 2025 · 11 pendentes
 */

import { Routes, Route } from 'react-router-dom'
import { MoaiModuleShell, StubBadge } from './MoaiModuleShell'
import {
  useMoaiCXResumo,
  useMoaiCX360,
  useMoaiHealthConselhos,
  useMoaiReposicoes,
  type HealthConselho,
} from '@/hooks/useMoaiCX'
import { NPSGaugeWidget, TemperatureScaleWidget, HealthRadarWidget } from '@/components/canonical/widgets'

export default function MoaiCxModule() {
  return (
    <MoaiModuleShell
      title="CX & NPS"
      description="Customer Success — 92 NPS Conselhos · 248 NPS Alavanca · 32 conselhos · 513 reposições"
      rightActions={<StubBadge status="ready" />}
      tabs={[
        { to: '', label: 'Visão geral', end: true },
        { to: 'health', label: 'Health Score' },
        { to: 'reposicoes', label: 'Reposições' },
        { to: 'nps-conselhos', label: 'NPS Conselhos' },
        { to: 'nps-alavanca', label: 'NPS Alavanca' },
      ]}
    >
      <Routes>
        <Route index element={<CXOverview />} />
        <Route path="health" element={<HealthList />} />
        <Route path="reposicoes" element={<ReposicoesList />} />
        <Route path="nps-conselhos" element={<PlaceholderTab title="NPS Conselhos 2026" hint="92 respostas com 3 notas 0-10. Detalhe drill em breve." />} />
        <Route path="nps-alavanca" element={<PlaceholderTab title="NPS Alavanca" hint="248 respostas (Aulas + Board Meeting) com 5 ratings 1-5. Detalhe drill em breve." />} />
      </Routes>
    </MoaiModuleShell>
  )
}

function CXOverview() {
  const { data: resumo, loading } = useMoaiCXResumo()
  const { data: cx360 } = useMoaiCX360()
  const { data: health } = useMoaiHealthConselhos()

  if (loading || !resumo) return <Skeleton />

  const emRisco = health.filter((h) => isEmRisco(h))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="NPS CS Conselhos" value={`${resumo.nps_conselhos_2026_avg_cs}/10`} tone="success" sub={`${resumo.nps_conselhos_2026_count} respostas`} />
        <Kpi label="Satisfação Alavanca" value={`${resumo.nps_alavanca_avg_geral}/5`} tone="success" sub={`${resumo.nps_alavanca_count} respostas`} />
        <Kpi label="Conselhos em Risco" value={resumo.health_em_risco} tone="critical" sub={`de ${resumo.health_conselhos_total} mapeados`} />
        <Kpi label="Reposições Pendentes" value={resumo.reposicoes_pendentes} tone="warning" sub={`de ${resumo.reposicoes_total} total 2025`} />
      </div>

      {cx360 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NPSGaugeWidget
            title="NPS Score Conselhos"
            subtitle={`Calculado sobre nota CS (0-10) · ${cx360.nps.total_respostas} respostas`}
            npsScore={Number(cx360.nps.score)}
            promotores={Number(cx360.nps.promotores_pct)}
            passivos={Number(cx360.nps.passivos_pct)}
            detratores={Number(cx360.nps.detratores_pct)}
            totalRespostas={Number(cx360.nps.total_respostas)}
          />
          <TemperatureScaleWidget
            title="Temperatura dos Conselhos"
            subtitle={`Health × Risco churn — ${cx360.temperatura.total} conselhos mapeados`}
            buckets={cx360.temperatura.buckets}
            total={Number(cx360.temperatura.total)}
          />
        </div>
      )}

      {cx360 && (
        <HealthRadarWidget
          title="Saúde Multi-dimensional dos Conselhos"
          subtitle="Média das 8 dimensões mapeadas no Health Score MOAI"
          dimensions={cx360.radar.map((d) => ({ label: d.label, value: Number(d.value), rawValue: `${Math.round(Number(d.value))}%` }))}
        />
      )}

      {emRisco.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Conselhos prioritários ({emRisco.length})
          </h3>
          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-red-50 border-b border-red-100">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-red-700">Conselho</th>
                  <th className="text-left px-3 py-2 font-semibold text-red-700">Conselheiro</th>
                  <th className="text-left px-3 py-2 font-semibold text-red-700">Risco Churn</th>
                  <th className="text-left px-3 py-2 font-semibold text-red-700">Health</th>
                  <th className="text-left px-3 py-2 font-semibold text-red-700">Ação Prioritária</th>
                </tr>
              </thead>
              <tbody>
                {emRisco.map((h) => (
                  <tr key={h.conselho_id} className="border-b border-gray-100 hover:bg-red-50/30">
                    <td className="px-3 py-2 text-[#1A1F36] font-medium">{h.conselho_nome}</td>
                    <td className="px-3 py-2 text-gray-600">{h.perfil_conselheiro ?? '—'}</td>
                    <td className="px-3 py-2"><Badge status={h.risco_churn} kind="risk" /></td>
                    <td className="px-3 py-2"><Badge status={h.health_geral} kind="health" /></td>
                    <td className="px-3 py-2 text-gray-600 text-[11px]">{h.acao_prioritaria ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function HealthList() {
  const { data, loading } = useMoaiHealthConselhos()
  if (loading) return <Skeleton />
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Conselho</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Conselheiro</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Health</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Risco</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Base ativa</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Presença</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Fantasmas</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Setor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((h) => (
            <tr key={h.conselho_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 text-[#1A1F36] font-medium">{h.conselho_nome}</td>
              <td className="px-3 py-2 text-gray-600">{h.perfil_conselheiro ?? '—'}</td>
              <td className="px-3 py-2"><Badge status={h.health_geral} kind="health" /></td>
              <td className="px-3 py-2"><Badge status={h.risco_churn} kind="risk" /></td>
              <td className="px-3 py-2 text-gray-700 font-mono">{h.base_ativa ?? '—'}</td>
              <td className="px-3 py-2 text-gray-700 font-mono">{h.presenca_ultimo_mes ?? '—'}</td>
              <td className="px-3 py-2 text-gray-700 font-mono">{h.fantasmas ?? '—'}</td>
              <td className="px-3 py-2 text-gray-600">{h.setor_predominante ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReposicoesList() {
  const { data, loading } = useMoaiReposicoes()
  if (loading) return <Skeleton />
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">{data.length} reposições 2025</div>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Membro</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Produto</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Conselho</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Segmento</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Data</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 100).map((r) => (
              <tr key={r.reposicao_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-[#1A1F36] font-medium">{r.reposicao_nome}</td>
                <td className="px-3 py-2 text-gray-600">{r.produto ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{r.conselho ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{r.segmento ?? '—'}</td>
                <td className="px-3 py-2 text-gray-500 font-mono">{r.data ?? '—'}</td>
                <td className="px-3 py-2">{r.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 100 && (
          <div className="px-3 py-2 text-xs text-gray-500 border-t bg-gray-50">
            Mostrando 100 de {data.length}. Refine os filtros pra ver mais.
          </div>
        )}
      </div>
    </div>
  )
}

function isEmRisco(h: HealthConselho): boolean {
  const r = (h.risco_churn ?? '').toLowerCase()
  const hg = (h.health_geral ?? '').toLowerCase()
  return r.includes('alto') || hg.includes('crit') || hg.includes('baixo')
}

function Badge({ status, kind }: { status: string | null; kind: 'health' | 'risk' }) {
  if (!status) return <span className="text-gray-400">—</span>
  const s = status.toLowerCase()
  let cls = 'bg-gray-100 text-gray-700'
  if (kind === 'risk') {
    if (s.includes('alto')) cls = 'bg-red-50 text-red-700'
    else if (s.includes('med') || s.includes('m')) cls = 'bg-amber-50 text-amber-700'
    else if (s.includes('baixo')) cls = 'bg-emerald-50 text-emerald-700'
  } else {
    if (s.includes('crit') || s.includes('cr')) cls = 'bg-red-50 text-red-700'
    else if (s.includes('baixo')) cls = 'bg-orange-50 text-orange-700'
    else if (s.includes('med') || s.includes('m')) cls = 'bg-amber-50 text-amber-700'
    else if (s.includes('alto') || s.includes('bom')) cls = 'bg-emerald-50 text-emerald-700'
  }
  return <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-medium ${cls}`}>{status}</span>
}

function Kpi({ label, value, tone, sub }: { label: string; value: number | string; tone?: 'success' | 'warning' | 'critical'; sub?: string }) {
  const toneClass = tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : tone === 'critical' ? 'text-red-600' : 'text-[#1A1F36]'
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${toneClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function Skeleton() {
  return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
}

function PlaceholderTab({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
      <h3 className="text-base font-semibold text-[#1A1F36] mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  )
}
