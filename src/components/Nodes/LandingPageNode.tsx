import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { generatePresetThumbnail, generateFreshThumbnailUrl, extractDomain } from '@/lib/cloudinary';
import { ExternalLink, RefreshCw, Globe } from 'lucide-react';

export interface LandingPageData {
  url: string;
  label?: string;
  thumbnail?: string;
  onEdit?: (data: LandingPageData) => void;
}

export default function LandingPageNode({ data, id }: NodeProps<LandingPageData>) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(data.url);
  const [editLabel, setEditLabel] = useState(data.label || '');
  
  const thumbnail = data.thumbnail || generatePresetThumbnail(data.url, 'landingPage');
  const domain = extractDomain(data.url);

  const handleRefresh = () => {
    setIsLoading(true);
    setImageError(false);
    const newThumb = generateFreshThumbnailUrl(data.url, {
      width: 480,
      height: 270,
      crop: 'fill',
      gravity: 'north'
    });
    if (data.onEdit) {
      data.onEdit({ ...data, thumbnail: newThumb });
    }
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSaveEdit = () => {
    if (data.onEdit && editUrl.trim()) {
      const newThumb = generatePresetThumbnail(editUrl, 'landingPage');
      data.onEdit({
        ...data,
        url: editUrl,
        label: editLabel || extractDomain(editUrl),
        thumbnail: newThumb
      });
      setImageError(false);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditUrl(data.url);
    setEditLabel(data.label || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 overflow-hidden w-[380px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-white flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{data.label || 'Landing Page'}</div>
              <div className="text-xs opacity-90 truncate">{domain}</div>
            </div>
          </div>
          <button onClick={handleRefresh} className="p-1.5 hover:bg-white/20 rounded transition-colors flex-shrink-0" title="Atualizar preview" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="p-4 bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL da Landing Page</label>
            <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://exemplo.com/landing-page" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome/Título (opcional)</label>
            <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Minha Landing Page" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSaveEdit} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">Salvar</button>
            <button onClick={handleCancelEdit} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="relative bg-gray-100 h-[220px] cursor-pointer group" onDoubleClick={() => setIsEditing(true)}>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700">Clique 2x para editar</span>
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4">
              <Globe className="w-16 h-16 mb-3 opacity-50" />
              <p className="text-sm font-medium text-center mb-1">Preview indisponível</p>
              <p className="text-xs text-center text-gray-500 break-all px-2">{data.url}</p>
              <button onClick={handleRefresh} className="mt-3 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors">Tentar novamente</button>
            </div>
          ) : (
            <img src={thumbnail} alt={data.label || 'Landing Page'} className="w-full h-full object-cover" onError={() => setImageError(true)} onLoad={() => setIsLoading(false)} />
          )}
        </div>
      )}

      {!isEditing && (
        <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium" onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir página
          </a>
          <span className="text-xs text-gray-400">ID: {id.slice(0, 8)}</span>
        </div>
      )}
    </div>
  );
}
