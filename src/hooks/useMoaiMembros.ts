/**
 * useMoaiMembros — hooks de leitura para o módulo Membros & Carteiras.
 *
 * Le a view consolidada vw_moai_membros_por_mentor e agrega no cliente.
 */

import { useEffect, useState, useCallback } from 'react'
import supabase from '@/lib/supabase'

export interface MoaiMembroResumo {
  mentor: string
  total_membros: number
  com_email: number
  com_deal: number
  com_won: number
  receita_total: number
  com_case_sucesso: number
  baixo_engaj: number
  medio_engaj: number
  alto_engaj: number
  critico: number
  conselheiros: string[]
}

export interface MoaiMembroRow {
  membro_monday_id: string
  membro_nome: string
  nome_curto: string | null
  empresa: string | null
  email: string | null
  conselheiro: string | null
  mentor_carteira: string | null
  status_carteira: string | null
  tem_case_sucesso: string | null
  health_score: number | null
  qtd_deals_total: number
  qtd_won: number
  qtd_lost: number
  qtd_open: number
  receita_total: number
  ultima_venda_at: string | null
  tem_deal_clint: boolean
  deal_mais_recente_at?: string | null
}

export interface MoaiMembrosFilters {
  mentor?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}

interface MoaiMembroViewRow {
  mentor: string | null
  board_name: string | null
  membro_monday_id: string | null
  membro_nome: string | null
  segmento: string | null
  conselho: string | null
  presenca_conselhos: string | null
  eventos: string | null
  comunicacao_cs: string | null
  evolucao_desafio: string | null
  score_num: number | null
  status_geral: string | null
  numero_indicacoes: number | null
  case_sucesso: string | null
  fetched_at: string | null
}

function getMoaiMembrosErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
      error_description?: unknown
      error?: unknown
    }
    const main =
      candidate.message ??
      candidate.error_description ??
      candidate.error ??
      candidate.details ??
      candidate.hint

    if (typeof main === 'string' && main.trim()) return main
    if (candidate.code) return `Erro Supabase ${String(candidate.code)}`
  }
  return 'Nao foi possivel carregar os dados de membros agora.'
}

function normalizeMember(row: MoaiMembroViewRow): MoaiMembroRow {
  const id = row.membro_monday_id ?? `${row.mentor ?? 'sem-mentor'}-${row.membro_nome ?? 'sem-nome'}`
  return {
    membro_monday_id: id,
    membro_nome: row.membro_nome ?? 'Membro sem nome',
    nome_curto: row.membro_nome ?? null,
    empresa: row.segmento ?? row.board_name ?? null,
    email: null,
    conselheiro: row.conselho,
    mentor_carteira: row.mentor,
    status_carteira: row.status_geral,
    tem_case_sucesso: row.case_sucesso,
    health_score: row.score_num,
    qtd_deals_total: 0,
    qtd_won: 0,
    qtd_lost: 0,
    qtd_open: 0,
    receita_total: 0,
    ultima_venda_at: null,
    tem_deal_clint: false,
    deal_mais_recente_at: row.fetched_at,
  }
}

function matchesStatus(row: MoaiMembroRow, status?: string) {
  if (!status) return true
  const s = (row.status_carteira ?? '').toLowerCase()
  if (status === 'crit') return s.startsWith('cr')
  if (status === 'medio') return s.startsWith('m')
  return s.startsWith(status.toLowerCase())
}

