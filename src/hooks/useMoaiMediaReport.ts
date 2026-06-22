import { useCallback, useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

export type MediaRow = Record<string, unknown>

interface MediaReportState {
  campaignRows: MediaRow[]
  adRows: MediaRow[]
  loading: boolean
  error: string | null
  source: string
  refetch: () => Promise<void>
}

async function readTable(table: string, limit = 5000) {
  const { data, error } = await supabase.from(table).select('*').limit(limit)
  if (error) throw error
  return (data ?? []) as MediaRow[]
}

export function useMoaiMediaReport(): MediaReportState {
  const [campaignRows, setCampaignRows] = useState<MediaRow[]>([])
  const [adRows, setAdRows] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState('Supabase')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [campaigns, ads] = await Promise.all([
        readTable('moai_meta_campaign_daily'),
        readTable('moai_meta_ads_daily'),
      ])
      setCampaignRows(campaigns)
      setAdRows(ads)
      setSource('Meta Ads daily mart')
    } catch (primaryError) {
      try {
        const rows = await readTable('moai_paid_media_daily')
        setCampaignRows(rows)
        setAdRows(rows.filter((row) => row.ad_id))
        setSource('MOAI paid media mart')
      } catch {
        try {
          const rows = await readTable('vw_moai_paid_media_summary')
          setCampaignRows(rows)
          setAdRows([])
          setSource('MOAI media summary')
        } catch {
          setCampaignRows([])
          setAdRows([])
          setError(primaryError instanceof Error ? primaryError.message : 'Nao foi possivel carregar a midia.')
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refetch() }, [refetch])

  return { campaignRows, adRows, loading, error, source, refetch }
}
