import { useReducer } from 'react'

import { ONBOARDING_STEPS, type OnboardingGoal, type OnboardingState, type OnboardingStepKey, type OnboardingTeamInvite } from './types'

type Action =
  | { type: 'setBasic'; patch: Partial<OnboardingState['basic']> }
  | { type: 'setIntegrationStatus'; key: string; status: OnboardingState['integrations'][number]['status']; accountsConnected?: number; syncProgressLabel?: string }
  | { type: 'addGoal' }
  | { type: 'patchGoal'; id: string; patch: Partial<OnboardingGoal> }
  | { type: 'removeGoal'; id: string }
  | { type: 'setGoals'; goals: OnboardingGoal[] }
  | { type: 'addTeamInvite'; invite: OnboardingTeamInvite }
  | { type: 'removeTeamInvite'; email: string }
  | { type: 'goStep'; step: OnboardingStepKey }
  | { type: 'completeStep'; step: OnboardingStepKey }

function initialState(): OnboardingState {
  return {
    basic: {
      name: '',
      industry: '',
      monthlyBudget: null,
      managerUserId: null,
      clientSlug: '',
    },
    integrations: [
      { key: 'meta_ads', label: 'Meta Ads', description: 'Facebook e Instagram Ads', logoBg: 'linear-gradient(135deg,#1877f2,#0b5fda)', logoInitial: 'f', required: true,  status: 'not_connected', accountsConnected: 0 },
      { key: 'google_ads', label: 'Google Ads', description: 'Pesquisa, Display, YouTube, PMAX', logoBg: '#34a853', logoInitial: 'G', required: true, status: 'not_connected', accountsConnected: 0 },
      { key: 'whatsapp', label: 'WhatsApp Business', description: 'API cloud · leads entrando', logoBg: '#25d366', logoInitial: 'W', required: false, status: 'not_connected', accountsConnected: 0 },
      { key: 'rd_station', label: 'RD Station CRM', description: 'Conectar para atribuir vendas', logoBg: '#ff6900', logoInitial: 'R', required: false, status: 'not_connected', accountsConnected: 0 },
      { key: 'tiktok_ads', label: 'TikTok Ads', description: 'Conectar conta', logoBg: '#000', logoInitial: 'T', required: false, status: 'not_connected', accountsConnected: 0 },
      { key: 'ga4', label: 'GA4', description: 'Atribuição web', logoBg: '#1f3044', logoInitial: 'GA', required: false, status: 'not_connected', accountsConnected: 0 },
    ],
    goals: [],
    team: [],
    currentStep: 'basic',
    completedSteps: [],
  }
}

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'setBasic':
      return { ...state, basic: { ...state.basic, ...action.patch } }
    case 'setIntegrationStatus':
      return {
        ...state,
        integrations: state.integrations.map((it) =>
          it.key === action.key
            ? {
                ...it,
                status: action.status,
                accountsConnected: action.accountsConnected ?? it.accountsConnected,
                syncProgressLabel: action.syncProgressLabel ?? it.syncProgressLabel,
              }
            : it,
        ),
      }
    case 'addGoal':
      return {
        ...state,
        goals: [
          ...state.goals,
          {
            id: `g_${Math.random().toString(36).slice(2, 8)}`,
            metric: 'leads',
            label: 'Leads · trimestre',
            targetValue: 0,
            distribution: 'linear',
          },
        ],
      }
    case 'patchGoal':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
      }
    case 'removeGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) }
    case 'setGoals':
      return { ...state, goals: action.goals }
    case 'addTeamInvite':
      if (state.team.some((t) => t.email === action.invite.email)) return state
      return { ...state, team: [...state.team, action.invite] }
    case 'removeTeamInvite':
      return { ...state, team: state.team.filter((t) => t.email !== action.email) }
    case 'goStep':
      return { ...state, currentStep: action.step }
    case 'completeStep': {
      if (state.completedSteps.includes(action.step)) return state
      return { ...state, completedSteps: [...state.completedSteps, action.step] }
    }
  }
}

export function useOnboardingState() {
  return useReducer(reducer, undefined, initialState)
}

export function indexOfStep(step: OnboardingStepKey): number {
  return ONBOARDING_STEPS.findIndex((s) => s.key === step)
}

export function nextStep(step: OnboardingStepKey): OnboardingStepKey | null {
  const idx = indexOfStep(step)
  return idx >= 0 && idx < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[idx + 1].key : null
}

export function prevStep(step: OnboardingStepKey): OnboardingStepKey | null {
  const idx = indexOfStep(step)
  return idx > 0 ? ONBOARDING_STEPS[idx - 1].key : null
}