function matchesSearch(row: MoaiMembroRow, search?: string) {
  const q = search?.trim().toLowerCase()
  if (!q) return true
  return [
    row.membro_nome,
    row.nome_curto,
    row.empresa,
    row.email,
    row.conselheiro,
    row.mentor_carteira,
    row.status_carteira,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

function buildResumo(rows: MoaiMembroRow[]): MoaiMembroResumo[] {
  const byMentor = new Map<string, MoaiMembroResumo>()

  rows.forEach((row) => {
    const mentor = row.mentor_carteira || '(Sem match)'
    const current =
      byMentor.get(mentor) ??
      {
        mentor,
        total_membros: 0,
        com_email: 0,
        com_deal: 0,
        com_won: 0,
        receita_total: 0,
        com_case_sucesso: 0,
        baixo_engaj: 0,
        medio_engaj: 0,
        alto_engaj: 0,
        critico: 0,
        conselheiros: [],
      }

    current.total_membros += 1
    if (row.email) current.com_email += 1
    if (row.tem_deal_clint) current.com_deal += 1
    if (row.qtd_won > 0) current.com_won += 1
    current.receita_total += Number(row.receita_total ?? 0)
    if (row.tem_case_sucesso) current.com_case_sucesso += 1

    const status = (row.status_carteira ?? '').toLowerCase()
    if (status.startsWith('alto')) current.alto_engaj += 1
    else if (status.startsWith('m')) current.medio_engaj += 1
    else if (status.startsWith('baixo')) current.baixo_engaj += 1
    else if (status.startsWith('cr')) current.critico += 1

    if (row.conselheiro && !current.conselheiros.includes(row.conselheiro)) {
      current.conselheiros.push(row.conselheiro)
    }

    byMentor.set(mentor, current)
  })

  return Array.from(byMentor.values()).sort((a, b) => b.total_membros - a.total_membros)
}

async function fetchMembrosFromView() {
  const pageSize = 1000
  const allRows: MoaiMembroViewRow[] = []

  for (let page = 0; page < 5; page += 1) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('vw_moai_membros_por_mentor')
      .select(
        'mentor,board_name,membro_monday_id,membro_nome,segmento,conselho,presenca_conselhos,eventos,comunicacao_cs,evolucao_desafio,score_num,status_geral,numero_indicacoes,case_sucesso,fetched_at',
      )
      .range(from, to)

    if (error) throw error
    const rows = (data ?? []) as MoaiMembroViewRow[]
    allRows.push(...rows)
    if (rows.length < pageSize) break
  }

  return allRows.map(normalizeMember)
}

// =============================================================
// HOOKS
// =============================================================

export function useMoaiMembrosResumo() {
  const [data, setData] = useState<MoaiMembroResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchMembrosFromView()
      setData(buildResumo(rows))
      setError(null)
    } catch (e) {
      setError(getMoaiMembrosErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refetch())
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useMoaiMembrosLista(filters: MoaiMembrosFilters = {}) {
  const [data, setData] = useState<MoaiMembroRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchMembrosFromView()
      const filtered = rows
        .filter((row) => !filters.mentor || row.mentor_carteira === filters.mentor)
        .filter((row) => matchesStatus(row, filters.status))
        .filter((row) => matchesSearch(row, filters.search))
      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 200
      setData(filtered.slice(offset, offset + limit))
      setError(null)
    } catch (e) {
      setError(getMoaiMembrosErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filters.mentor, filters.status, filters.search, filters.limit, filters.offset])

  useEffect(() => {
    queueMicrotask(() => void refetch())
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useMoaiMembroDetalhe(id: string | null | undefined) {
  const [data, setData] = useState<MoaiMembroRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (!id) {
      queueMicrotask(() => {
        if (!alive) return
        setData(null)
        setLoading(false)
      })
      return
    }
    queueMicrotask(() => {
      if (alive) setLoading(true)
    })
    supabase
      .from('vw_moai_membros_por_mentor')
      .select(
        'mentor,board_name,membro_monday_id,membro_nome,segmento,conselho,presenca_conselhos,eventos,comunicacao_cs,evolucao_desafio,score_num,status_geral,numero_indicacoes,case_sucesso,fetched_at',
      )
      .eq('membro_monday_id', id)
      .limit(1)
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          setError(getMoaiMembrosErrorMessage(error))
          setData(null)
        } else {
          const row = (data?.[0] ?? null) as MoaiMembroViewRow | null
          setData(row ? normalizeMember(row) : null)
          setError(null)
        }
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id])

  return { data, loading, error }
}
