import { createContext, useContext, type ComponentType } from 'react'
import { NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { Pencil, Copy, Trash2, RefreshCw } from 'lucide-react'
import { LiveMetricsBadge } from '@/components/canonical/LiveMetricsBadge'
import type { LiveMetrics } from '@/lib/enrichFlowWithLiveData'
import { THUMBNAIL_NODE_TYPES } from './plannerModel'

export type NodeAction = 'edit' | 'duplicate' | 'delete' | 'refresh-thumbnail'

/** Nodes avisam o editor por evento DOM: nada de funções dentro de `data` (que é persistido em JSON). */
export function emitNodeAction(nodeId: string, action: NodeAction) {
  document.dispatchEvent(new CustomEvent('planner:node-action', { detail: { nodeId, action } }))
}

export const PlannerChromeContext = createContext<{ readOnly: boolean }>({ readOnly: true })

/**
 * Envolve qualquer node do Planner com: toolbar flutuante (editar, duplicar,
 * atualizar miniatura, excluir) quando selecionado e o badge de métricas ao
 * vivo quando `data.liveMetrics` existe. O componente original recebe as props
 * intactas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withPlannerChrome(Component: ComponentType<any>): ComponentType<NodeProps> {
  const Wrapped = (props: NodeProps) => {
    const { readOnly } = useContext(PlannerChromeContext)
    const liveMetrics = (props.data as { liveMetrics?: LiveMetrics }).liveMetrics
    const hasThumbnail = THUMBNAIL_NODE_TYPES.has(props.type ?? '')
    return (
      <div className="relative">
        {!readOnly && (
          <NodeToolbar isVisible={!!props.selected} position={Position.Top} offset={10} className="planner-node-toolbar" aria-label="Ações do node">
            <button type="button" title="Editar" aria-label="Editar node" onClick={() => emitNodeAction(props.id, 'edit')}><Pencil size={14} /></button>
            <button type="button" title="Duplicar" aria-label="Duplicar node" onClick={() => emitNodeAction(props.id, 'duplicate')}><Copy size={14} /></button>
            {hasThumbnail && <button type="button" title="Atualizar miniatura" aria-label="Atualizar miniatura" onClick={() => emitNodeAction(props.id, 'refresh-thumbnail')}><RefreshCw size={14} /></button>}
            <button type="button" className="is-danger" title="Excluir" aria-label="Excluir node" onClick={() => emitNodeAction(props.id, 'delete')}><Trash2 size={14} /></button>
          </NodeToolbar>
        )}
        {liveMetrics && <LiveMetricsBadge metrics={liveMetrics} />}
        <Component {...props} />
      </div>
    )
  }
  Wrapped.displayName = `WithPlannerChrome(${Component.displayName || Component.name || 'Node'})`
  return Wrapped
}
