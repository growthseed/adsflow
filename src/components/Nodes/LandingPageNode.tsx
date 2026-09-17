import { useState } from 'react'
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react'
import { ExternalLink, RefreshCw, Globe, ImageOff } from 'lucide-react'
import { extractDomain } from '@/lib/cloudinary'
import { isHttpUrl } from '@/components/Planner/plannerModel'
import { emitNodeAction } from '@/components/Planner/NodeChrome'

export interface LandingPageData {
  url: string
  label?: string
  /** Miniatura real da página (JPEG no storage do cliente), preenchida pelo editor. */
  thumbnail?: string
  thumbnailFor?: string
  thumbnailFailedFor?: string
  thumbnailPending?: boolean
  thumbnailAt?: string
}

/**
 * Node de página estilo Funnelytics: cabeçalho com domínio, miniatura real do
 * site (capturada pelo servidor e guardada no storage) e link para abrir. A
 * captura é disparada pelo editor; o botão de atualizar só emite o pedido.
 */
export default function LandingPageNode({ data, id, selected }: NodeProps & { data: LandingPageData }) {
  const [broken, setBroken] = useState('')
  const url = String(data.url ?? '').trim()
  const domain = url ? extractDomain(url) : 'Sem URL'
  const hasShot = isHttpUrl(data.thumbnail) && data.thumbnailFor === url && broken !== data.thumbnail
  const failed = !!url && (data.thumbnailFailedFor === url || broken === data.thumbnail)

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={240} minHeight={160} keepAspectRatio />
      <div className={`planner-page-node${selected ? ' is-selected' : ''}`}>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
        <div className="planner-page-head">
          <span className="planner-page-glyph"><Globe size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="planner-page-title">{data.label || 'Landing Page'}</div>
            <div className="planner-page-domain">{domain}</div>
          </div>
          {url && (
            <button type="button" className="planner-page-refresh" title="Atualizar miniatura" aria-label="Atualizar miniatura" disabled={!!data.thumbnailPending} onClick={event => { event.stopPropagation(); emitNodeAction(id, 'refresh-thumbnail') }}>
              <RefreshCw size={14} className={data.thumbnailPending ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
        <div className="planner-page-shot">
          {hasShot ? (
            <img src={data.thumbnail} alt={data.label || domain} draggable={false} onError={() => setBroken(String(data.thumbnail))} />
          ) : data.thumbnailPending ? (
            <div className="planner-page-state"><RefreshCw size={22} className="animate-spin" /><span>Capturando a página...</span></div>
          ) : failed ? (
            <div className="planner-page-state"><ImageOff size={22} /><span>Miniatura indisponível</span><button type="button" onClick={event => { event.stopPropagation(); emitNodeAction(id, 'refresh-thumbnail') }}>Tentar de novo</button></div>
          ) : (
            <div className="planner-page-state"><Globe size={22} /><span>{url ? 'Miniatura será gerada ao salvar a URL' : 'Informe a URL da página no painel'}</span></div>
          )}
        </div>
        <div className="planner-page-foot">
          {isHttpUrl(url) ? (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}><ExternalLink size={13} />Abrir página</a>
          ) : <span>Sem URL</span>}
          {data.thumbnailAt && <time dateTime={data.thumbnailAt}>{new Date(data.thumbnailAt).toLocaleDateString('pt-BR')}</time>}
        </div>
      </div>
    </>
  )
}
