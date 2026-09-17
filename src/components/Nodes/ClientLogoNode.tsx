import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ImageOff } from 'lucide-react'
import { logoSize } from '../Planner/plannerModel'

export interface ClientLogoData {
  label: string
  logoUrl: string
  size?: 'S' | 'M' | 'L'
  background?: string
  fit?: 'contain' | 'cover'
  padding?: number
  stage?: string
  notes?: string
  taskUrl?: string
}
function ClientLogoNode({ data, isConnectable }: NodeProps & { data: ClientLogoData }) {
  const [failedUrl, setFailedUrl] = useState('')
  const size = logoSize(data.size)
  return <div style={{ width: size, height: size, position: 'relative' }} title={data.label}>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: data.background || '#ffffff', border: '1px solid #d7dfdf', padding: data.fit === 'cover' ? 0 : Math.min(20, Math.max(0, data.padding ?? 8)), display: 'grid', placeItems: 'center', boxShadow: '0 3px 10px #24323014' }}>
      {data.logoUrl && failedUrl !== data.logoUrl ? <img src={data.logoUrl} alt={data.label} draggable={false} onError={() => setFailedUrl(data.logoUrl)} style={{ width: '100%', height: '100%', objectFit: data.fit ?? 'contain' }} /> : <ImageOff size={24} color="#6b7775" />}
    </div>
    <span style={{ position: 'absolute', top: '100%', left: -20, right: -20, paddingTop: 6, textAlign: 'center', fontSize: 11, lineHeight: 1.3, overflowWrap: 'anywhere', color: '#344541', pointerEvents: 'none' }}>{data.label}</span>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
  </div>
}
export default memo(ClientLogoNode)
