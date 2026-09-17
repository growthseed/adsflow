import React, { memo, useState } from 'react'
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react'
import {
  Target, Home, ShoppingBag, FolderOpen, PenLine, CreditCard, ShoppingCart, PartyPopper, CheckCircle2,
  ClipboardList, Video, Play, RefreshCw, ImageOff, type LucideIcon,
} from 'lucide-react'
import type { PageNodeData, PageType } from '../../../types/funnelytics'
import { PAGE_CONFIG, formatNumber, formatPercentage } from '../../../types/funnelytics'
import { isHttpUrl } from '../../Planner/plannerModel'
import { emitNodeAction } from '../../Planner/NodeChrome'

const PAGE_ICONS: Record<PageType, LucideIcon> = {
  landing: Target, home: Home, product: ShoppingBag, category: FolderOpen, blog: PenLine, checkout: CreditCard,
  cart: ShoppingCart, thank_you: PartyPopper, confirmation: CheckCircle2, form: ClipboardList, webinar: Video, video: Play,
}

type Data = PageNodeData & { thumbnail?: string; thumbnailFor?: string; thumbnailFailedFor?: string; thumbnailPending?: boolean }

/**
 * Página do funil (Funnelytics): cabeçalho colorido por tipo, miniatura real
 * da página quando há URL, e métricas de comportamento quando informadas.
 */
const PageNode: React.FC<NodeProps & { data: Data }> = ({ data, id, selected }) => {
  const config = PAGE_CONFIG[data.pageType] || PAGE_CONFIG.landing
  const Icon = PAGE_ICONS[data.pageType] || Target
  const [broken, setBroken] = useState('')
  const url = String(data.url ?? '').trim()
  const hasShot = isHttpUrl(data.thumbnail) && data.thumbnailFor === url && broken !== data.thumbnail
  const failed = !!url && (data.thumbnailFailedFor === url || broken === data.thumbnail)
  const hasMetrics = [data.bounceRate, data.exitRate, data.avgTimeOnPage, data.scrollDepth].some(v => v !== undefined)
  const bounceColor = data.bounceRate === undefined ? 'text-gray-500' : data.bounceRate < 30 ? 'text-green-600' : data.bounceRate < 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={180} minHeight={100} />
      <div className={`relative min-w-[200px] rounded-lg shadow-lg overflow-hidden bg-white transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`} style={{ border: `2px solid ${config.color}` }}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: config.color }}>
          <span className="text-white"><Icon size={16} /></span>
          <span className="text-white font-semibold text-sm truncate flex-1">{data.label || config.label}</span>
          {url && (
            <button type="button" className="text-white/80 hover:text-white" title="Atualizar miniatura" aria-label="Atualizar miniatura" disabled={!!data.thumbnailPending} onClick={event => { event.stopPropagation(); emitNodeAction(id, 'refresh-thumbnail') }}>
              <RefreshCw size={13} className={data.thumbnailPending ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
        {url && (
          <div className="planner-page-shot planner-page-shot--compact">
            {hasShot ? <img src={data.thumbnail} alt={data.label || url} draggable={false} onError={() => setBroken(String(data.thumbnail))} />
              : data.thumbnailPending ? <div className="planner-page-state"><RefreshCw size={18} className="animate-spin" /><span>Capturando...</span></div>
              : failed ? <div className="planner-page-state"><ImageOff size={18} /><span>Miniatura indisponível</span></div>
              : <div className="planner-page-state"><span className="truncate px-2">{url}</span></div>}
          </div>
        )}
        {(data.visitors !== undefined || hasMetrics) && (
          <div className="p-3 space-y-2">
            {data.visitors !== undefined && (
              <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Visitantes</span><span className="text-sm font-bold text-gray-800">{formatNumber(data.visitors)}</span></div>
            )}
            {data.uniqueVisitors !== undefined && (
              <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Únicos</span><span className="text-sm font-medium text-gray-700">{formatNumber(data.uniqueVisitors)}</span></div>
            )}
            {hasMetrics && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                {data.bounceRate !== undefined && <div className="text-center p-1.5 bg-gray-50 rounded"><div className={`text-sm font-bold ${bounceColor}`}>{formatPercentage(data.bounceRate)}</div><div className="text-[10px] text-gray-400">Bounce</div></div>}
                {data.exitRate !== undefined && <div className="text-center p-1.5 bg-gray-50 rounded"><div className="text-sm font-bold text-orange-600">{formatPercentage(data.exitRate)}</div><div className="text-[10px] text-gray-400">Exit</div></div>}
                {data.avgTimeOnPage !== undefined && <div className="text-center p-1.5 bg-gray-50 rounded"><div className="text-sm font-bold text-blue-600">{Math.floor(data.avgTimeOnPage / 60)}:{(data.avgTimeOnPage % 60).toString().padStart(2, '0')}</div><div className="text-[10px] text-gray-400">Tempo</div></div>}
                {data.scrollDepth !== undefined && <div className="text-center p-1.5 bg-gray-50 rounded"><div className="text-sm font-bold text-purple-600">{formatPercentage(data.scrollDepth)}</div><div className="text-[10px] text-gray-400">Scroll</div></div>}
              </div>
            )}
          </div>
        )}
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-green-500 !border-2 !border-white" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
      </div>
    </>
  )
}

export default memo(PageNode)
