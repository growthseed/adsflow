import type { NodeProps } from 'reactflow'
import { Handle, Position, NodeResizer } from 'reactflow'
import { useState } from 'react'

export interface PostitData {
  text?: string
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  onEdit?: (data: PostitData) => void
}

const colorMap = {
  yellow: '#fef3c7',
  blue: '#dbeafe',
  green: '#d1fae5',
  pink: '#fce7f3',
  purple: '#e9d5ff',
}

export default function PostitNode({ data, selected }: NodeProps<PostitData>) {
  const [text, setText] = useState(data.text || 'Nota importante...')
  const [isEditing, setIsEditing] = useState(false)
  
  const color = data.color || 'yellow'
  const bgColor = colorMap[color]

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (data.onEdit) {
      data.onEdit({ ...data, text })
    }
  }

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
    <div className="relative" style={{ transform: 'rotate(-1deg)' }}>
      {/* Handles de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-400" />

      {/* Post-it */}
      <div
        className="relative w-48 min-h-[150px] p-4 rounded-sm shadow-lg hover:shadow-xl transition-all cursor-text"
        style={{
          backgroundColor: bgColor,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Thumbtack no topo */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">
          📌
        </div>

        {/* Conteúdo */}
        <div className="mt-4">
          {isEditing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              autoFocus
              className="w-full bg-transparent border-none outline-none resize-none text-gray-700"
              style={{ fontSize: 14 }}
              rows={5}
            />
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap text-sm">
              {text}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
