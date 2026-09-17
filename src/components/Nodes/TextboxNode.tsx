import type { NodeProps } from '@xyflow/react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { useState } from 'react'

export interface TextboxData {
  text?: string
  fontSize?: number
  onEdit?: (data: TextboxData) => void
}

export default function TextboxNode({ data, selected }: NodeProps & { data: TextboxData }) {
  const [text, setText] = useState(data.text || 'Digite aqui...')
  const [isEditing, setIsEditing] = useState(false)
  
  const fontSize = data.fontSize || 14

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
    <div className="relative">
      {/* Handles de conexão */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-400" />

      {/* Textbox */}
      <div
        className="bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-text"
        style={{
          minWidth: 200,
          maxWidth: 400,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="w-full p-4 bg-transparent border-none outline-none resize-none"
            style={{ fontSize }}
            rows={4}
          />
        ) : (
          <div
            className="p-4 text-gray-700 whitespace-pre-wrap"
            style={{ fontSize }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
