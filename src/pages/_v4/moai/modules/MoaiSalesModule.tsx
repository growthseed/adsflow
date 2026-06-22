/**
 * MoaiSalesModule — cockpit comercial MOAI inspirado no BI CRM + Ads.
 * Fonte concreta: Clint snapshot 2026-06-06 tratado em 05_dados.
 */

import { Routes, Route } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, Filter, LineChart, Radio, RefreshCw, Target, Users } from 'lucide-react'
import { MoaiModuleShell, StubBadge } from './MoaiModuleShell'
import ClintCohortAnalysis from './ClintCohortAnalysis'
import { useMoaiSalesByPeriod } from '@/hooks/useMoaiSales'
import { useMoaiPeriod } from '@/contexts/MoaiPeriodContext'

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
const fmtNum = (v: number) => v.toLocaleString('pt-BR')
const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

const biTemplates = [
  {
    name: 'Tipo A · CRM + Meta Ads',
    scope: 'Funil Clint/Kommo, Meta Ads, criativos, comparativo e perdas.',
    useNow: 'Base ideal para MOAI Connect quando o foco for gerar demanda e medir conversao do funil.',
    status: 'Parcial: Clint tratado; falta Meta Ads diario.',
  },
  {
    name: 'Tipo B · CRM + Meta Ads + Google Ads',
    scope: 'Tudo do Tipo A + Google Ads e visao cross-channel de investimento, leads, CPL, CPC e CTR.',
    useNow: 'Modelo certo para diretoria acompanhar paid media completo sem separar plataformas.',
    status: 'Proximo: ativar Google Ads diario junto da ingestao Meta.',
  },
]

const kpis = {
  totalDeals: 4643,
  won: 103,
  lost: 238,
  open: 4302,
  empocados: 2481,
  receita: 170027,
  ticket: 1650.75,
  winRate: 30.2,
}

const channels = [
  { label: 'Reativacao', total: 1713, won: 0, lost: 2, open: 1711, conv: 0, receita: 0, insight: 'Base grande para limpeza e cadencia de reativacao.' },
  { label: 'Evento / Comunidade', total: 1324, won: 0, lost: 0, open: 1324, conv: 0, receita: 0, insight: 'Boa massa para social selling pos-evento e lookalike.' },
  { label: 'Outros / Alavanca', total: 744, won: 12, lost: 4, open: 728, conv: 75, receita: 0, insight: 'Sinal de BOFU, mas receita não voltou estruturada.' },
  { label: 'Seller', total: 327, won: 91, lost: 232, open: 4, conv: 28.2, receita: 170027, insight: 'Canal que prova receita e precisa virar benchmark.' },
  { label: 'Parceria', total: 322, won: 0, lost: 0, open: 322, conv: 0, receita: 0, insight: 'Tem volume, falta qualificacao e origem reportavel.' },
  { label: 'Paid', total: 213, won: 0, lost: 0, open: 213, conv: 0, receita: 0, insight: 'Precisa ingestao diaria Meta Ads por campanha/adset/ad.' },
]

const origins = [
  { name: '[4] Reativacao', total: 1489, won: 0, lost: 2, open: 1487, conv: 0, receita: 0 },
  { name: 'Jornada Comunidade', total: 608, won: 0, lost: 0, open: 608, conv: 0, receita: 0 },
  { name: 'Jornada Conselhos', total: 469, won: 0, lost: 0, open: 469, conv: 0, receita: 0 },
  { name: 'Comercial', total: 327, won: 91, lost: 232, open: 4, conv: 28.2, receita: 170027 },
  { name: 'Parcerias', total: 322, won: 0, lost: 0, open: 322, conv: 0, receita: 0 },
  { name: 'Master Class Alavanca - Recuperacao', total: 224, won: 0, lost: 0, open: 224, conv: 0, receita: 0 },
  { name: '[5] Patrocinio', total: 213, won: 0, lost: 0, open: 213, conv: 0, receita: 0 },
  { name: 'Funil Alavanca', total: 204, won: 12, lost: 4, open: 188, conv: 75, receita: 0 },
  { name: '[1] Alavanca', total: 189, won: 0, lost: 0, open: 189, conv: 0, receita: 0 },
  { name: '[0] Triagem e qualificacao', total: 183, won: 0, lost: 0, open: 183, conv: 0, receita: 0 },
]

