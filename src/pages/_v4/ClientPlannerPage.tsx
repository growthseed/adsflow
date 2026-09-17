/**
 * ============================================
 * Client Planner Page — AdFlow v4
 * ============================================
 * Módulo "Planner" — mapa visual de estratégia por cliente.
 *
 * 3 estados, refletidos na URL (F5 e link direto voltam ao mesmo lugar):
 *   /c/:slug/planner          → lista de flows
 *   /c/:slug/planner/novo     → escolha de template
 *   /c/:slug/planner/:flowId  → editor (FlowEditor)
 *
 * Em modo `embedded` (portal) o estado fica em memória.
 * ============================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ReactFlowProvider, type Edge } from '@xyflow/react'
import { Plus, ArrowLeft, Search, SquarePlus, Trash2, ArrowRight, Link2, LayoutGrid } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { PageHeader, EmptyState } from '@/components/canonical'
import { useResolvedAgencyClient } from '@/hooks/useResolvedAgencyClient'
import { listClientFlows, createFlow, deleteFlow, type ClientFlow } from '@/services/adapters/clientFlowsAdapter'
import { filterTemplates, type PlannerTemplate, type TemplateFilter } from '@/data/plannerTemplates'
import FlowEditor from '@/components/Planner/FlowEditor'
import { sanitizeEdges } from '@/components/Planner/plannerNodeTypes'

type ViewState = { mode: 'list' } | { mode: 'picker' } | { mode: 'editor'; flowId: string }

interface ClientPlannerPageProps {
  clientSlugOverride?: string
  embedded?: boolean
}

export default function ClientPlannerPage({ clientSlugOverride, embedded = false }: ClientPlannerPageProps = {}) {
  const params = useParams<{ clientSlug: string; flowId: string }>()
  const navigate = useNavigate()
  const clientSlug = clientSlugOverride ?? params.clientSlug
  const routed = !embedded && !clientSlugOverride
  const client = useResolvedAgencyClient(clientSlug)
  const { can } = useAuth()
  const canWrite = can('planner', 'write')

  const [localView, setLocalView] = useState<ViewState>({ mode: 'list' })
  const [flows, setFlows] = useState<ClientFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [openFlowName, setOpenFlowName] = useState('')

  const view = useMemo<ViewState>(() => {
    if (!routed) return localView
    if (params.flowId === 'novo') return { mode: 'picker' }
    if (params.flowId) return { mode: 'editor', flowId: params.flowId }
    return { mode: 'list' }
  }, [routed, localView, params.flowId])

  const setView = useCallback((next: ViewState) => {
    if (!routed) { setLocalView(next); return }
    const base = `/c/${clientSlug}/planner`
    navigate(next.mode === 'list' ? base : next.mode === 'picker' ? `${base}/novo` : `${base}/${next.flowId}`)
  }, [routed, clientSlug, navigate])

  const loadFlows = useCallback(async () => {
    if (!clientSlug) return
    setFlows(await listClientFlows(clientSlug))
    setLoading(false)
  }, [clientSlug])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    loadFlows().catch(error => { if (!cancelled) console.error('[ClientPlannerPage] loadFlows failed:', error) })
    return () => { cancelled = true }
  }, [loadFlows])

  if (!client) {
    if (embedded) {
      return (
        <div className="rounded-lg border border-dashed border-[#DDE3EA] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#152033]">Planner de Growth</p>
          <p className="mt-1 text-xs text-gray-500">Os mapas de campanha aparecem aqui. Nenhum flow criado para este workspace ainda.</p>
        </div>
      )
    }
    return <Navigate to="/_v4/operations" replace />
  }

  const breadcrumbs = [
    { label: 'Operações', href: '/_v4/operations' },
    { label: client.name, href: `/c/${client.slug}/overview` },
    view.mode === 'list' ? { label: 'Planner' } : { label: 'Planner', href: `/c/${client.slug}/planner` },
    ...(view.mode === 'picker' ? [{ label: 'Novo flow' }] : view.mode === 'editor' ? [{ label: openFlowName || 'Flow' }] : []),
  ]

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <PageHeader
        title="Planner"
        subtitle={`${client.name} · ${flows.length} ${flows.length === 1 ? 'flow' : 'flows'}`}
        breadcrumbs={breadcrumbs}
        leading={<ClientAvatar gradient={client.avatar_gradient} name={client.short_name} />}
        actions={
          view.mode === 'list' && flows.length > 0 && canWrite ? (
            <button onClick={() => setView({ mode: 'picker' })} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5"><Plus size={14} strokeWidth={2.5} />Novo Flow</button>
          ) : view.mode !== 'list' ? (
            <button onClick={() => setView({ mode: 'list' })} className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors inline-flex items-center gap-1.5"><ArrowLeft size={14} />Voltar</button>
          ) : null
        }
      />

      <main className="max-w-layout mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {view.mode === 'list' && (
          <FlowsList
            flows={flows}
            loading={loading}
            onCreateNew={canWrite ? () => setView({ mode: 'picker' }) : undefined}
            onOpen={id => setView({ mode: 'editor', flowId: id })}
            onDelete={canWrite ? async id => { await deleteFlow(id); loadFlows() } : undefined}
          />
        )}

        {view.mode === 'picker' && clientSlug && canWrite && (
          <TemplatePicker
            onBlankFlow={async () => {
              const flow = await createFlow({ client_slug: clientSlug, name: 'Novo Flow em branco', nodes: [], edges: [] })
              if (flow) setView({ mode: 'editor', flowId: flow.id })
            }}
            onTemplateSelected={async template => {
              const flow = await createFlow({
                client_slug: clientSlug,
                name: `${template.name} — ${client.short_name}`,
                description: template.description,
                template_id: template.id,
                nodes: JSON.parse(JSON.stringify(template.nodes)),
                edges: sanitizeEdges(JSON.parse(JSON.stringify(template.edges)) as Edge[]),
              })
              if (flow) setView({ mode: 'editor', flowId: flow.id })
            }}
          />
        )}

        {view.mode === 'editor' && (
          <ReactFlowProvider key={view.flowId}>
            <FlowEditor
              flowId={view.flowId}
              onLoaded={flow => setOpenFlowName(flow.name)}
              onBack={() => setView({ mode: 'list' })}
              onDeleted={() => { setView({ mode: 'list' }); loadFlows() }}
            />
          </ReactFlowProvider>
        )}
      </main>
    </div>
  )
}

// =============================================================
// FLOWS LIST
// =============================================================

function FlowsList({ flows, loading, onCreateNew, onOpen, onDelete }: { flows: ClientFlow[]; loading: boolean; onCreateNew?: () => void; onOpen: (id: string) => void; onDelete?: (id: string) => void }) {
  if (loading) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />)}</div>
  }
  if (flows.length === 0) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl">
        <EmptyState
          icon={<LayoutGrid size={32} strokeWidth={1.5} />}
          title="Nenhum flow criado ainda"
          description={onCreateNew ? 'Nenhum mapa cadastrado.' : 'Nenhum mapa disponível para acompanhamento.'}
          action={onCreateNew && <button onClick={onCreateNew} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">Criar primeiro flow</button>}
        />
      </div>
    )
  }
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{flows.map(flow => <FlowCard key={flow.id} flow={flow} onOpen={() => onOpen(flow.id)} onDelete={onDelete ? () => onDelete(flow.id) : undefined} />)}</div>
}

function FlowCard({ flow, onOpen, onDelete }: { flow: ClientFlow; onOpen: () => void; onDelete?: () => void }) {
  const updated = new Date(flow.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div onClick={onOpen} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') onOpen() }} className="group cursor-pointer bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all duration-normal">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 truncate">{flow.name}</h3>
          {flow.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{flow.description}</p>}
        </div>
        {onDelete && <button onClick={event => { event.stopPropagation(); if (confirm(`Excluir "${flow.name}"?`)) onDelete() }} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-error-600 transition-all p-1 -mr-1" aria-label="Excluir flow"><Trash2 size={14} /></button>}
      </div>
      <div className="flex items-center gap-3 text-2xs text-neutral-500 mb-4">
        <span>{flow.nodes.length} nós · {flow.edges.length} conexões</span>
        <span>v{flow.version}</span>
        {flow.share_enabled && <span className="inline-flex items-center gap-1 text-success-700"><Link2 size={10} strokeWidth={2.5} />Compartilhado</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xs text-neutral-400">{updated}</span>
        <button onClick={onOpen} className="text-xs font-medium text-brand-700 hover:text-brand-900 inline-flex items-center gap-1">Abrir<ArrowRight size={12} strokeWidth={2.5} /></button>
      </div>
    </div>
  )
}

// =============================================================
// TEMPLATE PICKER
// =============================================================

function TemplatePicker({ onBlankFlow, onTemplateSelected }: { onBlankFlow: () => void; onTemplateSelected: (t: PlannerTemplate) => void }) {
  const [filter, setFilter] = useState<TemplateFilter>({ category: 'all', vertical: 'all', query: '' })
  const filtered = useMemo(() => filterTemplates(filter), [filter])
  const categories = ['all', 'briefing', 'funnel', 'launch', 'remarketing'] as const
  const categoryLabel: Record<typeof categories[number], string> = { all: 'Todos', briefing: 'Briefing', funnel: 'Funis', launch: 'Lançamentos', remarketing: 'Remarketing' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input type="text" placeholder="Buscar template..." value={filter.query || ''} onChange={event => setFilter(f => ({ ...f, query: event.target.value }))} className="w-full pl-10 pr-3 py-2.5 text-sm bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1" />
        </div>
        <button onClick={onBlankFlow} className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"><SquarePlus size={14} />Canvas em branco</button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(f => ({ ...f, category: cat }))} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-fast flex-shrink-0 ${filter.category === cat ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`}>{categoryLabel[cat]}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl"><EmptyState compact title="Nenhum template encontrado" description="Tente ajustar o filtro ou a busca." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(t => <TemplateCard key={t.id} template={t} onSelect={() => onTemplateSelected(t)} />)}</div>
      )}
    </div>
  )
}

function TemplateCard({ template, onSelect }: { template: PlannerTemplate; onSelect: () => void }) {
  const colors = {
    violet: 'from-violet-50 to-violet-100 border-violet-200 hover:border-violet-400',
    blue: 'from-blue-50 to-blue-100 border-[var(--color-brand-200)] hover:border-blue-400',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-400',
    amber: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400',
    pink: 'from-pink-50 to-pink-100 border-pink-200 hover:border-pink-400',
    slate: 'from-slate-50 to-slate-100 border-slate-200 hover:border-slate-400',
  }[template.color]
  return (
    <button onClick={onSelect} className={`text-left p-5 rounded-xl border bg-gradient-to-br ${colors} transition-all duration-normal hover:shadow-lg hover:-translate-y-0.5 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{template.icon}</div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xs uppercase tracking-wider text-neutral-600 font-semibold bg-white/60 px-2 py-0.5 rounded-full">{template.category}</span>
          {template.vertical !== 'any' && <span className="text-2xs text-neutral-500">{template.vertical}</span>}
        </div>
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{template.name}</h3>
      <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-3">{template.description}</p>
      <div className="flex items-center gap-3 text-2xs text-neutral-500"><span>{template.node_count} nós</span><span>·</span><span>{template.edge_count} conexões</span><span>·</span><span>~{template.estimated_setup_minutes} min</span></div>
    </button>
  )
}

function ClientAvatar({ gradient, name }: { gradient: string; name: string }) {
  return <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0`} aria-hidden="true">{name}</div>
}
