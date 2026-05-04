import { useMemo, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { PortalHeader } from './components/PortalHeader'
import { PortalKpiStrip } from './components/PortalKpiStrip'
import { PortalSummaryCard } from './components/PortalSummaryCard'
import { PortalSection } from './components/PortalSection'
import { PortalGoalRingCard } from './components/PortalGoalRing'
import { PortalTimeline } from './components/PortalTimeline'
import { PortalNextCallCard } from './components/PortalNextCall'
import { PortalTabBar } from './components/PortalTabBar'
import { PortalCommentsSheet } from './components/PortalCommentsSheet'
import { PortalDadosView } from './components/PortalDadosView'
import { PortalTarefasView } from './components/PortalTarefasView'
import { usePortalConfig } from './hooks/usePortalConfig'
import { usePortalData } from './hooks/usePortalData'
import type { PortalViewKey } from './types'

interface Props {
  clientSlug: string
  clientId: string | null
  /** Quando true, usuário é viewer (cliente) — esconde CTAs internos */
  readerMode?: boolean
  onExit?: () => void
}

/**
 * Shell visual do Portal V2 — compartilhado entre a rota autenticada
 * `/c/:slug/portal` e a rota pública `/portal/:token`. A rota pública
 * passa clientId=null pra desabilitar comentários (sem auth → sem
 * thread).
 */
export function PortalV2Shell({ clientSlug, clientId, readerMode = true, onExit }: Props) {
  const { user } = useAuth()
  const { config } = usePortalConfig(clientId)
  const data = usePortalData(clientSlug, config)
  const [view, setView] = useState<PortalViewKey>('hoje')
  const [commentAnchor, setCommentAnchor] = useState<string | null>(null)

  const cfg = data?.config
  const leads = data?.bundle.kpis?.leads ?? 0
  const cpl = data?.bundle.kpis?.cpa ?? null
  const clientName = data?.bundle.roadmap?.client_name ?? 'Cliente'

  const headingBadge = useMemo(() => {
    if (data?.bundle.stale) return 'Dados em sincronização'
    return null
  }, [data])

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 p-6 text-center">
        <div>
          <div className="text-sm font-semibold text-neutral-900 mb-1">
            Portal indisponível
          </div>
          <p className="text-xs text-neutral-500">
            Não encontramos dados para este cliente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <PortalHeader
        clientName={clientName}
        clientEmail={user?.email}
        onMenu={onExit}
      />

      {cfg?.showKpis && (
        <PortalKpiStrip leads={leads} cpl={cpl} roas={null} spend={data.spend} />
      )}

      <main className="px-4 pt-4 max-w-md mx-auto">
        {headingBadge && (
          <div className="text-[10px] uppercase tracking-[0.08em] text-warning-600 mb-2 text-center">
            {headingBadge}
          </div>
        )}

        {view === 'hoje' && (
          <>
            {cfg?.showSummary && data.summary && (
              <PortalSection
                title="Resumo da semana"
                anchor={clientId ? 'summary' : undefined}
                onComment={setCommentAnchor}
              >
                <PortalSummaryCard summary={data.summary} />
              </PortalSection>
            )}

            {cfg?.showGoals && data.goals.length > 0 && (
              <PortalSection
                title="Metas do mês"
                anchor={clientId ? 'goals' : undefined}
                onComment={setCommentAnchor}
              >
                <div className="divide-y divide-neutral-100">
                  {data.goals.map((g) => (
                    <PortalGoalRingCard key={g.key} goal={g} />
                  ))}
                </div>
              </PortalSection>
            )}

            {cfg?.showTimeline && (
              <PortalSection
                title="Últimas 48h"
                anchor={clientId ? 'timeline' : undefined}
                onComment={setCommentAnchor}
              >
                <PortalTimeline items={data.timeline} />
              </PortalSection>
            )}

            {cfg?.showNextCall && data.nextCall && (
              <PortalSection
                title="Próxima call"
                anchor={clientId ? 'next_call' : undefined}
                onComment={setCommentAnchor}
              >
                <PortalNextCallCard next={data.nextCall} />
              </PortalSection>
            )}

            {cfg?.welcomeMessage && (
              <div className="text-[11px] text-neutral-500 text-center mt-4 whitespace-pre-wrap">
                {cfg.welcomeMessage}
              </div>
            )}
          </>
        )}

        {view === 'dados' && (
          <PortalDadosView
            periodLabel={data.periodLabel}
            spend={data.spend}
            channels={data.channels}
            campaigns={data.campaigns}
            monthly={data.monthlyHistory}
            notes={data.notes}
          />
        )}

        {view === 'tarefas' && (
          <PortalTarefasView tasks={data.tasks} stats={data.taskStats} />
        )}

        {view === 'chat' && cfg?.showChat && (
          <div className="text-center py-10 text-xs text-neutral-500">
            Canal direto com o gestor — em breve.
            {cfg.whatsappUrl && (
              <div className="mt-2">
                <a
                  href={cfg.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 font-semibold"
                >
                  Abrir WhatsApp →
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <PortalTabBar value={view} onChange={setView} showChat={!!cfg?.showChat} />

      {clientId && (
        <PortalCommentsSheet
          clientId={clientId}
          anchor={commentAnchor}
          anchorLabel={labelFor(commentAnchor)}
          onClose={() => setCommentAnchor(null)}
          canResolve={!readerMode}
        />
      )}
    </div>
  )
}

function labelFor(anchor: string | null): string | undefined {
  switch (anchor) {
    case 'summary':   return 'Resumo'
    case 'goals':     return 'Metas'
    case 'timeline':  return 'Últimas 48h'
    case 'next_call': return 'Próxima call'
    default:          return undefined
  }
}