const audiences = [
  { stage: 'COLD', total: 6732, bsb: 5015, email: 2119, phone: 6182, cnpj: 350, ig: 481, action: 'Excluir baixa qualidade e enriquecer antes de midia.' },
  { stage: 'MOFU', total: 1808, bsb: 1522, email: 488, phone: 1802, cnpj: 175, ig: 15, action: 'Nutrir com prova social e convite para diagnostico.' },
  { stage: 'TOFU', total: 1116, bsb: 447, email: 495, phone: 494, cnpj: 1, ig: 625, action: 'Engajamento IG e conteudo founder-led.' },
  { stage: 'CLIENT', total: 389, bsb: 382, email: 366, phone: 386, cnpj: 318, ig: 160, action: 'Advocacy, upsell e lookalike de alta qualidade.' },
  { stage: 'ADVOCATE', total: 286, bsb: 243, email: 242, phone: 285, cnpj: 214, ig: 96, action: 'Depoimentos, indicacao e prova de autoridade.' },
  { stage: 'BOFU', total: 213, bsb: 194, email: 18, phone: 213, cnpj: 11, ig: 1, action: 'Alavanca trafego, contato direto e remarketing.' },
  { stage: 'RECOVERY', total: 169, bsb: 162, email: 139, phone: 169, cnpj: 28, ig: 2, action: 'Reativacao com cadencia curta e oferta contextual.' },
]

const crmHealth = [
  { field: 'Telefone', coverage: 89.0, filled: 9564, empty: 1182, status: 'OK' },
  { field: 'Email', coverage: 36.3, filled: 3898, empty: 6848, status: 'Atencao' },
  { field: 'Etapa atual', coverage: 20.6, filled: 2218, empty: 8528, status: 'Critico' },
  { field: 'Origem / pipe', coverage: 18.5, filled: 1989, empty: 8757, status: 'Critico' },
  { field: 'Instagram', coverage: 13.0, filled: 1398, empty: 9348, status: 'Critico' },
  { field: 'Faturamento', coverage: 11.7, filled: 1262, empty: 9484, status: 'Critico' },
  { field: 'Cargo', coverage: 11.1, filled: 1190, empty: 9556, status: 'Critico' },
  { field: 'CNPJ', coverage: 10.4, filled: 1122, empty: 9624, status: 'Critico' },
]

const sellingSegments = [
  { segment: 'BOFU Alavanca Trafego', size: 223, hook: 'Vi seu interesse na Alavanca. Vale olhar onde seu funil esta travando antes de investir mais midia?', next: 'diagnostico curto + CRM status' },
  { segment: 'Engajados IG', size: 1399, hook: 'Voce ja acompanha os conteudos da MOAI. Qual desafio mais pesa hoje: lideranca, vendas ou escala?', next: 'capturar dor + tag de interesse' },
  { segment: 'Evento / Meetup', size: 1841, hook: 'Nos cruzamos no ecossistema MOAI. Faz sentido te mandar o mapa dos próximos encontros e ver onde você se encaixa?', next: 'registrar evento + próxima ação' },
  { segment: 'CLIENT + ADVOCATE', size: 675, hook: 'Quem no seu circulo esta no mesmo momento de crescimento que voce estava antes da MOAI?', next: 'indicacao + origem advocate' },
]

