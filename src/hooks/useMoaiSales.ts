/**
 * useMoaiSales — hooks de leitura do módulo Sales (Clint).
 */

import { useEffect, useState, useCallback } from 'react'
import supabase from '@/lib/supabase'
import { useMoaiPeriod } from '@/contexts/MoaiPeriodContext'

export interface SalesResumoAtual {
  total_deals: number
  qtd_won: number
  qtd_lost: number
  qtd_open: number
  receita_won: number
  ticket_medio: number
  win_rate: number
  emails_distintos: number
}

export interface SalesResumoComparativo {
  periodo: { start: string; end: string }
  total_deals: number
  qtd_won: number
  receita_won: number
  delta_total_pct: number | null
  delta_won_pct: number | null
  delta_receita_pct: number | null
}

export interface SalesResumo {
  periodo: { start: string; end: string }
  atual: SalesResumoAtual
  comparativo: SalesResumoComparativo | null
}

export interface SalesPorOrigem {
  origin: string
  total: number
  won: number
  lost: number
  open: number
  receita: number
  win_rate: number
}

export interface SalesPorEtapa {
  stage: string
  total: number
  won: number
  lost: number
  open: number
  receita: number
}

export interface DealEmpocado {
  external_deal_id: string
  email_contact: string | null
  stage_name: string | null
  value: number
  origin: string | null
  created_at: string
  dias_aberto: number
}

export function useMoaiSalesResumo() {
  const { iso, compareEnabled } = useMoaiPeriod()
  const [data, setData] = useState<SalesResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_moai_sales_resumo', {
      p_start_date: iso.start,
      p_end_date: iso.end,
      p_compare_start: compareEnabled ? iso.compareStart : null,
      p_compare_end: compareEnabled ? iso.compareEnd : null,
    })
    if (error) setError(error.message)
    else setData(data as SalesResumo)
    setLoading(false)
  }, [iso.start, iso.end, iso.compareStart, iso.compareEnd, compareEnabled])
  useEffect(() => {
    queueMicrotask(() => void refetch())
  }, [refetch])
  return { data, loading, error, refetch }
}

export function useMoaiSalesPorOrigem() {
  const [data, setData] = useState<SalesPorOrigem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.rpc('get_moai_sales_por_origem').then(({ data }) => {
      setData((data ?? []) as SalesPorOrigem[])
      setLoading(false)
    })
  }, [])
  return { data, loading }
}

export function useMoaiSalesPorEtapa() {
  const [data, setData] = useState<SalesPorEtapa[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.rpc('get_moai_sales_por_etapa').then(({ data }) => {
      setData((data ?? []) as SalesPorEtapa[])
      setLoading(false)
    })
  }, [])
  return { data, loading }
}

export function useMoaiSalesEmpocados(dias = 30) {
  const [data, setData] = useState<DealEmpocado[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.rpc('get_moai_sales_empocados', { p_dias: dias }).then(({ data }) => {
      setData((data ?? []) as DealEmpocado[])
      setLoading(false)
    })
  }, [dias])
  return { data, loading }
}

// ─── KPIs dinâmicos filtrados pelo período do MoaiPeriodPicker ───────────────
// Fonte: /api/integrations?op=clint-funnel — filtra byMonth pelo intervalo selecionado.
// Não depende de RPCs Supabase; usa o cache do clint-funnel (5 min TTL).

export interface SalesPeriodKpis {
  start_ym: string
  end_ym: string
  won: number
  lost: number
  leads_created: number
  revenue_won: number
  win_rate: number
  ticket_medio: number
  open_current: number
}

interface ClintByMonth {
  ym: string
  won: number
  lost: number
  leads: number
  open: number
  revenue_won?: number
}

interface ClintFunnelPayload {
  counts: { open: number; won: number; lost: number; total: number }
  byMonth: ClintByMonth[]
}

export function useMoaiSalesByPeriod() {
  const { iso } = useMoaiPeriod()
  const [kpis, setKpis] = useState<SalesPeriodKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) { setError('Sessão expirada.'); setLoading(false); return }

      const resp = await fetch('/api/integrations?op=clint-funnel&client_slug=moai', {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error(`Clint retornou HTTP ${resp.status}`)
      const body = (await resp.json()) as ClintFunnelPayload

      const startYm = iso.start.slice(0, 7)
      const endYm = iso.end.slice(0, 7)
      const filtered = (body.byMonth ?? []).filter((m) => m.ym >= startYm && m.ym <= endYm)

      const won = filtered.reduce((s, m) => s + m.won, 0)
      const lost = filtered.reduce((s, m) => s + m.lost, 0)
      const leads = filtered.reduce((s, m) => s + m.leads, 0)
      const revenue = filtered.reduce((s, m) => s + (m.revenue_won ?? 0), 0)

      setKpis({
        start_ym: startYm,
        end_ym: endYm,
        won,
        lost,
        leads_created: leads,
        revenue_won: revenue,
        win_rate: won + lost > 0 ? (won / (won + lost)) * 100 : 0,
        ticket_medio: won > 0 ? revenue / won : 0,
        open_current: body.counts?.open ?? 0,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao buscar dados.')
    } finally {
      setLoading(false)
    }
  }, [iso.start, iso.end])

  useEffect(() => { void fetchData() }, [fetchData])
  return { kpis, loading, error, refetch: fetchData }
}
