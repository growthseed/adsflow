import { useMemo } from 'react'

import {
  ClientFilesCard,
  HealthScoreRingCard,
  LeadsForecastCard,
  NextMeetingCard,
  OneLineSummaryCard,
  QuarterProgressCard,
  RecentDecisionsCard,
  ShareOfVoiceCard,
  WhatsChangedCard,
  WinsOfWeekCard,
} from '@/components/domain/microcards'
import type {
  ClientFileItem,
  QuarterProgressItem,
  RecentDecisionItem,
  SovCompetitor,
  WhatsChangedItem,
  WinItem,
} from '@/components/domain/microcards'
import { loadSnapshot } from '@/services/adapters/clickupAdapter'
import { loadPerformanceSnapshot } from '@/services/adapters/performanceAdapter'

/**
 * Home > view "Micro-cards" — catálogo dos blocos plugáveis.
 * Cada card aqui é o mesmo componente que será usado em Client
 * Overview, Performance e Portal — só muda a origem dos dados.
 */
export default function MicroCardsView() {
  const agency = loadSnapshot()
  const perf = loadPerformanceSnapshot()

  /* ─────────── "O que mudou" — deriva de assignees recentes ─────────── */
  const changes: WhatsChangedItem[] = useMemo(() => {
    const tasks = agency.clients.flatMap((c) => c.all_tasks)
    const recentDone = tasks.filter((t) => t.status === 'done').slice(0, 2)
    const overdue = tasks.filter((t) => (t.days_late ?? 0) > 3).slice(0, 1)
    const list: WhatsChangedItem[] = []
    recentDone.forEach((t) =>
      list.push({
        id: `done-${t.id}`,
        kind: 'check',
        headline: (
          <>
            <b>{t.title}</b> concluída
          </>
        ),
        sub: t.list_name,
      }),
    )
    overdue.forEach((t) =>
      list.push({
        id: `late-${t.id}`,
        kind: 'alert',
        headline: (
          <>
            <b>{t.title}</b> — atrasada {t.days_late}d
          </>
        ),
        sub: t.list_name,
      }),
    )
    return list.slice(0, 4)
  }, [agency])

  /* ─────────── Onde estamos (trimestre) — placeholder enquanto agency_goals não pluga ─────────── */
  const quarter: QuarterProgressItem[] = []

  /* ─────────── Wins da semana — derivado de deltas disponíveis ─────────── */
  const wins: WinItem[] = useMemo(() => {
    const totalDone = agency.aggregate?.total_done_week ?? 0
    const totalActive = agency.aggregate?.total_active_tasks ?? 0
    const items: WinItem[] = []
    if (totalDone > 0) {
      items.push({
        id: 'done-week',
        tone: 'success',
        value: `+${totalDone}`,
        label: 'tarefas concluídas esta semana',
      })
    }
    if (agency.aggregate?.on_time_rate != null) {
      items.push({
        id: 'on-time',
        tone: 'info',
        value: `${Math.round(agency.aggregate.on_time_rate * 100)}%`,
        label: 'no prazo · carteira',
      })
    }
    if (totalActive > 0) {
      items.push({
        id: 'active',
        tone: 'brand',
        value: `${totalActive}`,
        label: 'tarefas em andamento',
      })
    }
    return items
  }, [agency])

  /* ─────────── Previsão de leads — precisa série diária (virá Sprint 5) ─────────── */
  const forecast = { projected: 0, goal: null as number | null, history: [] as number[], projection: [] as number[] }

  /* ─────────── Últimas decisões — derivado de assignees ativos ─────────── */
  const decisions: RecentDecisionItem[] = useMemo(() => {
    const tasks = agency.clients.flatMap((c) => c.all_tasks).slice(0, 10)
    return tasks
      .filter((t) => t.assignees.length > 0)
      .slice(0, 3)
      .map((t, i) => ({
        id: `dec-${t.id}-${i}`,
        authorName: t.assignees[0].username,
        headline: (
          <>
            Atualizou <b>{t.title}</b>
          </>
        ),
        meta: t.due_date ? `prazo ${t.due_date_label ?? t.due_date}` : t.list_name,
      }))
  }, [agency])

  /* ─────────── Próxima reunião — 1ª task urgente de hoje ─────────── */
  const nextMeeting = useMemo(() => {
    const now = new Date()
    const candidate = agency.clients
      .flatMap((c) => c.upcoming_tasks)
      .find(
        (t) =>
          t.due_date &&
          new Date(`${t.due_date}T00:00:00`).toDateString() === now.toDateString(),
      )
    if (!candidate) return null
    return {
      title: candidate.title,
      when: new Date(`${candidate.due_date}T14:00:00`),
      location: 'google_meet',
      agenda: [
        'Revisão do pacing da semana',
        'Criativos em fila de aprovação',
        'Próximos passos',
      ],
    }
  }, [agency])

  /* ─────────── Share of voice — depende de integração externa ─────────── */
  const sov = {
    yourShare: null as number | null,
    ranking: null as { position: number; total: number } | null,
    deltaPts: null as number | null,
    competitors: [] as SovCompetitor[],
  }

  /* ─────────── Arquivos ─────────── */
  const files: ClientFileItem[] = []

  /* ─────────── Health score ─────────── */
  const firstClient = agency.clients[0]
  const clientHealth = firstClient
    ? {
        name: firstClient.name,
        score: Math.max(
          0,
          Math.min(
            100,
            100 -
              Math.min(30, firstClient.stats.overdue * 10) -
              Math.min(20, firstClient.stats.urgent * 3),
          ),
        ),
      }
    : null

  const oneLiner =
    perf && Object.keys(perf.clients || {}).length > 0
      ? 'Carteira ativa, com movimentação em múltiplas contas. Configure os tokens de IA para ter resumos automáticos semanais.'
      : 'Conecte pelo menos uma conta de mídia para gerar o resumo mensal automatizado.'

  return (
    <div className="max-w-layout mx-auto">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-[-0.01em] text-neutral-900">
          Micro-cards plugáveis
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Blocos prontos para Client Overview, Performance e Portal · basta importar o componente
        </p>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <WhatsChangedCard
          className="col-span-12 lg:col-span-4"
          sinceLabel="seu último login"
          items={changes}
        />
        <QuarterProgressCard
          className="col-span-12 lg:col-span-4"
          quarterLabel={quarterLabel()}
          items={quarter}
        />
        <WinsOfWeekCard className="col-span-12 lg:col-span-4" items={wins} />

        <OneLineSummaryCard
          className="col-span-12 lg:col-span-6"
          summary={oneLiner}
          onCopy={() => navigator.clipboard?.writeText(String(oneLiner))}
        />
        <LeadsForecastCard
          className="col-span-12 lg:col-span-6"
          projected={forecast.projected}
          goal={forecast.goal}
          history={forecast.history}
          projection={forecast.projection}
        />

        <RecentDecisionsCard className="col-span-12 lg:col-span-6" items={decisions} />
        {nextMeeting ? (
          <NextMeetingCard
            className="col-span-12 lg:col-span-6"
            title={nextMeeting.title}
            when={nextMeeting.when}
            location={nextMeeting.location}
            agenda={nextMeeting.agenda}
            relativeLabel="hoje"
            relativeTone="warning"
          />
        ) : (
          <div className="col-span-12 lg:col-span-6 rounded-xl border border-neutral-200 bg-white p-6 text-center text-xs text-neutral-500 shadow-[var(--shadow-soft)]">
            Nenhuma reunião agendada para hoje.
          </div>
        )}

        <ShareOfVoiceCard
          className="col-span-12 lg:col-span-4"
          yourShare={sov.yourShare}
          ranking={sov.ranking}
          deltaPts={sov.deltaPts}
          competitors={sov.competitors}
        />
        <ClientFilesCard className="col-span-12 lg:col-span-4" files={files} />
        {clientHealth && (
          <HealthScoreRingCard
            className="col-span-12 lg:col-span-4"
            overallScore={clientHealth.score}
            label={`${clientHealth.name} · carteira`}
            subLabel={clientHealth.name}
            subMetrics={[]}
          />
        )}
      </div>
    </div>
  )
}

function quarterLabel(): string {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `Q${q} ${now.getFullYear()}`
}
