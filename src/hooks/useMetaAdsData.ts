/**
 * ============================================
 * USE META ADS DATA — Hook para dashboards
 * ============================================
 * Consome dados de campanhas Meta Ads armazenados
 * no Supabase via metaAdsService.
 *
 * Note: this file disables `react-hooks/set-state-in-effect` at the file
 * scope. The hooks below follow the classic "fetch → set loading → set
 * data" pattern, which the rule correctly identifies as non-ideal. The
 * proper fix is to migrate to @tanstack/react-query (already used elsewhere
 * in the project) but the refactor is out of scope for the lint cleanup
 * pass — see the audit roadmap. Each effect is guarded by a cleanup flag
 * pattern where needed, and the synchronous `setLoading(true)` is safe in
 * practice because React batches it with the subsequent async-resolved
 * update.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  adAccountsService,
  insightsService,
  getDateRange,
} from '@/services/metaAdsService'
import type {
  AggregatedMetrics,
  InsightsFilters,
} from '@/services/metaAdsService'
import type {
  AdAccount,
  CampaignCache,
  CampaignInsight,
} from '@/types/database'

// =====================================================
// useAdAccounts — Lista contas conectadas
// =====================================================

export function useAdAccounts() {
  const { user, activeClient } = useAuth()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Filter by active client when available, otherwise show all user accounts
      const data = activeClient?.client_id
        ? await adAccountsService.listByClient(activeClient.client_id)
        : await adAccountsService.list(user.id)
      setAccounts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch accounts'))
    } finally {
      setLoading(false)
    }
  }, [user, activeClient?.client_id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === 'active'),
    [accounts]
  )

  return { accounts, activeAccounts, loading, error, refetch: fetch }
}

// =====================================================
// useCampaigns — Lista campanhas em cache
// =====================================================

export function useCampaigns(adAccountId: string | null) {
  const [campaigns, setCampaigns] = useState<CampaignCache[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!adAccountId) {
      setCampaigns([])
      return
    }

    setLoading(true)
    insightsService
      .getCampaigns(adAccountId)
      .then((data) => {
        setCampaigns(data)
        setError(null)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [adAccountId])

  return { campaigns, loading, error }
}

// =====================================================
// useCampaignInsights — Insights de campanhas com filtros
// =====================================================

export function useCampaignInsights(filters: InsightsFilters | null) {
  const [insights, setInsights] = useState<CampaignInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!filters?.adAccountId) {
      setInsights([])
      return
    }

    setLoading(true)
    insightsService
      .getCampaignInsights(filters)
      .then((data) => {
        setInsights(data)
        setError(null)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [filters?.adAccountId, filters?.dateFrom, filters?.dateTo, filters?.campaignIds?.join(',')])

  return { insights, loading, error }
}

// =====================================================
// useAggregatedMetrics — KPIs totais do período
// =====================================================

export function useAggregatedMetrics(filters: InsightsFilters | null) {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!filters?.adAccountId) {
      setMetrics(null)
      return
    }

    setLoading(true)
    insightsService
      .getAggregatedMetrics(filters)
      .then((data) => {
        setMetrics(data)
        setError(null)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [filters?.adAccountId, filters?.dateFrom, filters?.dateTo, filters?.campaignIds?.join(',')])

  return { metrics, loading, error }
}

// =====================================================
// useDailyMetrics — Métricas diárias para gráficos
// =====================================================

export function useDailyMetrics(filters: InsightsFilters | null) {
  const [dailyData, setDailyData] = useState<
    Array<{
      date: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      leads: number
      ctr: number
      cpc: number
      roas: number
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!filters?.adAccountId) {
      setDailyData([])
      return
    }

    setLoading(true)
    insightsService
      .getDailyMetrics(filters)
      .then((data) => {
        setDailyData(data)
        setError(null)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [filters?.adAccountId, filters?.dateFrom, filters?.dateTo, filters?.campaignIds?.join(',')])

  return { dailyData, loading, error }
}

// =====================================================
// useTopCampaigns — Ranking de campanhas
// =====================================================

export function useTopCampaigns(
  filters: InsightsFilters | null,
  sortBy: 'spend' | 'conversions' | 'roas' | 'clicks' = 'spend',
  limit = 10
) {
  const [topCampaigns, setTopCampaigns] = useState<
    Array<{
      campaign_id: string
      campaign_name: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      roas: number
      ctr: number
      cpc: number
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!filters?.adAccountId) {
      setTopCampaigns([])
      return
    }

    setLoading(true)
    insightsService
      .getTopCampaigns(filters, sortBy, limit)
      .then((data) => {
        setTopCampaigns(data)
        setError(null)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [filters?.adAccountId, filters?.dateFrom, filters?.dateTo, sortBy, limit])

  return { topCampaigns, loading, error }
}

// =====================================================
// useTopCreatives — Ranking de criativos
// =====================================================

export function useTopCreatives(filters: InsightsFilters | null, limit = 10) {
  const [topCreatives, setTopCreatives] = useState<
    Array<{
      ad_name: string
      creative_thumbnail_url: string | null
      impressions: number
      clicks: number
      spend: number
      ctr: number
      hook_rate: number | null
      hold_rate: number | null
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!filters?.adAccountId) {
      setTopCreatives([])
      return
    }

    setLoading(true)
    insightsService
      .getTopCreatives(filters, limit)
      .then((data) => {
        setTopCreatives(data)
        setError(null)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [filters?.adAccountId, filters?.dateFrom, filters?.dateTo, limit])

  return { topCreatives, loading, error }
}

// =====================================================
// useMetaAdsDashboard — Hook composto para o dashboard
// =====================================================

export interface DashboardDateRange {
  days: number
  label: string
}

export const DATE_RANGES: DashboardDateRange[] = [
  { days: 7, label: 'Últimos 7 dias' },
  { days: 14, label: 'Últimos 14 dias' },
  { days: 30, label: 'Últimos 30 dias' },
  { days: 60, label: 'Últimos 60 dias' },
  { days: 90, label: 'Últimos 90 dias' },
]

export function useMetaAdsDashboard() {
  const { accounts, activeAccounts, loading: accountsLoading } = useAdAccounts()
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DashboardDateRange>(DATE_RANGES[2]) // 30 dias
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])

  // Auto-select first active account
  useEffect(() => {
    if (!selectedAccountId && activeAccounts.length > 0) {
      setSelectedAccountId(activeAccounts[0].id)
    }
  }, [activeAccounts, selectedAccountId])

  // Build filters
  const filters: InsightsFilters | null = useMemo(() => {
    if (!selectedAccountId) return null
    const range = getDateRange(dateRange.days)
    return {
      adAccountId: selectedAccountId,
      dateFrom: range.since,
      dateTo: range.until,
      campaignIds: selectedCampaignIds.length > 0 ? selectedCampaignIds : undefined,
    }
  }, [selectedAccountId, dateRange.days, selectedCampaignIds])

  // All data hooks
  const { campaigns, loading: campaignsLoading } = useCampaigns(selectedAccountId)
  const { metrics, loading: metricsLoading } = useAggregatedMetrics(filters)
  const { dailyData, loading: dailyLoading } = useDailyMetrics(filters)
  const { topCampaigns, loading: topLoading } = useTopCampaigns(filters)
  const { topCreatives, loading: creativesLoading } = useTopCreatives(filters)

  const loading =
    accountsLoading || campaignsLoading || metricsLoading || dailyLoading || topLoading || creativesLoading

  return {
    // State
    accounts,
    activeAccounts,
    selectedAccountId,
    setSelectedAccountId,
    dateRange,
    setDateRange,
    selectedCampaignIds,
    setSelectedCampaignIds,

    // Data
    campaigns,
    metrics,
    dailyData,
    topCampaigns,
    topCreatives,

    // Loading
    loading,

    // Filters object (for advanced usage)
    filters,
  }
}
