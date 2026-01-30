import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'

interface PostItNodeData {
  text?: string
  color?: string
  width?: number
  height?: number
}

interface PostItNodeProps {
  data: PostItNodeData
  selected?: boolean
}

const colors = {
  yellow: 'bg-yellow-100 border-yellow-300',
  pink: 'bg-pink-100 border-pink-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  orange: 'bg-orange-100 border-orange-300',
}

function PostItNode({ data, selected }: PostItNodeProps) {
  const [text, setText] = useState(data.text || '')
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const color = data.color || 'yellow'

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={150}
        minHeight={150}
      />
      
      <div
        className={`
          ${colors[color as keyof typeof colors] || colors.yellow}
          border-2 shadow-lg
          transition-all duration-200
          ${selected ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{
          width: data.width || 200,
          height: data.height || 200,
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 !bg-gray-400"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-gray-400"
        />

        <div className="w-full h-full p-4">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-gray-800 font-handwriting text-base"
              placeholder="Digite aqui..."
            />
          ) : (
            <div className="w-full h-full text-gray-800 font-handwriting text-base whitespace-pre-wrap break-words overflow-y-auto">
              {text || 'Clique 2x para editar'}
            </div>
          )}
        </div>

        {/* Sombra simulando post-it */}
        <div className="absolute -bottom-1 -right-1 w-full h-full bg-black/5 -z-10 rounded-sm" />
      </div>
    </>
  )
}

export default memo(PostItNode)
