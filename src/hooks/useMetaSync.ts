import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface MetaCampaignData {
  id: string
  name: string
  objective: string
  status: string
  lifetime_budget?: string
  daily_budget?: string
  budget_remaining?: string
  created_time?: string
  updated_time?: string
}

interface MetaAdSetData {
  id: string
  name: string
  status: string
  optimization_goal: string
  billing_event: string
  campaign_id?: string
}

interface MetaAdData {
  id: string
  name: string
  status: string
  adset_id?: string
  campaign_id?: string
  creative: { id: string }
}

interface SyncResult {
  success: boolean
  flowId?: string
  data?: any
  error?: string
}

export function useMetaSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Transformar dados Meta para formato AdFlow
  const transformToAdFlow = (
    campaign: MetaCampaignData,
    adSets: MetaAdSetData[],
    ads: MetaAdData[],
    accountId: string
  ) => {
    const nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> }> = []
    const edges: Array<{ id: string; source: string; target: string; type: string }> = []
    
    // 1. Campaign Node
    const campaignNode = {
      id: `campaign-${campaign.id}`,
      type: 'campaign',
      position: { x: 250, y: 150 },
      data: {
        label: campaign.name,
        icon: 'meta',
        color: '#1877F2',
        platform: 'meta',
        objective: campaign.objective,
        status: campaign.status,
        budget: {
          lifetime: campaign.lifetime_budget 
            ? parseFloat(campaign.lifetime_budget) / 100 
            : undefined,
          daily: campaign.daily_budget 
            ? parseFloat(campaign.daily_budget) / 100 
            : undefined,
          remaining: campaign.budget_remaining 
            ? parseFloat(campaign.budget_remaining) / 100 
            : undefined,
          currency: 'BRL'
        },
        connections: {
          meta_campaign_id: campaign.id,
          meta_account_id: accountId,
        },
        approval_status: campaign.status === 'ACTIVE' ? 'approved' : 'pending',
        created_at: campaign.created_time,
        updated_at: campaign.updated_time
      }
    }
    nodes.push(campaignNode)

    // 2. Ad Set Nodes
    adSets.forEach((adSet, index) => {
      const adSetNode = {
        id: `adset-${adSet.id}`,
        type: 'ad_set',
        position: { x: 250, y: 350 + (index * 200) },
        data: {
          label: adSet.name,
          icon: 'target',
          color: '#4CAF50',
          platform: 'meta',
          status: adSet.status,
          optimization_goal: adSet.optimization_goal,
          billing_event: adSet.billing_event,
          connections: {
            meta_adset_id: adSet.id,
            meta_campaign_id: campaign.id
          },
          approval_status: adSet.status === 'ACTIVE' ? 'approved' : 'pending'
        }
      }
      nodes.push(adSetNode)

      // Edge: Campaign → Ad Set
      edges.push({
        id: `edge-campaign-adset-${index}`,
        source: `campaign-${campaign.id}`,
        target: `adset-${adSet.id}`,
        type: 'smoothstep'
      })
    })

    // 3. Ad Nodes (agrupar por ad set)
    const adsByAdSet = new Map<string, MetaAdData[]>()
    ads.forEach(ad => {
      const adSetId = ad.adset_id || ad.campaign_id || 'unknown'
      if (!adsByAdSet.has(adSetId)) {
        adsByAdSet.set(adSetId, [])
      }
      adsByAdSet.get(adSetId)!.push(ad)
    })

    let globalAdIndex = 0
    adSets.forEach(adSet => {
      const adSetAds = adsByAdSet.get(adSet.id) || []
      
      adSetAds.forEach((ad, localIndex) => {
        const xOffset = localIndex * 250
        const baseX = 100 + xOffset
        
        const adNode = {
          id: `ad-${ad.id}`,
          type: 'ad',
          position: { 
            x: baseX, 
            y: 550 + (globalAdIndex * 200) 
          },
          data: {
            label: ad.name,
            icon: 'image',
            color: '#FF5722',
            platform: 'meta',
            status: ad.status,
            connections: {
              meta_ad_id: ad.id,
              meta_adset_id: adSet.id,
              meta_creative_id: ad.creative.id
            },
            approval_status: ad.status === 'ACTIVE' ? 'approved' : 'pending'
          }
        }
        nodes.push(adNode)

        // Edge: Ad Set → Ad
        edges.push({
          id: `edge-adset-ad-${globalAdIndex}`,
          source: `adset-${adSet.id}`,
          target: `ad-${ad.id}`,
          type: 'smoothstep'
        })
      })
      
      if (adSetAds.length > 0) {
        globalAdIndex++
      }
    })

    return {
      name: `[META SYNC] ${campaign.name}`,
      description: `Campanha sincronizada do Meta Ads - ${campaign.objective}`,
      is_template: false,
      tags: ['meta-ads', 'synced', campaign.status.toLowerCase()],
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 0.8 }
    }
  }

  // Função principal de sincronização
  const syncCampaign = async (
    accountId: string,
    campaignId: string,
    campaignData?: MetaCampaignData,
    adSetsData?: MetaAdSetData[],
    adsData?: MetaAdData[]
  ): Promise<SyncResult> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Sincronizando campanha do Meta Ads...')
      console.log('📊 Account:', accountId)
      console.log('📊 Campaign:', campaignId)

      // Se os dados foram fornecidos, usar eles
      // Caso contrário, você precisará integrar com o Meta Ads MCP
      
      if (!campaignData || !adSetsData || !adsData) {
        throw new Error('Dados da campanha não fornecidos. Integre com Meta Ads MCP.')
      }

      // Transformar para AdFlow
      const flowData = transformToAdFlow(campaignData, adSetsData, adsData, accountId)

      // Salvar no Supabase
      const { data, error: saveError } = await supabase
        .from('flows')
        .insert(flowData)
        .select()
        .single()

      if (saveError) throw saveError

      console.log('✅ Flow criado:', data.id)
      
      setIsLoading(false)
      return { 
        success: true, 
        flowId: data.id, 
        data 
      }

    } catch (err) {
      const error = err as Error
      setError(error)
      setIsLoading(false)
      console.error('❌ Erro na sincronização:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  }

  // Função auxiliar para buscar dados do Meta via MCP
  // Esta função será chamada pelo componente que tem acesso ao MCP
  const prepareSyncData = (
    campaign: any,
    adSets: any[],
    ads: any[]
  ) => {
    // Normalizar os dados do MCP para o formato esperado
    const normalizedCampaign: MetaCampaignData = {
      id: campaign.id,
      name: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      lifetime_budget: campaign.lifetime_budget,
      daily_budget: campaign.daily_budget,
      budget_remaining: campaign.budget_remaining,
      created_time: campaign.created_time,
      updated_time: campaign.updated_time
    }

    const normalizedAdSets: MetaAdSetData[] = adSets.map(adSet => ({
      id: adSet.id,
      name: adSet.name,
      status: adSet.status,
      optimization_goal: adSet.optimization_goal,
      billing_event: adSet.billing_event,
      campaign_id: campaign.id
    }))

    const normalizedAds: MetaAdData[] = ads.map(ad => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      adset_id: ad.adset_id,
      campaign_id: ad.campaign_id,
      creative: { id: ad.creative?.id || '' }
    }))

    return {
      campaign: normalizedCampaign,
      adSets: normalizedAdSets,
      ads: normalizedAds
    }
  }

  return {
    syncCampaign,
    prepareSyncData,
    isLoading,
    error
  }
}
