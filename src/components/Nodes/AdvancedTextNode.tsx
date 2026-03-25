import { useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Type, Bold, Italic, Underline, Square, X } from 'lucide-react';

export interface AdvancedTextData {
  text: string;
  fontSize: number;
  fontFamily: 'Inter' | 'Roboto' | 'Montserrat';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  backgroundColor: string;
  hasBox: boolean;
  boxColor: string;
  boxPadding: number;
  onEdit?: (data: AdvancedTextData) => void;
}

const FONT_FAMILIES = ['Inter', 'Roboto', 'Montserrat'] as const;

const PRESET_COLORS = [
  { name: 'Preto', value: '#000000' },
  { name: 'Branco', value: '#FFFFFF' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Cinza', value: '#6B7280' },
];

export default function AdvancedTextNode({ data, selected }: NodeProps<AdvancedTextData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text || 'Digite seu texto...');
  const [fontSize, setFontSize] = useState(data.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(data.fontFamily || 'Inter');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(data.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(data.fontStyle || 'normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>(data.textDecoration || 'none');
  const [color, setColor] = useState(data.color || '#000000');
  const [backgroundColor, setBackgroundColor] = useState(data.backgroundColor || 'transparent');
  const [hasBox, setHasBox] = useState(data.hasBox ?? false);
  const [boxColor, setBoxColor] = useState(data.boxColor || '#F3F4F6');

  const handleSave = () => {
    if (data.onEdit) {
      data.onEdit({
        ...data,
        text: editText,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        color,
        backgroundColor,
        hasBox,
        boxColor,
        boxPadding: 16
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(data.text || 'Digite seu texto...');
    setFontSize(data.fontSize || 16);
    setFontFamily(data.fontFamily || 'Inter');
    setFontWeight(data.fontWeight || 'normal');
    setFontStyle(data.fontStyle || 'normal');
    setTextDecoration(data.textDecoration || 'none');
    setColor(data.color || '#000000');
    setBackgroundColor(data.backgroundColor || 'transparent');
    setHasBox(data.hasBox ?? false);
    setBoxColor(data.boxColor || '#F3F4F6');
    setIsEditing(false);
  };

  const textStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight,
    fontStyle,
    textDecoration,
    color,
    backgroundColor: hasBox ? 'transparent' : backgroundColor,
    padding: hasBox ? '0' : backgroundColor !== 'transparent' ? '8px 12px' : '0',
    borderRadius: backgroundColor !== 'transparent' && !hasBox ? '4px' : '0',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  };

  const boxStyle = hasBox ? {
    backgroundColor: boxColor,
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid #E5E7EB'
  } : {};

  return (
    <>
    <NodeResizer isVisible={selected} minWidth={200} minHeight={120} />
    <div className="relative min-w-[200px] max-w-[600px]">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-gray-400 border border-white opacity-0 hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-gray-400 border border-white opacity-0 hover:opacity-100 transition-opacity" />

      {isEditing ? (
        <div className="bg-white rounded-lg shadow-xl border-2 border-blue-500 p-4 space-y-3 w-[480px]">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Editar Texto</h3>
            </div>
            <button onClick={handleCancel} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full px-3 py-2 border rounded-md resize-none"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tamanho</label>
              <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min={8} max={72} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fonte</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
                {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md ${fontWeight === 'bold' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}>
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md ${fontStyle === 'italic' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}>
              <Italic className="w-4 h-4" />
            </button>
            <button onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md ${textDecoration === 'underline' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}>
              <Underline className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-2">Cor do Texto</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map(preset => (
                  <button key={preset.value} onClick={() => setColor(preset.value)} className={`w-full h-8 rounded border-2 ${color === preset.value ? 'border-blue-500 scale-110' : 'border-gray-300'}`} style={{ backgroundColor: preset.value }} title={preset.name} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">Fundo</label>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setBackgroundColor('transparent')} className={`w-full h-8 rounded border-2 bg-white ${backgroundColor === 'transparent' ? 'border-blue-500' : 'border-gray-300'}`}>🚫</button>
                {PRESET_COLORS.slice(0, 7).map(preset => (
                  <button key={preset.value} onClick={() => setBackgroundColor(preset.value)} className={`w-full h-8 rounded border-2 ${backgroundColor === preset.value ? 'border-blue-500' : 'border-gray-300'}`} style={{ backgroundColor: preset.value }} />
                ))}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasBox} onChange={(e) => setHasBox(e.target.checked)} className="w-4 h-4" />
            <Square className="w-4 h-4" />
            <span className="text-xs">Adicionar caixa</span>
          </label>

          {hasBox && (
            <div className="grid grid-cols-4 gap-2">
              {[...PRESET_COLORS, { name: 'Cinza Claro', value: '#F3F4F6' }].map(preset => (
                <button key={preset.value} onClick={() => setBoxColor(preset.value)} className={`w-full h-8 rounded border-2 ${boxColor === preset.value ? 'border-blue-500' : 'border-gray-300'}`} style={{ backgroundColor: preset.value }} />
              ))}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded">
            <div style={boxStyle}><div style={textStyle}>{editText || 'Preview'}</div></div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
            <button onClick={handleCancel} className="flex-1 px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="cursor-pointer group relative" onDoubleClick={() => setIsEditing(true)}>
          <div className="absolute -inset-2 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
          <div style={boxStyle}><div style={textStyle}>{data.text || 'Texto...'}</div></div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none">
            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">Clique 2x</span>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
