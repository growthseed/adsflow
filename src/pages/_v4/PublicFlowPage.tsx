/**
 * ============================================
 * Public Flow Page — AdFlow v4 Sprint 5
 * ============================================
 * Read-only view of a Planner flow, shared via token URL.
 * No auth required — fetches via SECURITY DEFINER RPC that
 * only returns rows with share_enabled = true.
 *
 * Rota: /p/:token
 * ============================================
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
} from 'reactflow'
import type { Node, Edge, Viewport } from 'reactflow'
import 'reactflow/dist/style.css'

import { getSharedFlow } from '@/services/adapters/clientFlowsAdapter'

// Reuse the same node types
import TrafficSourceNode from '@/components/Nodes/TrafficSourceNode'
import CampaignNode from '@/components/Nodes/CampaignNode'
import AdSetNode from '@/components/Nodes/AdSetNode'
import AdNode from '@/components/Nodes/AdNode'
import AudienceNode from '@/components/Nodes/AudienceNode'
import ResultNode from '@/components/Nodes/ResultNode'
import LandingPageNode from '@/components/Nodes/LandingPageNode'
import PostitNode from '@/components/Nodes/PostitNode'
import AdvancedTextNode from '@/components/Nodes/AdvancedTextNode'
import {
  SourceNode as FunnelSourceNode,
  PageNode as FunnelPageNode,
  ActionNode as FunnelActionNode,
} from '@/components/Nodes/Funnelytics'

const nodeTypes = {
  trafficSource: TrafficSourceNode,
  traffic_source: TrafficSourceNode,
  campaign: CampaignNode,
  adSet: AdSetNode,
  ad_set: AdSetNode,
  ad: AdNode,
  audience: AudienceNode,
  result: ResultNode,
  landingPage: LandingPageNode,
  postit: PostitNode,
  advancedText: AdvancedTextNode,
  funnelSource: FunnelSourceNode,
  funnelPage: FunnelPageNode,
  funnelAction: FunnelActionNode,
}

interface SharedFlow {
  id: string
  client_slug: string
  name: string
  description: string | null
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport | null
  updated_at: string
}

export default function PublicFlowPage() {
  const { token } = useParams<{ token: string }>()
  const [flow, setFlow] = useState<SharedFlow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      const data = await getSharedFlow(token)
      if (cancelled) return
      if (data) {
        setFlow(data)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const updatedLabel = useMemo(() => {
    if (!flow) return ''
    return new Date(flow.updated_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [flow])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-page)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (notFound || !flow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-page)] p-6">
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 mb-2">Flow não disponível</h1>
          <p className="text-sm text-neutral-500">
            Esse link expirou, foi desativado pelo autor, ou nunca existiu.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-page)]">
      {/* Top bar — minimal branded header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 sm:px-6 py-3">
        <div className="max-w-layout mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-2xs text-neutral-500 uppercase tracking-wider font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              Flow Público — somente leitura
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-neutral-900 mt-0.5 truncate">
              {flow.name}
            </h1>
            {flow.description && (
              <p className="text-xs text-neutral-500 mt-0.5 truncate">{flow.description}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-2xs text-neutral-400">Atualizado em</div>
            <div className="text-xs text-neutral-700 font-medium">{updatedLabel}</div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <ReactFlow
            nodes={flow.nodes}
            edges={flow.edges}
            nodeTypes={nodeTypes}
            defaultViewport={flow.viewport || undefined}
            fitView={!flow.viewport}
            fitViewOptions={{ padding: 0.2 }}
            // Read-only: disable all interactions except pan/zoom
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} />
            <Controls
              position="bottom-right"
              showInteractive={false}
              showFitView
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Footer — Powered by Efeito Digital */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 sm:px-6 py-2.5">
        <div className="max-w-layout mx-auto flex items-center justify-between text-2xs text-neutral-500">
          <span>
            Planejado pela <strong className="text-neutral-700">Efeito Digital</strong>
          </span>
          <span className="hidden sm:inline">AdFlow · Planner</span>
        </div>
      </footer>
    </div>
  )
}
