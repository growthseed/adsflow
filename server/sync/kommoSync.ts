/**
 * ============================================
 * KOMMO SYNC - B2B GROWTH ETL
 * ============================================
 * Sincroniza Leads e Pipelines do Kommo com a tabela `crm_deals` no Ad Flow.
 * Extrai campos customizados, tags, valor, e mapeia estágios (MQL, SQL, Won).
 */

import { createClient } from '@supabase/supabase-js'
import { normalizeSubdomain } from '../kommo/oauth-callback' // helper existente

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function syncKommoDeals(clientId: string) {
  // 1. Fetch Kommo credentials from database
  const { data: config, error: configError } = await supabaseAdmin
    .from('kommo_configs')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (configError || !config) {
    throw new Error(`Kommo config not found for client: ${clientId}`)
  }

  const { access_token, subdomain } = config
  const apiDomain = normalizeSubdomain(subdomain)

  // 2. Fetch Deals from Kommo API
  // Using the /api/v4/leads endpoint. We also embed tags and contacts.
  const response = await fetch(`https://${apiDomain}/api/v4/leads?with=tags,contacts`, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Kommo API error: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  const leads = data._embedded?.leads || []

  // 3. Transform and Upsert to crm_deals
  const dealsToUpsert = leads.map((lead: any) => {
    // Map status_id to Growth Stages (Simplified mock logic - in real world, map via user config)
    // 142 = Won, 143 = Lost. Others depend on the pipeline.
    const isWon = lead.status_id === 142
    const isLost = lead.status_id === 143
    const isSql = !isWon && !isLost && lead.price > 0 // Heuristics for demo
    const isMql = !isWon && !isLost && !isSql

    // Extract tracking params from custom fields (if set up in Kommo)
    // Custom field IDs depend on the account, so we simulate extraction here
    let adflow_id = null, fbclid = null, gclid = null, utm_source = null;
    
    if (lead.custom_fields_values) {
      for (const field of lead.custom_fields_values) {
        if (field.field_name.toLowerCase() === 'adflow_id') adflow_id = field.values[0].value;
        if (field.field_name.toLowerCase() === 'fbclid') fbclid = field.values[0].value;
        if (field.field_name.toLowerCase() === 'gclid') gclid = field.values[0].value;
        if (field.field_name.toLowerCase() === 'utm_source') utm_source = field.values[0].value;
      }
    }

    const tags = lead._embedded?.tags?.map((t: any) => t.name) || []

    return {
      client_id: clientId,
      integration_source: 'kommo',
      external_deal_id: String(lead.id),
      external_contact_id: lead._embedded?.contacts?.[0]?.id ? String(lead._embedded.contacts[0].id) : null,
      
      stage_name: `Status ${lead.status_id}`,
      is_mql: isMql,
      is_sql: isSql,
      is_won: isWon,
      is_lost: isLost,
      
      value: lead.price || 0,
      currency: 'BRL', // default
      
      adflow_id,
      fbclid,
      gclid,
      utm_source,
      
      tags,
      custom_fields: lead.custom_fields_values || null,
      
      created_at: new Date(lead.created_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      
      // Timestamp logic based on stage
      won_at: isWon ? new Date(lead.updated_at * 1000).toISOString() : null,
      lost_at: isLost ? new Date(lead.updated_at * 1000).toISOString() : null
    }
  })

  if (dealsToUpsert.length === 0) return { upserted: 0 }

  // 4. Batch Upsert to Supabase
  const { data: upsertedData, error: upsertError } = await supabaseAdmin
    .from('crm_deals')
    .upsert(dealsToUpsert, { onConflict: 'integration_source, external_deal_id' })
    .select('id')

  if (upsertError) {
    throw new Error(`Supabase Upsert error: ${upsertError.message}`)
  }

  return {
    upserted: upsertedData?.length || 0
  }
}
