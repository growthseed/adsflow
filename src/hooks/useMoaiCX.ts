/**
 * useMoaiCX — hooks de leitura pro módulo CX & NPS.
 */

import { useEffect, useState, useCallback } from 'react'
import supabase from '@/lib/supabase'

export interface CXResumo {
  nps_conselhos_2026_count: number
  nps_conselhos_2026_avg_cs: number
  nps_alavanca_count: number
  nps_alavanca_avg_geral: number
  health_conselhos_total: number
  health_em_risco: number
  reposicoes_total: number
  reposicoes_pendentes: number
}

export interface CX360 {
  nps: {
    score: number
    promotores_pct: number
    passivos_pct: number
    detratores_pct: number
    total_respostas: number
    media_nota: number
  }
  temperatura: {
    total: number
    buckets: Array<{ bucket: 'critico' | 'em_risco' | 'estavel' | 'engajado' | 'advocate'; count: number }>
  }
  radar: Array<{ label: string; value: number }>
}

export function useMoaiCX360() {
  const [data, setData] = useState<CX360 | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.rpc('get_moai_cx_360').then(({ data }) => {
      setData(data as CX360)
      setLoading(false)
    })
  }, [])
  return { data, loading }
}

export interface HealthConselho {
  conselho_id: string
  conselho_nome: string
  health_geral: string | null
  acao_prioritaria: string | null
  evolucao_desafios: string | null
  presenca_membros: string | null
  risco_churn: string | null
  nps_status: string | null
  perfil_conselheiro: string | null
  engaj_conselheiro: string | null
  plano_acao: string | null
  observacoes: string | null
  base_ativa: number | null
  fantasmas: number | null
  presenca_ultimo_mes: number | null
  setor_predominante: string | null
}

export interface Reposicao {
  reposicao_id: string
  reposicao_nome: string
  data: string | null
  produto: string | null
  status: string | null
  segmento: string | null
  conselho: string | null
  cs_responsavel: string | null
}

export interface NPSResposta {
  client_id: string
  tipo: 'conselho' | 'alavanca' | 'evento' | 'turn_lab'
  board_name: string
  resposta_id: string
  membro_nome: string
  nps_score: number | null
  mentor: string | null
  comentario: string | null
  conselho_nome: string | null
  data_resposta: string | null
  classificacao: 'promotor' | 'neutro' | 'detrator' | null
}

export interface NPSFilters {
  tipo: NPSResposta['tipo']
  classificacao?: string
  mentor?: string
  search?: string
  limit?: number
}

export function useMoaiCXResumo() {
  const [data, setData] = useState<CXResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_moai_cx_resumo')
    if (error) setError(error.message)
    else setData(data as CXResumo)
    setLoading(false)
  }, [])
  useEffect(() => {
    queueMicrotask(() => void refetch())
  }, [refetch])
  return { data, loading, error, refetch }
}

export function useMoaiHealthConselhos() {
  const [data, setData] = useState<HealthConselho[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.rpc('get_moai_health_conselhos').then(({ data, error }) => {
      if (error) setError(error.message)
      else setData((data ?? []) as HealthConselho[])
      setLoading(false)
    })
  }, [])
  return { data, loading, error }
}

export function useMoaiReposicoes(status?: string) {
  const [data, setData] = useState<Reposicao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.rpc('get_moai_reposicoes', { p_status: status ?? null, p_limit: 300 }).then(({ data, error }) => {
      if (error) setError(error.message)
      else setData((data ?? []) as Reposicao[])
      setLoading(false)
    })
  }, [status])
  return { data, loading, error }
}

export function useMoaiNPSRespostas(filters: NPSFilters) {
  const [data, setData] = useState<NPSResposta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (alive) setLoading(true)
    })

    let query = supabase
      .from('vw_moai_nps_consolidado')
      .select('*')
      .eq('tipo', filters.tipo)
      .limit(filters.limit ?? 250)

    if (filters.classificacao) {
      query = query.eq('classificacao', filters.classificacao)
    }

    if (filters.mentor) {
      query = query.eq('mentor', filters.mentor)
    }

    if (filters.search) {
      const term = filters.search.replaceAll(',', ' ').trim()
      if (term) {
        query = query.or(`membro_nome.ilike.%${term}%,conselho_nome.ilike.%${term}%,comentario.ilike.%${term}%`)
      }
    }

    query
      .order('nps_score', { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          setError(error.message)
          setData([])
        } else {
          setError(null)
          setData((data ?? []) as NPSResposta[])
        }
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [filters.tipo, filters.classificacao, filters.mentor, filters.search, filters.limit])

  return { data, loading, error }
}
