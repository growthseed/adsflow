/**
 * useMoaiConteudo — Hooks para o módulo Conteúdo & Marketing.
 *
 * Lê diretamente da tabela monday_boards_snapshot (padrão do projeto —
 * igual a useMoaiMembros). Sem RPCs: toda a agregação é client-side.
 * Boards de conteúdo: nomes que contêm "cronograma" ou "redes sociais moai".
 */

import { useEffect, useState, useCallback } from 'react'
import supabase from '@/lib/supabase'
import { useMoaiPeriod } from '@/contexts/MoaiPeriodContext'

// ============================================================
// TIPOS PÚBLICOS
// ============================================================

export interface ConteudoResumoAtual {
  total: number
  publicados: number
  planejados: number
  aprovados: number
  em_producao: number
  pausados: number
  canais_distintos: number
  editorias_distintas: number
  responsaveis_distintos: number
}

export interface ConteudoResumoComparativo {
  periodo: { start: string; end: string }
  total: number
  publicados: number
  delta_total_pct: number | null
  delta_publicados_pct: number | null
}

export interface ConteudoResumo {
  periodo: { start: string; end: string }
  atual: ConteudoResumoAtual
  comparativo: ConteudoResumoComparativo | null
}

export interface ConteudoPorCanal {
  canal: string
  total: number
  publicados: number
  planejados: number
  em_producao: number
  aprovados: number
}

export interface ConteudoPorEditoria {
  editoria: string
  total: number
  publicados: number
  planejados: number
}

export interface ConteudoPorResponsavel {
  responsavel: string
  total: number
  publicados: number
  em_andamento: number
}

export interface ConteudoCalendarDay {
  data: string
  count: number
  canais: string[] | null
}

export interface ConteudoItem {
  item_id: string
  titulo: string
  canal: string
  editoria: string | null
  formato: string | null
  status: string | null
  status_norm: string | null
  responsavel: string | null
  data_post: string | null
}

export interface ConteudoFilters {
  canal?: string
  status?: string
  search?: string
  limit?: number
}

// ============================================================
// TIPOS INTERNOS (Monday snapshot)
// ============================================================

interface ColumnValue {
  id?: string
  title?: string
  type?: string
  text?: string
  value?: string
}

interface MondayItem {
  id: string
  name: string
  group?: { id: string; title: string } | null
  column_values?: ColumnValue[]
}

interface BoardSnapshot {
  board_name: string
  items: MondayItem[] | null
}

// ============================================================
// HELPERS
// ============================================================

function cvByTitle(cvs: ColumnValue[] | undefined, ...patterns: string[]): string | null {
  if (!cvs) return null
  for (const pattern of patterns) {
    const lp = pattern.toLowerCase()
    const found = cvs.find(
      (cv) =>
        (cv.title ?? '').toLowerCase().includes(lp) ||
        (cv.type ?? '').toLowerCase() === lp,
    )
    if (found?.text?.trim()) return found.text.trim()
  }
  return null
}

function normalizeStatus(raw: string | null): string {
  if (!raw) return 'planejado'
  const s = raw.toLowerCase()
  if (['publicado', 'publicada', 'posted', 'published', 'ao vivo', 'live'].includes(s)) return 'publicado'
  if (['aprovado', 'aprovada', 'approved', 'revisado'].includes(s)) return 'aprovado'
  if (['em produção', 'em producao', 'in production', 'gravando', 'editando', 'gravação'].includes(s)) return 'em_producao'
  if (['pausado', 'pausada', 'paused', 'suspenso', 'on hold'].includes(s)) return 'pausado'
  return 'planejado'
}

function extractItem(board_name: string, item: MondayItem): ConteudoItem {
  const cvs = item.column_values
  const rawStatus = cvByTitle(cvs, 'status')
  return {
    item_id: item.id,
    titulo: item.name || '(sem título)',
    canal: board_name,
    editoria: cvByTitle(cvs, 'editoria'),
    formato: cvByTitle(cvs, 'formato'),
    status: rawStatus,
    status_norm: normalizeStatus(rawStatus),
    responsavel: cvByTitle(cvs, 'responsável', 'responsavel', 'person', 'owner'),
    data_post: cvByTitle(cvs, 'data de postagem', 'data post', 'data', 'date'),
  }
}

