export type OnboardingStepKey = 'basic' | 'integrations' | 'goals' | 'team' | 'review'

export const ONBOARDING_STEPS: { key: OnboardingStepKey; label: string }[] = [
  { key: 'basic',        label: 'Básico' },
  { key: 'integrations', label: 'Integrações' },
  { key: 'goals',        label: 'Metas' },
  { key: 'team',         label: 'Equipe' },
  { key: 'review',       label: 'Revisão' },
]

export interface OnboardingBasic {
  name: string
  industry: string
  monthlyBudget: number | null
  managerUserId: string | null
  clientSlug: string
}

export type IntegrationStatus = 'not_connected' | 'connecting' | 'connected' | 'error' | 'token_expired'

export interface OnboardingIntegration {
  key: 'meta_ads' | 'google_ads' | 'whatsapp' | 'rd_station' | 'tiktok_ads' | 'ga4'
  label: string
  description: string
  logoBg: string
  logoInitial: string
  required: boolean
  status: IntegrationStatus
  accountsConnected: number
  syncProgressLabel?: string
}

export interface OnboardingGoal {
  id: string
  metric: 'leads' | 'cpl' | 'roas' | 'sales' | 'ctr' | 'spend'
  label: string
  targetValue: number
  distribution: 'linear' | 'seasonal' | 'monthly_avg'
}

export interface OnboardingTeamInvite {
  email: string
  role: 'owner' | 'manager' | 'admin' | 'analyst' | 'viewer'
}

export interface OnboardingState {
  basic: OnboardingBasic
  integrations: OnboardingIntegration[]
  goals: OnboardingGoal[]
  team: OnboardingTeamInvite[]
  currentStep: OnboardingStepKey
  completedSteps: OnboardingStepKey[]
}
