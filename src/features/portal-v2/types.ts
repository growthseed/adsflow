import type { ClientPortalBundle } from '@/types/clientPortal'

/** Toggles de seções do Portal — espelha public.portal_config */
export interface PortalConfig {
  clientId: string
  showSummary: boolean
  showKpis: boolean
  showGoals: boolean
  showTimeline: boolean
  showNextCall: boolean
  showFiles: boolean
  showCreatives: boolean
  showChat: boolean
  welcomeMessage: string | null
  whatsappUrl: string | null
}

/** Meta compacta exibida com anel no Portal */
export interface PortalGoalRing {
  key: string
  label: string
  current: number
  target: number
  unit: 'count' | 'currency' | 'ratio'
  /** Determina cor do anel */
  tone: 'success' | 'warning' | 'error'
  /** Texto humano ex: "412 / 530 · restam 8 dias" */
  subtitle: string
}

/** Item da timeline "Últimas 48h" */
export interface PortalTimelineItem {
  id: string
  tone: 'success' | 'warning' | 'error' | 'brand'
  title: string
  subtitle?: string
}

/** Próxima call em destaque */
export interface PortalNextCall {
  title: string
  when: Date
  meetUrl?: string
}

export type PortalViewKey = 'hoje' | 'dados' | 'tarefas' | 'chat'

export interface PortalV2Data {
  bundle: ClientPortalBundle
  config: PortalConfig
  summary: string | null
  goals: PortalGoalRing[]
  timeline: PortalTimelineItem[]
  nextCall: PortalNextCall | null
}

/** Comentário — shape consumido pela UI */
export interface PortalComment {
  id: string
  anchor: string
  authorId: string | null
  authorName: string
  body: string
  parentId: string | null
  resolvedAt: string | null
  createdAt: string
}

/** Default config quando ainda não há registro em portal_config */
export const DEFAULT_PORTAL_CONFIG: Omit<PortalConfig, 'clientId'> = {
  showSummary: true,
  showKpis: true,
  showGoals: true,
  showTimeline: true,
  showNextCall: true,
  showFiles: false,
  showCreatives: true,
  showChat: true,
  welcomeMessage: null,
  whatsappUrl: null,
}
