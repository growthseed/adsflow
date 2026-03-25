/**
 * WidgetWrapper — Chrome around each widget: title bar, drag handle, action menu
 */

import { useState } from 'react';
import { GripVertical, MoreVertical, Trash2, Settings, Copy } from 'lucide-react';

interface Props {
  title: string;
  editing: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  children: React.ReactNode;
}

export default function WidgetWrapper({ title, editing, onEdit, onDelete, onDuplicate, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50 min-h-[36px]">
        <div className="flex items-center gap-1.5 min-w-0">
          {editing && (
            <div className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-medium text-slate-700 truncate">
            {title || 'Widget'}
          </span>
        </div>

        {editing && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-300 hover:text-slate-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  {onEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configurar
                    </button>
                  )}
                  {onDuplicate && (
                    <button
                      onClick={() => { setMenuOpen(false); onDuplicate(); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Widget content */}
      <div className="flex-1 overflow-hidden p-2">
        {children}
      </div>
    </div>
  );
}
