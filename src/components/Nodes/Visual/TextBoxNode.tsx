import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'

interface TextBoxNodeData {
  text?: string
  fontSize?: number
  width?: number
  height?: number
  backgroundColor?: string
  textColor?: string
}

interface TextBoxNodeProps {
  data: TextBoxNodeData
  selected?: boolean
}

function TextBoxNode({ data, selected }: TextBoxNodeProps) {
  const [text, setText] = useState(data.text || '')
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  return (
    <>
      <NodeResizer 
        isVisible={selected}
        minWidth={200}
        minHeight={100}
      />
      
      <div
        className={`
          border-2 border-dashed border-gray-300
          bg-white
          transition-all duration-200
          ${selected ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{
          width: data.width || 300,
          height: data.height || 150,
          backgroundColor: data.backgroundColor || 'white',
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
              className="w-full h-full bg-transparent border-none resize-none focus:outline-none"
              style={{
                fontSize: `${data.fontSize || 14}px`,
                color: data.textColor || '#1f2937',
              }}
              placeholder="Digite seu texto aqui..."
            />
          ) : (
            <div 
              className="w-full h-full whitespace-pre-wrap break-words overflow-y-auto"
              style={{
                fontSize: `${data.fontSize || 14}px`,
                color: data.textColor || '#1f2937',
              }}
            >
              {text || 'Clique 2x para editar'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default memo(TextBoxNode)
