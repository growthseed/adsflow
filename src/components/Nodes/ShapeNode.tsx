import type { NodeProps } from 'reactflow'
import { Handle, Position, NodeResizer } from 'reactflow'
import { useState } from 'react'

export interface ShapeData {
  shapeType: 'circle' | 'square'
  color?: string
  size?: number
  label?: string
  onEdit?: (data: ShapeData) => void
}

export default function ShapeNode({ data, selected }: NodeProps<ShapeData>) {
  const [label, setLabel] = useState(data.label || data.shapeType === 'circle' ? 'Círculo' : 'Quadrado')
  const [isEditing, setIsEditing] = useState(false)
  
  const shapeType = data.shapeType || 'circle'
  const color = data.color || (shapeType === 'circle' ? '#3b82f6' : '#10b981')
  const size = data.size || 100

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (data.onEdit) {
      data.onEdit({ ...data, label })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      if (data.onEdit) {
        data.onEdit({ ...data, label })
      }
    }
  }

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div className="relative">
      {/* Handles de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-400" />

      {/* Shape */}
      <div
        className="flex items-center justify-center border-2 border-white shadow-lg hover:shadow-xl transition-all cursor-pointer"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: shapeType === 'circle' ? '50%' : '8px',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-20 px-2 py-1 text-sm text-center text-white bg-white/20 border border-white/50 rounded outline-none"
          />
        ) : (
          <span className="text-sm font-medium text-white px-2 text-center">
            {label}
          </span>
        )}
      </div>
    </div>
    </>
  )
}
