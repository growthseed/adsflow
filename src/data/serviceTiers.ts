/**
 * ============================================
 * CLIENT SERVICE TIER DEFINITIONS — AdFlow v4
 * ============================================
 * These tiers are NOT a SaaS subscription model.
 * They are the service levels defined in each Efeito Digital ×
 * cliente contract. Each client of Efeito Digital is assigned
 * one tier that determines which AdFlow features they see.
 *
 * Internal team (Efeito agency users) always see everything;
 * tier gating only applies to the client-facing portal view.
 * ============================================
 */

import type { ClientServiceTierConfig, KPISource } from '@/types/metrics'

const ALL_CHANNELS: KPISource[] = [
  'meta_ads',
  'google_ads',
  'ga4',
  'gsc',
  'youtube',
  'gmb',
  'kommo',
  'clickup',
  'linkedin_ads',
  'tiktok_ads',
  'ecommerce',
]

export const SERVICE_TIERS: Record<string, ClientServiceTierConfig> = {
  basic: {
    tier: 'basic',
    name: 'Basic',
    max_channels: 2,
    channels_allowed: ['meta_ads', 'google_ads'],
    planner: {
      max_flows: 3,
      templates: true,
      client_comments: false,
      versioning: false,
    },
    projeto: {
      enabled: false,
      read_only: true,
      client_comments: false,
      custom_workflows: false,
    },
    ai: {
      insights_frequency: 'never',
      mcp_local: false,
      custom_skills: false,
    },
    history_days: 30,
    reports: {
      pdf_branded: false,
      white_label: false,
      frequency: 'monthly',
      alerts_channels: [],
    },
  },

  pro: {
    tier: 'pro',
    name: 'Pro',
    max_channels: 6,
    channels_allowed: ['meta_ads', 'google_ads', 'ga4', 'gsc', 'youtube', 'gmb'],
    planner: {
      max_flows: -1, // unlimited
      templates: true,
      client_comments: true,
      versioning: false,
    },
    projeto: {
      enabled: true,
      read_only: true,
      client_comments: false,
      custom_workflows: false,
    },
    ai: {
      insights_frequency: 'monthly',
      mcp_local: false,
      custom_skills: false,
    },
    history_days: 180,
    reports: {
      pdf_branded: true,
      white_label: false,
      frequency: 'weekly',
      alerts_channels: ['email'],
    },
  },

  black: {
    tier: 'black',
    name: 'Black',
    max_channels: 11,
    channels_allowed: ALL_CHANNELS,
    planner: {
      max_flows: -1,
      templates: true,
      client_comments: true,
      versioning: true,
    },
    projeto: {
      enabled: true,
      read_only: false,
      client_comments: true,
      custom_workflows: false,
    },
    ai: {
      insights_frequency: 'weekly',
      mcp_local: false,
      custom_skills: false,
    },
    history_days: 730, // 2 years
    reports: {
      pdf_branded: true,
      white_label: true,
      frequency: 'daily',
      alerts_channels: ['email', 'telegram'],
    },
  },

  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    max_channels: -1, // unlimited
    channels_allowed: ALL_CHANNELS,
    planner: {
      max_flows: -1,
      templates: true,
      client_comments: true,
      versioning: true,
    },
    projeto: {
      enabled: true,
      read_only: false,
      client_comments: true,
      custom_workflows: true,
    },
    ai: {
      insights_frequency: 'daily',
      mcp_local: true, // ⭐ Enterprise moat — MCP local incluso
      custom_skills: true,
    },
    history_days: null, // unlimited
    reports: {
      pdf_branded: true,
      white_label: true,
      frequency: 'on_demand',
      alerts_channels: ['email', 'telegram', 'slack', 'webhook'],
    },
  },
}

/**
 * Check if a given tier has access to a specific feature.
 * Use this in components to conditionally render tier-gated UI.
 */
export function tierHasChannel(
  tier: keyof typeof SERVICE_TIERS,
  channel: KPISource,
): boolean {
  const config = SERVICE_TIERS[tier]
  if (!config) return false
  if (config.max_channels === -1) return true
  return config.channels_allowed.includes(channel)
}

export function tierHasFeature(
  tier: keyof typeof SERVICE_TIERS,
  feature: 'projeto' | 'ai_insights' | 'mcp_local' | 'white_label',
): boolean {
  const config = SERVICE_TIERS[tier]
  if (!config) return false
  switch (feature) {
    case 'projeto':
      return config.projeto.enabled
    case 'ai_insights':
      return config.ai.insights_frequency !== 'never'
    case 'mcp_local':
      return config.ai.mcp_local
    case 'white_label':
      return config.reports.white_label
    default:
      return false
  }
}