async function fetchConteudoItems(): Promise<ConteudoItem[]> {
  // Busca boards cujo nome contenha 'cronograma' ou 'redes sociais moai'
  const { data, error } = await supabase
    .from('monday_boards_snapshot')
    .select('board_name, items')
    .or('board_name.ilike.%cronograma%,board_name.ilike.%redes sociais moai%')

  if (error) throw error

  const boards = (data ?? []) as BoardSnapshot[]
  const all: ConteudoItem[] = []

  for (const board of boards) {
    const items = Array.isArray(board.items) ? (board.items as MondayItem[]) : []
    for (const item of items) {
      all.push(extractItem(board.board_name, item))
    }
  }

  return all
}

// ============================================================
// AGGREGADORES CLIENT-SIDE
// ============================================================

function buildResumoAtual(items: ConteudoItem[]): ConteudoResumoAtual {
  return {
    total: items.length,
    publicados: items.filter((i) => i.status_norm === 'publicado').length,
    planejados: items.filter((i) => i.status_norm === 'planejado').length,
    aprovados: items.filter((i) => i.status_norm === 'aprovado').length,
    em_producao: items.filter((i) => i.status_norm === 'em_producao').length,
    pausados: items.filter((i) => i.status_norm === 'pausado').length,
    canais_distintos: new Set(items.map((i) => i.canal)).size,
    editorias_distintas: new Set(items.filter((i) => i.editoria).map((i) => i.editoria!)).size,
    responsaveis_distintos: new Set(items.filter((i) => i.responsavel).map((i) => i.responsavel!)).size,
  }
}

function filterByPeriod(items: ConteudoItem[], start: string, end: string): ConteudoItem[] {
  if (!start || !end) return items
  const s = new Date(start)
  const e = new Date(end)
  e.setHours(23, 59, 59, 999)
  return items.filter((i) => {
    if (!i.data_post) return false
    const d = new Date(i.data_post)
    return !isNaN(d.getTime()) && d >= s && d <= e
  })
}

