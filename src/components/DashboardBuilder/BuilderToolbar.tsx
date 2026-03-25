/**
 * BuilderToolbar — Top bar with dashboard name, save, preview toggle, etc.
 */

import { useState } from 'react';
import {
  Save, Eye, Pencil, Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  name: string;
  saving: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
}

export default function BuilderToolbar({
  name,
  saving,
  editing,
  onToggleEdit,
  onNameChange,
  onSave,
}: Props) {
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {editingName ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="text-lg font-semibold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent px-1"
            autoFocus
          />
        ) : (
          <button
            onClick={() => { setTempName(name); setEditingName(true); }}
            className="text-lg font-semibold text-slate-900 hover:text-blue-700 flex items-center gap-1.5"
          >
            {name}
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleEdit}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            editing
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {editing ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {editing ? 'Editando' : 'Visualizando'}
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}
