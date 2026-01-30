import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'

interface ShapeNodeData {
  text?: string
  color?: string
  shape?: 'rectangle' | 'circle'
  width?: number
  height?: number
}

interface ShapeNodeProps {
  data: ShapeNodeData
  selected?: boolean
}

const colors = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-400',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
}

function ShapeNode({ data, selected }: ShapeNodeProps) {
  const [text, setText] = useState(data.text || '')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const color = data.color || 'blue'
  const shape = data.shape || 'rectangle'

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={shape === 'circle' ? 100 : 120}
        minHeight={shape === 'circle' ? 100 : 60}
      />
      
      <div
        className={`
          ${colors[color as keyof typeof colors] || colors.blue}
          ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
          shadow-lg
          transition-all duration-200
          flex items-center justify-center
          ${selected ? 'ring-4 ring-blue-400' : ''}
        `}
        style={{
          width: data.width || (shape === 'circle' ? 120 : 160),
          height: data.height || (shape === 'circle' ? 120 : 80),
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 !bg-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-white"
        />

        <div className="w-full h-full flex items-center justify-center p-3">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="w-full bg-transparent border-none text-center text-white font-semibold focus:outline-none"
              placeholder="Texto..."
            />
          ) : (
            <div className="text-white font-semibold text-center truncate px-2">
              {text || 'Clique 2x'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default memo(ShapeNode)
