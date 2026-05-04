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

/** Linha de campanha exibida no painel "Dados" */
export interface PortalCampaignRow {
  name: string
  channel: string
  status: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  cpl: number | null
  ctr: number | null
}

/** Comparativo mensal (vem de performance.monthly_history) */
export interface PortalMonthlyRow {
  month: string
  label: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  partial?: boolean
}

/** Distribuição por canal (Google / Meta) */
export interface PortalChannelRow {
  label: string
  spend: number
  conversions: number
  color: string
}

/** Task simplificada pro painel "Tarefas" */
export interface PortalTaskRow {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  status_label: string
  status_color: string
  list_name: string
  due_date_label: string | null
  url: string
  assignees: Array<{ username: string; initial: string; color: string }>
}

export interface PortalV2Data {
  bundle: ClientPortalBundle
  config: PortalConfig
  summary: string | null
  goals: PortalGoalRing[]
  timeline: PortalTimelineItem[]
  nextCall: PortalNextCall | null
  /** Investimento total do período (BRL) */
  spend: number | null
  /** Período legível (ex: "Últimos 30 dias") */
  periodLabel: string | null
  /** Campanhas ativas/recentes */
  campaigns: PortalCampaignRow[]
  /** Histórico mensal pra comparativo */
  monthlyHistory: PortalMonthlyRow[]
  /** Distribuição de investimento por canal */
  channels: PortalChannelRow[]
  /** Notas operacionais (ex: "campanha retomada em 29/04") */
  notes: string[]
  /** Tasks do projeto */
  tasks: PortalTaskRow[]
  /** Estatísticas de tasks */
  taskStats: {
    total: number
    done: number
    in_progress: number
    review: number
    todo: number
    blocked: number
  }
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
  // Chat tab fica oculta por default (placeholder "em breve") — só aparece
  // quando o cliente tiver whatsappUrl configurada via portal_config.
  showChat: false,
  welcomeMessage: null,
  whatsappUrl: null,
}
