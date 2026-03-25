export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // =====================================================
      // WORKSPACES
      // =====================================================
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // STRATEGY FLOWS
      // =====================================================
      strategy_flows: {
        Row: {
          id: string
          workspace_id: string
          project_id: string | null
          name: string
          description: string | null
          client_name: string
          phase: number
          meta: Json
          flow_data: Json
          kpis: Json
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id?: string | null
          name: string
          description?: string | null
          client_name: string
          phase?: number
          meta?: Json
          flow_data?: Json
          kpis?: Json
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          project_id?: string | null
          name?: string
          description?: string | null
          client_name?: string
          phase?: number
          meta?: Json
          flow_data?: Json
          kpis?: Json
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // AD ACCOUNTS — Contas de anúncios conectadas
      // =====================================================
      ad_accounts: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          platform: 'meta_ads' | 'google_ads'
          account_id: string          // ex: act_433655990500782
          account_name: string
          access_token: string | null  // token criptografado
          refresh_token: string | null
          token_expires_at: string | null
          currency: string
          timezone: string | null
          status: 'active' | 'paused' | 'disconnected' | 'error'
          last_sync_at: string | null
          sync_error: string | null
          metadata: Json               // dados extras da conta
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          platform: 'meta_ads' | 'google_ads'
          account_id: string
          account_name: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          currency?: string
          timezone?: string | null
          status?: 'active' | 'paused' | 'disconnected' | 'error'
          last_sync_at?: string | null
          sync_error?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          platform?: 'meta_ads' | 'google_ads'
          account_id?: string
          account_name?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          currency?: string
          timezone?: string | null
          status?: 'active' | 'paused' | 'disconnected' | 'error'
          last_sync_at?: string | null
          sync_error?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // CAMPAIGNS CACHE — Cache de campanhas sincronizadas
      // =====================================================
      campaigns_cache: {
        Row: {
          id: string
          ad_account_id: string        // FK → ad_accounts.id
          platform_campaign_id: string  // ID na plataforma (Meta/Google)
          name: string
          objective: string | null
          status: string
          daily_budget: number | null
          lifetime_budget: number | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ad_account_id: string
          platform_campaign_id: string
          name: string
          objective?: string | null
          status?: string
          daily_budget?: number | null
          lifetime_budget?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ad_account_id?: string
          platform_campaign_id?: string
          name?: string
          objective?: string | null
          status?: string
          daily_budget?: number | null
          lifetime_budget?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // CAMPAIGN INSIGHTS — Métricas diárias por campanha
      // =====================================================
      campaign_insights: {
        Row: {
          id: string
          ad_account_id: string
          campaign_id: string          // FK → campaigns_cache.id
          platform_campaign_id: string
          date: string                 // YYYY-MM-DD
          impressions: number
          reach: number
          clicks: number
          spend: number
          ctr: number
          cpc: number
          cpm: number
          conversions: number
          conversion_value: number
          cost_per_conversion: number
          roas: number
          frequency: number
          // Engajamento
          engagement: number
          post_reactions: number
          post_comments: number
          post_shares: number
          // Video
          video_views: number
          video_thruplay: number
          // Leads
          leads: number
          cost_per_lead: number
          // Metadata
          breakdown: Json | null       // age, gender, placement, etc.
          raw_data: Json | null        // dados brutos da API
          created_at: string
        }
        Insert: {
          id?: string
          ad_account_id: string
          campaign_id: string
          platform_campaign_id: string
          date: string
          impressions?: number
          reach?: number
          clicks?: number
          spend?: number
          ctr?: number
          cpc?: number
          cpm?: number
          conversions?: number
          conversion_value?: number
          cost_per_conversion?: number
          roas?: number
          frequency?: number
          engagement?: number
          post_reactions?: number
          post_comments?: number
          post_shares?: number
          video_views?: number
          video_thruplay?: number
          leads?: number
          cost_per_lead?: number
          breakdown?: Json | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          ad_account_id?: string
          campaign_id?: string
          platform_campaign_id?: string
          date?: string
          impressions?: number
          reach?: number
          clicks?: number
          spend?: number
          ctr?: number
          cpc?: number
          cpm?: number
          conversions?: number
          conversion_value?: number
          cost_per_conversion?: number
          roas?: number
          frequency?: number
          engagement?: number
          post_reactions?: number
          post_comments?: number
          post_shares?: number
          video_views?: number
          video_thruplay?: number
          leads?: number
          cost_per_lead?: number
          breakdown?: Json | null
          raw_data?: Json | null
          created_at?: string
        }
      }

      // =====================================================
      // ADSET INSIGHTS — Métricas por conjunto de anúncios
      // =====================================================
      adset_insights: {
        Row: {
          id: string
          ad_account_id: string
          campaign_id: string
          platform_adset_id: string
          adset_name: string
          date: string
          impressions: number
          reach: number
          clicks: number
          spend: number
          ctr: number
          cpc: number
          cpm: number
          conversions: number
          cost_per_conversion: number
          roas: number
          leads: number
          cost_per_lead: number
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          ad_account_id: string
          campaign_id: string
          platform_adset_id: string
          adset_name: string
          date: string
          impressions?: number
          reach?: number
          clicks?: number
          spend?: number
          ctr?: number
          cpc?: number
          cpm?: number
          conversions?: number
          cost_per_conversion?: number
          roas?: number
          leads?: number
          cost_per_lead?: number
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          ad_account_id?: string
          campaign_id?: string
          platform_adset_id?: string
          adset_name?: string
          date?: string
          impressions?: number
          reach?: number
          clicks?: number
          spend?: number
          ctr?: number
          cpc?: number
          cpm?: number
          conversions?: number
          cost_per_conversion?: number
          roas?: number
          leads?: number
          cost_per_lead?: number
          raw_data?: Json | null
          created_at?: string
        }
      }

      // =====================================================
      // AD INSIGHTS — Métricas por anúncio individual
      // =====================================================
      ad_insights: {
        Row: {
          id: string
          ad_account_id: string
          campaign_id: string
          platform_adset_id: string
          platform_ad_id: string
          ad_name: string
          date: string
          impressions: number
          reach: number
          clicks: number
          spend: number
          ctr: number
          cpc: number
          cpm: number
          conversions: number
          cost_per_conversion: number
          roas: number
          // Criativos
          hook_rate: number | null    // 3s views / impressions
          hold_rate: number | null    // 75% views / impressions
          // Engajamento
          engagement: number
          post_reactions: number
          post_comments: number
          post_shares: number
          post_saves: number
          // Video
          video_views: number
          video_thruplay: number
          video_p25: number
          video_p50: number
          video_p75: number
          video_p100: number
          // Creative info
          creative_id: string | null
          creative_thumbnail_url: string | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          ad_account_id: string
          campaign_id: string
          platform_adset_id: string
          platform_ad_id: string
          ad_name: string
          date: string
          impressions?: number
          reach?: number
          clicks?: number
          spend?: number
          ctr?: number
          cpc?: number
          cpm?: number
          conversions?: number
          cost_per_conversion?: number
          roas?: number
          hook_rate?: number | null
          hold_rate?: number | null
          engagement?: number
          post_reactions?: number
          post_comments?: number
          post_shares?: number
          post_saves?: number
          video_views?: number
          video_thruplay?: number
          video_p25?: number
          video_p50?: number
          video_p75?: number
          video_p100?: number
          creative_id?: string | null
          creative_thumbnail_url?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          ad_account_id?: string
          campaign_id?: string
          platform_adset_id?: string
          platform_ad_id?: string
          ad_name?: string
          date?: string
          impressions?: number
          reach?: number
          clicks?: number
          spend?: number
          ctr?: number
          cpc?: number
          cpm?: number
          conversions?: number
          cost_per_conversion?: number
          roas?: number
          hook_rate?: number | null
          hold_rate?: number | null
          engagement?: number
          post_reactions?: number
          post_comments?: number
          post_shares?: number
          post_saves?: number
          video_views?: number
          video_thruplay?: number
          video_p25?: number
          video_p50?: number
          video_p75?: number
          video_p100?: number
          creative_id?: string | null
          creative_thumbnail_url?: string | null
          raw_data?: Json | null
          created_at?: string
        }
      }

      // =====================================================
      // SYNC LOGS — Log de sincronizações
      // =====================================================
      sync_logs: {
        Row: {
          id: string
          ad_account_id: string
          sync_type: 'full' | 'incremental' | 'manual'
          status: 'started' | 'completed' | 'failed'
          campaigns_synced: number
          adsets_synced: number
          ads_synced: number
          insights_synced: number
          date_range_start: string | null
          date_range_end: string | null
          error_message: string | null
          duration_ms: number | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          ad_account_id: string
          sync_type: 'full' | 'incremental' | 'manual'
          status?: 'started' | 'completed' | 'failed'
          campaigns_synced?: number
          adsets_synced?: number
          ads_synced?: number
          insights_synced?: number
          date_range_start?: string | null
          date_range_end?: string | null
          error_message?: string | null
          duration_ms?: number | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          ad_account_id?: string
          sync_type?: 'full' | 'incremental' | 'manual'
          status?: 'started' | 'completed' | 'failed'
          campaigns_synced?: number
          adsets_synced?: number
          ads_synced?: number
          insights_synced?: number
          date_range_start?: string | null
          date_range_end?: string | null
          error_message?: string | null
          duration_ms?: number | null
          started_at?: string
          completed_at?: string | null
        }
      }
    }
  }
}

// =====================================================
// HELPER TYPES (derivados do Database)
// =====================================================

export type AdAccount = Database['public']['Tables']['ad_accounts']['Row']
export type AdAccountInsert = Database['public']['Tables']['ad_accounts']['Insert']
export type CampaignCache = Database['public']['Tables']['campaigns_cache']['Row']
export type CampaignInsight = Database['public']['Tables']['campaign_insights']['Row']
export type AdsetInsight = Database['public']['Tables']['adset_insights']['Row']
export type AdInsight = Database['public']['Tables']['ad_insights']['Row']
export type SyncLog = Database['public']['Tables']['sync_logs']['Row']
