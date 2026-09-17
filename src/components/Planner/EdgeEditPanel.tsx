import { X, ArrowLeftRight, Trash2 } from 'lucide-react'
import type { Edge } from '@xyflow/react'
import { EDGE_ICONS, EDGE_COLORS, type PlannerEdgeData } from './plannerModel'
import { EDGE_ICON_COMPONENTS } from '../Edges/ConversionEdge'

interface EdgeEditPanelProps {
  edge: Edge
  onChange: (edgeId: string, patch: { label?: string; data?: Partial<PlannerEdgeData> }) => void
  onReverse: (edgeId: string) => void
  onDelete: (edgeId: string) => void
  onClose: () => void
}

/** Painel lateral da conexão: rótulo, ícone da ação, animação, tracejado e cor. */
export default function EdgeEditPanel({ edge, onChange, onReverse, onDelete, onClose }: EdgeEditPanelProps) {
  const data = (edge.data ?? {}) as PlannerEdgeData
  const label = typeof edge.label === 'string' ? edge.label : data.label ?? ''
  return (
    <aside className="planner-read-panel planner-edge-panel" role="dialog" aria-label="Editar conexão">
      <button onClick={onClose} aria-label="Fechar conexão"><X size={16} /></button>
      <h3>Conexão</h3>
      <label>Rótulo<input aria-label="Rótulo da conexão" value={label} placeholder="Ex.: Clicou no anúncio" onChange={event => onChange(edge.id, { label: event.target.value, data: { label: event.target.value } })} /></label>
      <p className="planner-field-title">Ícone</p>
      <div className="planner-icon-grid" role="radiogroup" aria-label="Ícone da conexão">
        <button type="button" role="radio" aria-checked={!data.icon} title="Sem ícone" onClick={() => onChange(edge.id, { data: { icon: '' } })}><span className="planner-icon-none" /></button>
        {EDGE_ICONS.map(item => { const Icon = EDGE_ICON_COMPONENTS[item.key]; return (
          <button key={item.key} type="button" role="radio" aria-checked={data.icon === item.key} title={item.label} aria-label={item.label} onClick={() => onChange(edge.id, { data: { icon: item.key } })}><Icon size={16} /></button>
        ) })}
      </div>
      <label className="planner-check"><input type="checkbox" checked={!!data.animated} onChange={event => onChange(edge.id, { data: { animated: event.target.checked } })} />Sempre animada</label>
      <label className="planner-check"><input type="checkbox" checked={!!data.dashed} onChange={event => onChange(edge.id, { data: { dashed: event.target.checked } })} />Tracejada</label>
      <p className="planner-field-title">Cor</p>
      <div className="planner-color-row" role="radiogroup" aria-label="Cor da conexão">
        {EDGE_COLORS.map(color => <button key={color} type="button" role="radio" aria-checked={(data.color ?? EDGE_COLORS[0]) === color} aria-label={color} style={{ background: color }} onClick={() => onChange(edge.id, { data: { color } })} />)}
      </div>
      <div className="planner-panel-actions">
        <button type="button" onClick={() => onReverse(edge.id)}><ArrowLeftRight size={14} />Inverter direção</button>
        <button type="button" className="is-danger" onClick={() => onDelete(edge.id)}><Trash2 size={14} />Excluir conexão</button>
      </div>
    </aside>
  )
}
