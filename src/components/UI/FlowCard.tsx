import type { Flow } from '@/hooks/useFlows'
import { Calendar, Tag, MoreVertical, Copy, Trash2, Edit } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '@/components/UI/ConfirmDialog'

interface FlowCardProps {
  flow: Flow
  onDuplicate: (flowId: string) => void
  onDelete: (flowId: string) => void
}

export const FlowCard = ({ flow, onDuplicate, onDelete }: FlowCardProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const confirm = useConfirm()

  const handleCardClick = () => {
    navigate(`/editor/${flow.id}`)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDuplicate(flow.id)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    const ok = await confirm({
      title: 'Deletar flow',
      message: `Tem certeza que deseja deletar "${flow.name}"?`,
      confirmLabel: 'Deletar',
      variant: 'danger',
    })
    if (ok) onDelete(flow.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    navigate(`/editor/${flow.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border border-gray-200"
    >
      {/* Thumbnail/Preview */}
      <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative">
        {flow.thumbnail_url ? (
          <img src={flow.thumbnail_url} alt={flow.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400 text-center p-4">
            <div className="text-sm">Preview do Flow</div>
            <div className="text-xs mt-1">{flow.nodes?.length || 0} nodes</div>
          </div>
        )}

        {/* Badge Template */}
        {flow.is_template && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Template
          </div>
        )}

        {/* Menu Dropdown */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Deletar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{flow.name}</h3>
        
        {flow.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{flow.description}</p>
        )}

        {/* Tags */}
        {flow.tags && flow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {flow.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {flow.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{flow.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {new Date(flow.updated_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default FlowCard
