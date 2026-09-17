import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import {
  MousePointerClick, MessageCircle, UserPlus, Phone, Mail, FileText, CalendarCheck, ShoppingCart,
  CreditCard, Eye, Play, Download, Repeat, Workflow, type LucideIcon,
} from 'lucide-react'
import { formatPercentage, formatNumber } from '../../types/funnelytics'
import { edgeColor, type PlannerEdge, type EdgeIconKey } from '../Planner/plannerModel'

export const EDGE_ICON_COMPONENTS: Record<EdgeIconKey, LucideIcon> = {
  click: MousePointerClick, message: MessageCircle, lead: UserPlus, call: Phone, mail: Mail, form: FileText,
  calendar: CalendarCheck, cart: ShoppingCart, payment: CreditCard, view: Eye, video: Play, download: Download,
  retarget: Repeat, automation: Workflow,
}

/** Clique no ícone/rótulo da conexão: avisa o editor para abrir o painel da conexão. */
export function emitEdgeSelect(edgeId: string) {
  document.dispatchEvent(new CustomEvent('planner:edge-select', { detail: { edgeId } }))
}

/**
 * Conexão do Planner: linha bezier com seta colorida, ícone da ação no meio
 * (clique, mensagem, compra...), rótulo, e — quando ativa (selecionada, ligada
 * a um node selecionado ou marcada como animada) — tracejado em movimento com
 * uma partícula percorrendo o caminho. Métricas (taxa/pessoas) aparecem em
 * pílulas quando os dados ao vivo estão ligados.
 */
function ConversionEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data, label, selected, animated }: EdgeProps<PlannerEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const color = edgeColor(data, { selected, active: data?.active })
  const Icon = data?.icon ? EDGE_ICON_COMPONENTS[data.icon] : null
  const text = typeof label === 'string' && label ? label : data?.label
  const showMetrics = !data?.hideMetrics && (data?.conversionRate !== undefined || data?.conversions !== undefined)
  const badgeColor = data?.conversionRate == null ? 'bg-gray-100 text-gray-600'
    : data.conversionRate >= 50 ? 'bg-green-100 text-green-700'
    : data.conversionRate >= 20 ? 'bg-blue-100 text-blue-700'
    : data.conversionRate >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{ ...style, stroke: color, strokeWidth: selected ? 3 : 2, strokeDasharray: data?.dashed && !animated ? '7 5' : undefined, transition: 'stroke .15s' }}
      />
      {animated && (
        <circle r={selected ? 5 : 4} fill={color} className="planner-edge-particle">
          <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      {(Icon || text) && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className={`nodrag nopan planner-edge-badge${selected ? ' is-selected' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - (showMetrics ? 26 : 0)}px)`, borderColor: color, color }}
            onClick={event => { event.stopPropagation(); emitEdgeSelect(id) }}
            title={text || 'Conexão'}
          >
            {Icon && <span className="planner-edge-icon"><Icon size={15} strokeWidth={2.2} /></span>}
            {text && <span className="planner-edge-label">{text}</span>}
          </button>
        </EdgeLabelRenderer>
      )}
      {showMetrics && (
        <EdgeLabelRenderer>
          <div className="nodrag nopan" style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + (Icon || text ? 12 : 0)}px)`, pointerEvents: 'all' }}>
            <div className="flex items-stretch rounded-md overflow-hidden shadow-sm border border-white/60 backdrop-blur-sm divide-x divide-white/40">
              {data?.conversionRate !== undefined && (
                <div className={`px-2 py-1 flex flex-col items-center leading-none ${badgeColor}`}>
                  <span className="text-[9px] uppercase tracking-wide opacity-70">Taxa</span>
                  <span className="text-xs font-bold mt-0.5">{formatPercentage(data.conversionRate)}</span>
                </div>
              )}
              {data?.conversions !== undefined && (
                <div className="px-2 py-1 flex flex-col items-center leading-none bg-white/85 text-gray-700">
                  <span className="text-[9px] uppercase tracking-wide opacity-60">Pessoas</span>
                  <span className="text-xs font-bold mt-0.5">{formatNumber(data.conversions)}</span>
                </div>
              )}
            </div>
            {data?.dropoffs !== undefined && data.dropoffs > 0 && (
              <div className="mt-1 text-center"><span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">-{formatNumber(data.dropoffs)} drop</span></div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(ConversionEdge)
