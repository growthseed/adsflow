import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { DEFAULT_PORTAL_CONFIG, type PortalConfig } from '../types'

interface Row {
  client_id: string
  show_summary: boolean
  show_kpis: boolean
  show_goals: boolean
  show_timeline: boolean
  show_next_call: boolean
  show_files: boolean
  show_creatives: boolean
  show_chat: boolean
  welcome_message: string | null
  whatsapp_url: string | null
}

function toConfig(row: Row | null, clientId: string): PortalConfig {
  if (!row) return { clientId, ...DEFAULT_PORTAL_CONFIG }
  return {
    clientId,
    showSummary: row.show_summary,
    showKpis: row.show_kpis,
    showGoals: row.show_goals,
    showTimeline: row.show_timeline,
    showNextCall: row.show_next_call,
    showFiles: row.show_files,
    showCreatives: row.show_creatives,
    showChat: row.show_chat,
    welcomeMessage: row.welcome_message,
    whatsappUrl: row.whatsapp_url,
  }
}

/**
 * Lê portal_config pro clientId. Enquanto a row não existe retorna
 * defaults — o Portal funciona mesmo antes do gestor customizar.
 */
export function usePortalConfig(clientId: string | null | undefined) {
  const [config, setConfig] = useState<PortalConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setConfig(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('portal_config')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setConfig(toConfig((data as Row | null) ?? null, clientId))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  return { config, loading }
}