export default function MoaiSalesModule() {
  return (
    <MoaiModuleShell
      title="Sales + CRM"
      description="Cockpit Clint tratado: 4.643 deals reais, 103 WON, R$ 170 mil confirmados, canais reportaveis e coorte real."
      rightActions={<StubBadge status="ready" />}
      tabs={[
        { to: '', label: 'Visão geral', end: true },
        { to: 'canais', label: 'Canais' },
        { to: 'coorte', label: 'Coorte real' },
        { to: 'qualidade', label: 'Qualidade CRM' },
        { to: 'selling', label: 'Social selling' },
      ]}
    >
      <Routes>
        <Route index element={<SalesOverview />} />
        <Route path="canais" element={<ChannelsTab />} />
        <Route path="coorte" element={<CohortTab />} />
        <Route path="qualidade" element={<QualityTab />} />
        <Route path="selling" element={<SellingTab />} />
      </Routes>
    </MoaiModuleShell>
  )
}

function SalesOverview() {
  const { kpis: live, loading, error, refetch } = useMoaiSalesByPeriod()
  const { presetLabel: periodLabel } = useMoaiPeriod()

  const won = live?.won ?? 0
  const lost = live?.lost ?? 0
  const leadsCreated = live?.leads_created ?? 0
  const revenue = live?.revenue_won ?? 0
  const winRate = live?.win_rate ?? 0
  const ticket = live?.ticket_medio ?? 0
  const openCurrent = live?.open_current ?? kpis.open
  const totalPeriod = won + lost + leadsCreated

  return (
    <div className="space-y-5">
      {/* Barra de período e atualização */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#DDE3EA] bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Database size={13} className="text-[#0F766E]" />
          <span>Clint API · filtrando por <strong className="text-[#152033]">{periodLabel}</strong></span>
          {loading && <span className="text-[11px] text-amber-600">carregando…</span>}
          {error && <span className="text-[11px] text-red-600" title={error}>erro ao buscar</span>}
        </div>
        <button type="button" onClick={() => void refetch()} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-[#152033]">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#DDE3EA] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative bg-[#101828] p-5 text-white">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/55">
              <Database size={13} /> {periodLabel}
            </div>
            <h2 className="mt-3 text-2xl font-bold leading-tight">
              {won > 0 ? `${fmtNum(won)} vendas · ${fmtBRL(revenue)} em receita no período.` : 'Nenhuma venda fechada neste período.'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
              Dados filtrados pelo período selecionado acima — WON e LOST contam por data de fechamento; leads criados contam por data de entrada no funil.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <Signal label="Leads criados" value={loading ? '…' : fmtNum(leadsCreated)} />
              <Signal label="Open total" value={loading ? '…' : fmtNum(openCurrent)} />
              <Signal label="Total período" value={loading ? '…' : fmtNum(totalPeriod)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#DDE3EA] md:grid-cols-4">
            <KpiCard label="Receita WON" value={loading ? '…' : fmtBRL(revenue)} tone={revenue > 0 ? 'green' : undefined} detail="fechamentos no período" />
            <KpiCard label="Win rate" value={loading ? '…' : fmtPct(winRate)} tone={winRate > 25 ? 'green' : winRate > 0 ? undefined : undefined} detail="WON / (WON + LOST)" />
            <KpiCard label="Vendas WON" value={loading ? '…' : fmtNum(won)} detail={`${fmtNum(lost)} perdas no período`} />
            <KpiCard label="Ticket médio" value={loading ? '…' : (ticket > 0 ? fmtBRL(ticket) : '—')} detail="receita / WON no período" />
            <KpiCard label="Pipeline OPEN" value={loading ? '…' : fmtNum(openCurrent)} tone="amber" detail="total atual (todos os períodos)" />
            <KpiCard label="Empocados +30d" value={fmtNum(kpis.empocados)} tone="red" detail="snapshot histórico" />
            <KpiCard label="Paid reportável" value={fmtNum(213)} tone="amber" detail="sem Meta Ads diário" />
            <KpiCard label="Campos críticos" value="7" tone="red" detail="aba Qualidade CRM" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {biTemplates.map((template) => (
          <div key={template.name} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Template Power BI</div>
            <h3 className="mt-1 text-sm font-bold text-[#1A1F36]">{template.name}</h3>
            <p className="mt-2 text-xs leading-5 text-gray-500">{template.scope}</p>
            <div className="mt-3 rounded-md bg-[#F8FAFC] px-3 py-2 text-xs text-gray-600">{template.useNow}</div>
            <div className="mt-2 text-[11px] font-semibold text-amber-700">{template.status}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Funil no período" icon={<Filter size={15} />}>
          <div className="space-y-3">
            {loading
              ? <div className="h-16 animate-pulse rounded bg-gray-100" />
              : <>
                  <StatusBar label="Leads criados" value={leadsCreated} total={Math.max(leadsCreated, 1)} tone="amber" />
                  <StatusBar label="LOST" value={lost} total={Math.max(leadsCreated, 1)} tone="red" />
                  <StatusBar label="WON" value={won} total={Math.max(leadsCreated, 1)} tone="green" />
                </>}
          </div>
        </Panel>
        <Panel title="Decisões de crescimento" icon={<Target size={15} />}>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Decision title="1. Corrigir base" text="Etapa, origem reportável, email, IG, CNPJ, faturamento e cargo precisam voltar estruturados ao Clint." />
            <Decision title="2. Fechar loop Ads" text="Paid só entra no report quando Meta Ads diário trouxer campanha, conjunto, anúncio, custo, clique e lead." />
            <Decision title="3. Acionar BOFU" text="Priorizar Alavanca, engajados IG, evento/comunidade e client+advocate com status de social selling." />
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Canais reportáveis (histórico completo)" icon={<Radio size={15} />}>
          <ChannelMini rows={channels} />
        </Panel>
        <Panel title="Top origens nomeadas (histórico completo)" icon={<LineChart size={15} />}>
          <OriginsTable rows={origins.slice(0, 6)} />
        </Panel>
      </section>
    </div>
  )
}

function ChannelsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {channels.map((channel) => <ChannelCard key={channel.label} channel={channel} />)}
      </div>
      <Panel title="Origem detalhada sem IDs crus" icon={<Filter size={15} />}>
        <OriginsTable rows={origins} />
      </Panel>
    </div>
  )
}

function CohortTab() {
  return <ClintCohortAnalysis />
}

function QualityTab() {
  return (
    <div className="space-y-4">
      <Panel title="Cobertura de campos criticos no Clint" icon={<AlertTriangle size={15} />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {crmHealth.map((item) => <QualityMeter key={item.field} item={item} />)}
        </div>
      </Panel>
      <Panel title="Matriz de publicos acionaveis" icon={<Users size={15} />}>
        <AudienceTable rows={audiences} />
      </Panel>
    </div>
  )
}

function SellingTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sellingSegments.map((segment) => (
          <div key={segment.segment} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{fmtNum(segment.size)} contatos</div>
                <h3 className="mt-1 text-sm font-bold text-[#1A1F36]">{segment.segment}</h3>
              </div>
              <ArrowUpRight size={15} className="text-gray-400" />
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-700">{segment.hook}</p>
            <div className="mt-4 rounded-md bg-[#F8FAFC] px-3 py-2 text-xs text-gray-500">Voltar para Clint: {segment.next}</div>
          </div>
        ))}
      </div>
      <Panel title="Campos obrigatorios para entrar no report" icon={<CheckCircle2 size={15} />}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {['social_selling_status', 'social_selling_canal', 'social_selling_persona', 'dor_principal', 'proxima_acao_social'].map((field) => (
            <div key={field} className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 font-mono text-[11px] text-[#1A1F36]">{field}</div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#1A1F36]">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F3F4F6] text-[#1A1F36]">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  )
}

function KpiCard({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: 'green' | 'amber' | 'red' }) {
  const color = tone === 'green' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : tone === 'red' ? 'text-red-600' : 'text-[#1A1F36]'
  return (
    <div className="bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`mt-2 text-xl font-bold ${color}`}>{value}</div>
      {detail && <div className="mt-1 text-xs text-gray-500">{detail}</div>}
    </div>
  )
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}

function StatusBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: 'green' | 'amber' | 'red' }) {
  const pct = total ? (value / total) * 100 : 0
  const bar = tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#1A1F36]">{label}</span>
        <span className="font-mono text-gray-500">{fmtNum(value)} · {fmtPct(pct)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${bar}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  )
}

function Decision({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <div className="text-xs font-bold text-[#1A1F36]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-gray-500">{text}</p>
    </div>
  )
}

function ChannelMini({ rows }: { rows: typeof channels }) {
  const max = Math.max(...rows.map((r) => r.total))
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[130px_1fr_72px] items-center gap-3 text-xs">
          <span className="truncate font-semibold text-[#1A1F36]">{row.label}</span>
          <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-[#1A1F36]" style={{ width: `${(row.total / max) * 100}%` }} /></div>
          <span className="text-right font-mono text-gray-500">{fmtNum(row.total)}</span>
        </div>
      ))}
    </div>
  )
}

function ChannelCard({ channel }: { channel: typeof channels[number] }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-[#1A1F36]">{channel.label}</h3>
        <span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[10px] font-semibold text-gray-500">{fmtPct(channel.conv)}</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <MiniMetric label="Total" value={fmtNum(channel.total)} />
        <MiniMetric label="WON" value={fmtNum(channel.won)} tone="green" />
        <MiniMetric label="LOST" value={fmtNum(channel.lost)} tone="red" />
        <MiniMetric label="OPEN" value={fmtNum(channel.open)} />
      </div>
      <p className="mt-4 text-xs leading-5 text-gray-500">{channel.insight}</p>
    </div>
  )
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-emerald-600' : tone === 'red' ? 'text-red-600' : 'text-[#1A1F36]'
  return <div><div className="text-[10px] text-gray-400">{label}</div><div className={`font-mono text-xs font-bold ${color}`}>{value}</div></div>
}

function OriginsTable({ rows }: { rows: typeof origins }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-xs">
        <thead className="border-b border-[#E5E7EB] text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Origem</th>
            <th className="px-3 py-2 text-right font-semibold">Total</th>
            <th className="px-3 py-2 text-right font-semibold">WON</th>
            <th className="px-3 py-2 text-right font-semibold">LOST</th>
            <th className="px-3 py-2 text-right font-semibold">OPEN</th>
            <th className="px-3 py-2 text-right font-semibold">Win rate</th>
            <th className="px-3 py-2 text-right font-semibold">Receita</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-[#1A1F36]">{r.name}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(r.total)}</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-700">{fmtNum(r.won)}</td>
              <td className="px-3 py-2 text-right font-mono text-red-700">{fmtNum(r.lost)}</td>
              <td className="px-3 py-2 text-right font-mono text-gray-500">{fmtNum(r.open)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtPct(r.conv)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtBRL(r.receita)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QualityMeter({ item }: { item: typeof crmHealth[number] }) {
  const tone = item.status === 'OK' ? 'bg-emerald-500' : item.status === 'Atencao' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-[#1A1F36]">{item.field}</div>
        <div className="font-mono text-xs text-gray-500">{fmtPct(item.coverage)}</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white"><div className={`h-2 rounded-full ${tone}`} style={{ width: `${item.coverage}%` }} /></div>
      <div className="mt-2 text-[11px] text-gray-500">{fmtNum(item.filled)} preenchidos · {fmtNum(item.empty)} vazios</div>
    </div>
  )
}

function AudienceTable({ rows }: { rows: typeof audiences }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-xs">
        <thead className="border-b border-[#E5E7EB] text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Publico</th>
            <th className="px-3 py-2 text-right font-semibold">Total</th>
            <th className="px-3 py-2 text-right font-semibold">BSB/DF</th>
            <th className="px-3 py-2 text-right font-semibold">Email</th>
            <th className="px-3 py-2 text-right font-semibold">Telefone</th>
            <th className="px-3 py-2 text-right font-semibold">CNPJ</th>
            <th className="px-3 py-2 text-right font-semibold">IG</th>
            <th className="px-3 py-2 text-left font-semibold">Acao</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stage} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 font-bold text-[#1A1F36]">{row.stage}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(row.total)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(row.bsb)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(row.email)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(row.phone)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(row.cnpj)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtNum(row.ig)}</td>
              <td className="px-3 py-2 text-gray-500">{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



