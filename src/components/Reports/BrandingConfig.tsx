/**
 * BrandingConfig — White-label settings for report PDF export
 */

import { useState } from 'react';
import { Palette, Image, Type, X } from 'lucide-react';
import type { ReportBranding } from '@/services/pdfExportService';

interface Props {
  branding: Partial<ReportBranding>;
  onChange: (branding: Partial<ReportBranding>) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Azul', color: '#1e40af' },
  { name: 'Verde', color: '#059669' },
  { name: 'Roxo', color: '#7c3aed' },
  { name: 'Vermelho', color: '#dc2626' },
  { name: 'Laranja', color: '#ea580c' },
  { name: 'Rosa', color: '#db2777' },
  { name: 'Ciano', color: '#0891b2' },
  { name: 'Cinza', color: '#475569' },
];

export default function BrandingConfig({ branding, onChange, onClose }: Props) {
  const [local, setLocal] = useState<Partial<ReportBranding>>({
    clientName: branding.clientName || '',
    accentColor: branding.accentColor || '#1e40af',
    agencyName: branding.agencyName || 'Efeito Digital — Ads Flow',
    footerText: branding.footerText || 'Relatório gerado automaticamente pelo Ads Flow',
    clientLogo: branding.clientLogo || '',
  });

  const update = (field: keyof ReportBranding, value: string) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onChange(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">White-Label / Marca</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
            <input
              type="text"
              value={local.clientName || ''}
              onChange={(e) => update('clientName', e.target.value)}
              placeholder="Ex: Clínica Saúde Total"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Agency Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Agência</label>
            <input
              type="text"
              value={local.agencyName || ''}
              onChange={(e) => update('agencyName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Client Logo URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Logo do Cliente (URL)</span>
            </label>
            <input
              type="url"
              value={local.clientLogo || ''}
              onChange={(e) => update('clientLogo', e.target.value)}
              placeholder="https://exemplo.com/logo.png"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor Principal</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => update('accentColor', preset.color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    local.accentColor === preset.color ? 'border-slate-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
              <input
                type="color"
                value={local.accentColor || '#1e40af'}
                onChange={(e) => update('accentColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                title="Cor personalizada"
              />
            </div>
          </div>

          {/* Footer Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <span className="flex items-center gap-1"><Type className="w-3.5 h-3.5" /> Texto do Rodapé</span>
            </label>
            <input
              type="text"
              value={local.footerText || ''}
              onChange={(e) => update('footerText', e.target.value)}
              placeholder="Relatório mensal de performance"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">Preview da capa:</p>
            <div
              className="rounded-lg p-4 text-white"
              style={{ backgroundColor: local.accentColor || '#1e40af' }}
            >
              <p className="text-[10px] opacity-80">{local.agencyName}</p>
              <p className="text-sm font-bold mt-1">Relatório de Performance</p>
              {local.clientName && <p className="text-xs opacity-90 mt-0.5">{local.clientName}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