function buildPorCanal(items: ConteudoItem[]): ConteudoPorCanal[] {
  const map = new Map<string, ConteudoPorCanal>()
  for (const item of items) {
    const c = item.canal
    const entry = map.get(c) ?? { canal: c, total: 0, publicados: 0, planejados: 0, em_producao: 0, aprovados: 0 }
    entry.total += 1
    if (item.status_norm === 'publicado') entry.publicados += 1
    else if (item.status_norm === 'planejado') entry.planejados += 1
    else if (item.status_norm === 'em_producao') entry.em_producao += 1
    else if (item.status_norm === 'aprovado') entry.aprovados += 1
    map.set(c, entry)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

function buildPorEditoria(items: ConteudoItem[]): ConteudoPorEditoria[] {
  const map = new Map<string, ConteudoPorEditoria>()
  for (const item of items) {
    const e = item.editoria ?? '(sem editoria)'
    const entry = map.get(e) ?? { editoria: e, total: 0, publicados: 0, planejados: 0 }
    entry.total += 1
    if (item.status_norm === 'publicado') entry.publicados += 1
    else if (item.status_norm === 'planejado') entry.planejados += 1
    map.set(e, entry)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

function buildPorResponsavel(items: ConteudoItem[]): ConteudoPorResponsavel[] {
  const map = new Map<string, ConteudoPorResponsavel>()
  for (const item of items) {
    const r = item.responsavel ?? '(sem responsável)'
    const entry = map.get(r) ?? { responsavel: r, total: 0, publicados: 0, em_andamento: 0 }
    entry.total += 1
    if (item.status_norm === 'publicado') entry.publicados += 1
    else entry.em_andamento += 1
    map.set(r, entry)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

function buildCalendar(items: ConteudoItem[], meses: number): ConteudoCalendarDay[] {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - meses)
  cutoff.setHours(0, 0, 0, 0)

  const map = new Map<string, { count: number; canais: Set<string> }>()

  for (const item of items) {
    if (item.status_norm !== 'publicado' || !item.data_post) continue
    const d = new Date(item.data_post)
    if (isNaN(d.getTime()) || d < cutoff) continue
    const key = d.toISOString().slice(0, 10)
    const entry = map.get(key) ?? { count: 0, canais: new Set() }
    entry.count += 1
    entry.canais.add(item.canal)
    map.set(key, entry)
  }

  return Array.from(map.entries())
    .map(([data, v]) => ({ data, count: v.count, canais: Array.from(v.canais) }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

// ============================================================
// CACHE SIMPLES (evita re-fetch nas trocas de aba)
// ============================================================

let _cachedItems: ConteudoItem[] | null = null
let _fetchPromise: Promise<ConteudoItem[]> | null = null

async function getItems(): Promise<ConteudoItem[]> {
  if (_cachedItems) return _cachedItems
  if (!_fetchPromise) {
    _fetchPromise = fetchConteudoItems().then((items) => {
      _cachedItems = items
      return items
    }).catch((err) => {
      _fetchPromise = null
      throw err
    })
  }
  return _fetchPromise
}

// ============================================================
// HOOKS
// ============================================================

export function useMoaiConteudoResumo() {
  const { iso, compareEnabled } = useMoaiPeriod()
  const [data, setData] = useState<ConteudoResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const items = await getItems()
      const filtered = filterByPeriod(items, iso.start, iso.end)
      const atual = buildResumoAtual(filtered)

      let comparativo: ConteudoResumoComparativo | null = null
      if (compareEnabled && iso.compareStart && iso.compareEnd) {
        const comp = filterByPeriod(items, iso.compareStart, iso.compareEnd)
        const compAgg = buildResumoAtual(comp)
        comparativo = {
          periodo: { start: iso.compareStart, end: iso.compareEnd },
          total: compAgg.total,
          publicados: compAgg.publicados,
          delta_total_pct:
            compAgg.total > 0
              ? Math.round(((atual.total - compAgg.total) / compAgg.total) * 1000) / 10
              : null,
          delta_publicados_pct:
            compAgg.publicados > 0
              ? Math.round(((atual.publicados - compAgg.publicados) / compAgg.publicados) * 1000) / 10
              : null,
        }
      }

      setData({ periodo: { start: iso.start, end: iso.end }, atual, comparativo })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conteúdo.')
    } finally {
      setLoading(false)
    }
  }, [iso.start, iso.end, iso.compareStart, iso.compareEnd, compareEnabled])

  useEffect(() => { queueMicrotask(() => void refetch()) }, [refetch])
  return { data, loading, error, refetch }
}

export function useMoaiConteudoPorCanal() {
  const [data, setData] = useState<ConteudoPorCanal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getItems().then((items) => {
      if (!alive) return
      setData(buildPorCanal(items))
      setLoading(false)
    }).catch(() => {
      if (!alive) return
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  return { data, loading }
}

export function useMoaiConteudoPorEditoria() {
  const [data, setData] = useState<ConteudoPorEditoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getItems().then((items) => {
      if (!alive) return
      setData(buildPorEditoria(items))
      setLoading(false)
    }).catch(() => {
      if (!alive) return
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  return { data, loading }
}

export function useMoaiConteudoPorResponsavel() {
  const [data, setData] = useState<ConteudoPorResponsavel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getItems().then((items) => {
      if (!alive) return
      setData(buildPorResponsavel(items))
      setLoading(false)
    }).catch(() => {
      if (!alive) return
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  return { data, loading }
}

export function useMoaiConteudoCalendar(meses = 3) {
  const [data, setData] = useState<ConteudoCalendarDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getItems().then((items) => {
      if (!alive) return
      setData(buildCalendar(items, meses))
      setLoading(false)
    }).catch(() => {
      if (!alive) return
      setLoading(false)
    })
    return () => { alive = false }
  }, [meses])

  return { data, loading }
}

export function useMoaiConteudoLista(filters: ConteudoFilters = {}) {
  const [data, setData] = useState<ConteudoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    queueMicrotask(() => { if (alive) setLoading(true) })
    getItems().then((items) => {
      if (!alive) return
      const { canal, status, search, limit = 200 } = filters
      const q = search?.trim().toLowerCase()
      const filtered = items
        .filter((i) => !canal || i.canal === canal)
        .filter((i) => !status || i.status_norm === status)
        .filter((i) => {
          if (!q) return true
          return [i.titulo, i.editoria, i.responsavel, i.canal]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))
        })
        .slice(0, limit)
      setData(filtered)
      setLoading(false)
    }).catch(() => {
      if (!alive) return
      setLoading(false)
    })
    return () => { alive = false }
  }, [filters.canal, filters.status, filters.search, filters.limit])

  return { data, loading }
}
