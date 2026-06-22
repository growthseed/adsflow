import { useEffect, useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarRange, Clock3, Database, RefreshCw, TrendingUp } from 'lucide-react'
import supabase from '@/lib/supabase'

export interface CohortMaturityRow {
  entry_ym: string
  age_month: number
  cohort_size: number
  won_cumulative: number
  lost_cumulative: number
  open_remaining: number
  revenue_cumulative: number
  won_rate_pct: number
  closed_rate_pct: number
  opportunity_win_rate_pct: number
  avg_days_to_win: number | null
}

interface ClintCohortPayload {
  cohort_maturity?: CohortMaturityRow[]
  fetched_at?: string
  counts?: { open: number; won: number; lost: number; total: number }
}

type MetricKey = 'won_rate_pct' | 'closed_rate_pct' | 'won_cumulative' | 'revenue_cumulative'
type WindowKey = 6 | 12 | 24

const COLORS = ['#17324D', '#0F766E', '#D97706', '#2563EB', '#7C3AED', '#BE123C', '#475569', '#15803D']
const formatMonth = (value: string) => {
  const [year, month] = value.split('-')
  return `${month}/${year.slice(2)}`
}
const integer = (value: number) => Math.round(value).toLocaleString('pt-BR')
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const percent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`

const SNAPSHOT_COHORT: CohortMaturityRow[] = [
  ['2025-12',154,[0,0,0,7.79,7.79,8.44,8.44],[0,0,0,12,12,13,13],[0,0,0,118,119,119,119],[0,0,0,31800,31800,31800,31800]],
  ['2026-01',1314,[0,0,1.75,1.9,1.98,1.98,1.98],[0,0,23,25,26,26,26],[0,0,53,54,55,55,55],[0,0,71336,75336,77336,77336,77336]],
  ['2026-02',185,[0,8.11,9.19,9.73,9.73,9.73,9.73],[0,15,17,18,18,18,18],[0,18,20,26,26,26,26],[0,20697,22497,23997,23997,23997,23997]],
  ['2026-03',342,[4.09,5.85,5.85,6.14,6.14,6.14,6.14],[14,20,20,21,21,21,21],[4,7,14,14,14,14,14],[10947,19094,19094,19094,19094,19094,19094]],
  ['2026-04',368,[2.45,5.16,5.16,5.16,5.16,5.16,5.16],[9,19,19,19,19,19,19],[5,21,21,21,21,21,21],[3300,7800,7800,7800,7800,7800,7800]],
  ['2026-05',2204,[0.23,0.27,0.27,0.27,0.27,0.27,0.27],[5,6,6,6,6,6,6],[3,3,3,3,3,3,3],[7500,10000,10000,10000,10000,10000,10000]],
  ['2026-06',76,[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
].flatMap(([entry,size,rates,wons,losts,revenues]) =>
  (rates as number[]).map((rate, age) => {
    const won = (wons as number[])[age]
    const lost = (losts as number[])[age]
    const closed = won + lost
    return {
      entry_ym: entry as string,
      age_month: age,
      cohort_size: size as number,
      won_cumulative: won,
      lost_cumulative: lost,
      open_remaining: Math.max(0, (size as number) - closed),
      revenue_cumulative: (revenues as number[])[age],
      won_rate_pct: rate,
      closed_rate_pct: (size as number) ? Number(((closed / (size as number)) * 100).toFixed(2)) : 0,
      opportunity_win_rate_pct: closed ? Number(((won / closed) * 100).toFixed(2)) : 0,
      avg_days_to_win: null,
    }
  }),
).filter((row) => {
  const [year, month] = row.entry_ym.split('-').map(Number)
  const observedAge = (2026 - year) * 12 + (6 - month)
  return row.age_month <= observedAge
})

export default function ClintCohortAnalysis() {
  const [rows, setRows] = useState<CohortMaturityRow[]>(SNAPSHOT_COHORT)
  const [source, setSource] = useState('Snapshot Clint - 06/06/2026')
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<string | null>(null)
  const [metric, setMetric] = useState<MetricKey>('won_rate_pct')
  const [ageLimit, setAgeLimit] = useState(3)
  const [windowSize, setWindowSize] = useState<WindowKey>(12)

  async function load() {
    setLoading(true)
    setNote(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setSource('Snapshot Clint - 06/06/2026')
        setNote('Entre com sua conta MOAI para atualizar diretamente da API Clint.')
        return
      }
      const response = await fetch('/api/integrations?op=clint-funnel&client_slug=moai', {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`Clint respondeu HTTP ${response.status}`)
      const payload = (await response.json()) as ClintCohortPayload
      if (payload.cohort_maturity?.length) {
        setRows(payload.cohort_maturity)
        setFetchedAt(payload.fetched_at ?? null)
        setSource('Clint API - base completa')
      } else {
        setNote('A API respondeu sem a nova matriz; mantendo o ultimo snapshot tratado.')
      }
    } catch (error) {
      setNote(error instanceof Error ? `${error.message}. Exibindo snapshot tratado.` : 'Falha ao atualizar; exibindo snapshot tratado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const model = useMemo(() => {
    const months = [...new Set(rows.map((row) => row.entry_ym))].sort()
    const visibleMonths = months.slice(-windowSize)
    const visibleRows = rows.filter((row) => visibleMonths.includes(row.entry_ym) && row.age_month <= ageLimit)
    const latestByMonth = visibleMonths.map((month) => {
      const points = visibleRows.filter((row) => row.entry_ym === month).sort((a, b) => a.age_month - b.age_month)
      return points[points.length - 1]
    }).filter(Boolean) as CohortMaturityRow[]
    const matured = visibleRows.filter((row) => row.age_month === ageLimit && row.cohort_size >= 50)
    const best = [...matured].sort((a, b) => b.won_rate_pct - a.won_rate_pct)[0]
    const totalSize = latestByMonth.reduce((sum, row) => sum + row.cohort_size, 0)
    const totalWon = latestByMonth.reduce((sum, row) => sum + row.won_cumulative, 0)
    const totalOpen = latestByMonth.reduce((sum, row) => sum + row.open_remaining, 0)
    const totalRevenue = latestByMonth.reduce((sum, row) => sum + row.revenue_cumulative, 0)
    const chart = Array.from({ length: ageLimit + 1 }, (_, age) => {
      const point: Record<string, number | string> = { age: `M+${age}` }
      for (const month of visibleMonths.slice(-8)) {
        const row = visibleRows.find((item) => item.entry_ym === month && item.age_month === age)
        if (row) point[month] = row.won_rate_pct
      }
      return point
    })
    return {
      visibleMonths,
      visibleRows,
      latestByMonth,
      chart,
      chartMonths: visibleMonths.slice(-8),
      best,
      totalSize,
      totalWon,
      totalOpen,
      totalRevenue,
      weightedRate: totalSize ? (totalWon / totalSize) * 100 : 0,
    }
  }, [rows, windowSize, ageLimit])

  const metricConfig = {
    won_rate_pct: { label: 'Conversão acumulada', short: 'Taxa WON', format: percent },
    closed_rate_pct: { label: 'Fechamento acumulado', short: 'Fechados', format: percent },
    won_cumulative: { label: 'Vendas acumuladas', short: 'WON', format: integer },
    revenue_cumulative: { label: 'Receita acumulada', short: 'Receita', format: currency },
  }[metric]

  const maxMetric = Math.max(1, ...model.visibleRows.map((row) => Number(row[metric]) || 0))

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 border-y border-[#DDE3EA] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#152033]"><Database size={14} /> {source}</div>
          <div className="mt-1 text-[11px] text-gray-500">{fetchedAt ? `Atualizado em ${new Date(fetchedAt).toLocaleString('pt-BR')}` : rows.length + ' pontos de maturação - ' + new Set(rows.map((row) => row.entry_ym)).size + ' safras tratadas'}</div>
          {note && <div className="mt-1 text-[11px] text-amber-700">{note}</div>}
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#CBD5E1] px-3 text-xs font-bold text-[#152033] hover:bg-[#F8FAFC] disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar Clint
        </button>
      </section>

      <section className="grid grid-cols-2 overflow-hidden border border-[#DDE3EA] bg-white md:grid-cols-5">
        <Kpi label="Safras analisadas" value={integer(model.visibleMonths.length)} detail={`últimos ${windowSize} meses`} />
        <Kpi label="Deals nas safras" value={integer(model.totalSize)} detail="denominador real" />
        <Kpi label="Taxa WON ponderada" value={percent(model.weightedRate)} detail={`${integer(model.totalWon)} vendas`} />
        <Kpi label="Pipeline ainda aberto" value={integer(model.totalOpen)} detail={model.totalSize ? percent((model.totalOpen / model.totalSize) * 100) : '0%'} />
        <Kpi label="Receita acumulada" value={currency(model.totalRevenue)} detail={model.best ? `melhor safra ${formatMonth(model.best.entry_ym)}` : 'sem safra madura'} />
      </section>

      <section className="flex flex-col gap-3 border border-[#DDE3EA] bg-white p-3 lg:flex-row lg:items-end lg:justify-between">
        <Segmented label="Métrica da matriz" value={metric} onChange={(value) => setMetric(value as MetricKey)} items={[
          ['won_rate_pct','Taxa WON'],['closed_rate_pct','Fechados'],['won_cumulative','WON'],['revenue_cumulative','Receita'],
        ]} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Segmented label="Idade da safra" value={String(ageLimit)} onChange={(value) => setAgeLimit(Number(value))} items={[['3','M+3'],['6','M+6'],['12','M+12']]} />
          <Segmented label="Histórico" value={String(windowSize)} onChange={(value) => setWindowSize(Number(value) as WindowKey)} items={[['6','6 meses'],['12','12 meses'],['24','24 meses']]} />
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="min-w-0 border border-[#DDE3EA] bg-white p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="text-sm font-bold text-[#152033]">Curvas de maturação das safras</h2><p className="text-xs text-gray-500">Quanto cada mes converte conforme envelhece.</p></div>
            <TrendingUp size={17} className="text-[#0F766E]" />
          </div>
          <div className="h-[300px] min-h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} initialDimension={{ width: 960, height: 300 }}>
              <ComposedChart data={model.chart} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E8EDF2" />
                <XAxis dataKey="age" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => percent(Number(value))} labelFormatter={(label) => `Idade ${label}`} />
                <Area type="monotone" dataKey={model.chartMonths[0]} fill="#E6EEF4" stroke="transparent" />
                {model.chartMonths.map((month, index) => <Line key={month} type="monotone" dataKey={month} name={formatMonth(month)} stroke={COLORS[index % COLORS.length]} strokeWidth={index >= model.chartMonths.length - 2 ? 2.5 : 1.5} dot={{ r: 2 }} connectNulls={false} />)}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{model.chartMonths.map((month, index) => <div key={month} className="flex items-center gap-1.5 text-[10px] text-gray-600"><span className="h-0.5 w-4" style={{ background: COLORS[index % COLORS.length] }} />{formatMonth(month)}</div>)}</div>
        </div>

        <div className="border border-[#DDE3EA] bg-[#152033] p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/55"><Clock3 size={14} /> Leitura executiva</div>
          {model.best ? <>
            <div className="mt-5 text-[11px] uppercase text-white/50">Melhor safra na mesma idade</div>
            <div className="mt-1 text-3xl font-bold">{formatMonth(model.best.entry_ym)}</div>
            <div className="mt-1 text-sm text-[#52D2BA]">{percent(model.best.won_rate_pct)} WON em M+{model.best.age_month}</div>
            <div className="mt-6 grid grid-cols-2 gap-px bg-white/10">
              <DarkMetric label="Volume" value={integer(model.best.cohort_size)} />
              <DarkMetric label="Vendas" value={integer(model.best.won_cumulative)} />
              <DarkMetric label="Fechados" value={percent(model.best.closed_rate_pct)} />
              <DarkMetric label="Receita" value={currency(model.best.revenue_cumulative)} />
            </div>
            <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-white/65">Compare safras na mesma idade. Maio em M+1 não deve ser julgado contra fevereiro em M+4.</p>
          </> : <div className="mt-5 text-sm text-white/70">Ainda não há safra com pelo menos M+2.</div>}
        </div>
      </section>

      <section className="overflow-hidden border border-[#DDE3EA] bg-white">
        <div className="flex items-center justify-between border-b border-[#DDE3EA] px-4 py-3">
          <div><h2 className="text-sm font-bold text-[#152033]">Matriz - {metricConfig.label}</h2><p className="text-xs text-gray-500">Linhas = mes de entrada - colunas = idade da safra.</p></div>
          <CalendarRange size={17} className="text-gray-500" />
        </div>
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead><tr className="bg-[#F8FAFC] text-gray-500">
              <th className="sticky left-0 z-10 min-w-[110px] border-r border-[#DDE3EA] bg-[#F8FAFC] px-3 py-2.5 text-left font-bold">Safra</th>
              <th className="min-w-[72px] px-2 py-2.5 text-right font-bold">Volume</th>
              {Array.from({ length: ageLimit + 1 }, (_, age) => <th key={age} className="min-w-[76px] px-2 py-2.5 text-center font-bold">M+{age}</th>)}
              <th className="min-w-[90px] px-3 py-2.5 text-right font-bold">Aberto</th>
            </tr></thead>
            <tbody>{model.visibleMonths.map((month) => {
              const monthRows = model.visibleRows.filter((row) => row.entry_ym === month)
              const latest = monthRows[monthRows.length - 1]
              return <tr key={month} className="border-t border-[#EEF2F6]">
                <td className="sticky left-0 z-10 border-r border-[#DDE3EA] bg-white px-3 py-2.5 font-bold text-[#152033]">{formatMonth(month)}</td>
                <td className="px-2 py-2.5 text-right font-mono">{integer(latest?.cohort_size ?? 0)}</td>
                {Array.from({ length: ageLimit + 1 }, (_, age) => {
                  const cell = monthRows.find((row) => row.age_month === age)
                  if (!cell) return <td key={age} className="bg-[#F8FAFC] px-2 py-2.5 text-center text-gray-300">-</td>
                  const value = Number(cell[metric]) || 0
                  const strength = value / maxMetric
                  return <td key={age} className="px-1.5 py-1.5 text-center"><div className="rounded-sm px-2 py-2 font-mono font-bold" style={{ background: `rgba(15, 118, 110, ${0.08 + strength * 0.72})`, color: strength > 0.52 ? 'white' : '#152033' }} title={`${formatMonth(month)} - M+${age} - ${metricConfig.format(value)}`}>{metricConfig.format(value)}</div></td>
                })}
                <td className="px-3 py-2.5 text-right font-mono text-amber-700">{integer(latest?.open_remaining ?? 0)}</td>
              </tr>
            })}</tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden border border-[#DDE3EA] bg-white">
        <div className="border-b border-[#DDE3EA] px-4 py-3"><h2 className="text-sm font-bold text-[#152033]">Resumo por safra na idade observada</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-xs"><thead className="bg-[#F8FAFC] text-gray-500"><tr>
          <th className="px-4 py-2.5 text-left">Safra</th><th className="px-3 py-2.5 text-right">Idade</th><th className="px-3 py-2.5 text-right">Deals</th><th className="px-3 py-2.5 text-right">WON</th><th className="px-3 py-2.5 text-right">LOST</th><th className="px-3 py-2.5 text-right">OPEN</th><th className="px-3 py-2.5 text-right">Taxa WON</th><th className="px-4 py-2.5 text-right">Receita</th>
        </tr></thead><tbody>{model.latestByMonth.map((row) => <tr key={row.entry_ym} className="border-t border-[#EEF2F6]">
          <td className="px-4 py-2.5 font-bold text-[#152033]">{formatMonth(row.entry_ym)}</td><td className="px-3 py-2.5 text-right font-mono">M+{row.age_month}</td><td className="px-3 py-2.5 text-right font-mono">{integer(row.cohort_size)}</td><td className="px-3 py-2.5 text-right font-mono text-emerald-700">{integer(row.won_cumulative)}</td><td className="px-3 py-2.5 text-right font-mono text-red-700">{integer(row.lost_cumulative)}</td><td className="px-3 py-2.5 text-right font-mono text-amber-700">{integer(row.open_remaining)}</td><td className="px-3 py-2.5 text-right font-mono">{percent(row.won_rate_pct)}</td><td className="px-4 py-2.5 text-right font-mono">{currency(row.revenue_cumulative)}</td>
        </tr>)}</tbody></table></div>
      </section>
    </div>
  )
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="min-w-0 border-r border-b border-[#E8EDF2] p-3 last:border-r-0 md:p-4"><div className="truncate text-[10px] font-bold uppercase text-gray-500">{label}</div><div className="mt-1 truncate text-xl font-bold tabular-nums text-[#152033]">{value}</div><div className="mt-1 text-[10px] text-gray-500">{detail}</div></div>
}
function DarkMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#152033] p-3"><div className="text-[9px] font-bold uppercase text-white/45">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>
}
function Segmented({ label, value, items, onChange }: { label: string; value: string; items: Array<[string,string]>; onChange: (value: string) => void }) {
  return <div><div className="mb-1 text-[10px] font-bold uppercase text-gray-500">{label}</div><div className="flex min-h-11 overflow-x-auto rounded-md border border-[#CBD5E1] bg-white p-0.5">{items.map(([key,text]) => <button key={key} type="button" onClick={() => onChange(key)} className={`min-h-10 whitespace-nowrap rounded px-3 text-xs font-bold ${value === key ? 'bg-[#152033] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{text}</button>)}</div></div>
}





