import React, { useState } from 'react';
import { X, Save, Link, Code, Copy, Check } from 'lucide-react';
import type {
  SourceNodeData,
  PageNodeData,
  ActionNodeData,
  UTMTrackerNodeData,
  SourceType,
  PageType,
  ActionType,
} from '@/types/funnelytics';
import {
  SOURCE_CONFIG,
  PAGE_CONFIG,
  ACTION_CONFIG,
} from '@/types/funnelytics';
import { generateConversionCode } from '@/services/dataIntegration';

// =====================================================
// PROPS TYPES
// =====================================================

interface BaseFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

interface SourceNodeFormProps extends BaseFormProps {
  data: SourceNodeData;
}

interface PageNodeFormProps extends BaseFormProps {
  data: PageNodeData;
}

interface ActionNodeFormProps extends BaseFormProps {
  data: ActionNodeData;
}

interface UTMTrackerFormProps extends BaseFormProps {
  data: UTMTrackerNodeData;
}

// =====================================================
// SOURCE NODE FORM
// =====================================================

export const SourceNodeForm: React.FC<SourceNodeFormProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = useState<SourceNodeData>(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Editar Fonte de Tráfego</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo de Fonte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Fonte
            </label>
            <select
              value={formData.source}
              onChange={(e) => {
                const source = e.target.value as SourceType;
                setFormData({
                  ...formData,
                  source,
                  label: SOURCE_CONFIG[source].label,
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome/Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Campanha Black Friday"
            />
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitas
              </label>
              <input
                type="number"
                value={formData.visits}
                onChange={(e) => setFormData({ ...formData, visits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitantes Únicos
              </label>
              <input
                type="number"
                value={formData.uniqueVisitors || ''}
                onChange={(e) => setFormData({ ...formData, uniqueVisitors: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Custos */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custo Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPC (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cpc || ''}
                onChange={(e) => setFormData({ ...formData, cpc: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPM (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cpm || ''}
                onChange={(e) => setFormData({ ...formData, cpm: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* UTM Parameters */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Parâmetros UTM
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">utm_source</label>
                  <input
                    type="text"
                    value={formData.utm_source || ''}
                    onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="facebook"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">utm_medium</label>
                  <input
                    type="text"
                    value={formData.utm_medium || ''}
                    onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="cpc"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">utm_campaign</label>
                <input
                  type="text"
                  value={formData.utm_campaign || ''}
                  onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="black_friday_2024"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// PAGE NODE FORM
// =====================================================

export const PageNodeForm: React.FC<PageNodeFormProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = useState<PageNodeData>(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Editar Página</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo de Página */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Página
            </label>
            <select
              value={formData.pageType}
              onChange={(e) => {
                const pageType = e.target.value as PageType;
                setFormData({
                  ...formData,
                  pageType,
                  label: PAGE_CONFIG[pageType].label,
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(PAGE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label e URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Página
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Página
            </label>
            <input
              type="text"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="/landing-page"
            />
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitantes
              </label>
              <input
                type="number"
                value={formData.visitors}
                onChange={(e) => setFormData({ ...formData, visitors: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bounce Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.bounceRate || ''}
                onChange={(e) => setFormData({ ...formData, bounceRate: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo Médio (seg)
              </label>
              <input
                type="number"
                value={formData.avgTimeOnPage || ''}
                onChange={(e) => setFormData({ ...formData, avgTimeOnPage: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scroll Depth (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.scrollDepth || ''}
                onChange={(e) => setFormData({ ...formData, scrollDepth: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// ACTION NODE FORM
// =====================================================

export const ActionNodeForm: React.FC<ActionNodeFormProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = useState<ActionNodeData>(data);
  const [showPixelCode, setShowPixelCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const pixelCode = generateConversionCode(formData.label, formData.value);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixelCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Editar Ação</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo de Ação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Ação
            </label>
            <select
              value={formData.actionType}
              onChange={(e) => {
                const actionType = e.target.value as ActionType;
                setFormData({
                  ...formData,
                  actionType,
                  label: ACTION_CONFIG[actionType].label,
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Evento
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conversões
              </label>
              <input
                type="number"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Conversão (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.conversionRate || ''}
                onChange={(e) => setFormData({ ...formData, conversionRate: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Médio (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.avgValue || ''}
                onChange={(e) => setFormData({ ...formData, avgValue: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Código do Pixel */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowPixelCode(!showPixelCode)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Code className="w-4 h-4" />
              {showPixelCode ? 'Ocultar' : 'Ver'} código de rastreamento
            </button>

            {showPixelCode && (
              <div className="mt-3 relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {pixelCode}
                </pre>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// UTM TRACKER FORM
// =====================================================

export const UTMTrackerForm: React.FC<UTMTrackerFormProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = useState<UTMTrackerNodeData>(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Gera URL com UTMs
  const generateUTMUrl = (baseUrl: string) => {
    const params = new URLSearchParams();
    if (formData.utm_source) params.set('utm_source', formData.utm_source);
    if (formData.utm_medium) params.set('utm_medium', formData.utm_medium);
    if (formData.utm_campaign) params.set('utm_campaign', formData.utm_campaign);
    if (formData.utm_content) params.set('utm_content', formData.utm_content);
    if (formData.utm_term) params.set('utm_term', formData.utm_term);

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Configurar UTM Tracker</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome/Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* UTM Parameters */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                utm_source <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.utm_source}
                onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="google, facebook, newsletter"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                utm_medium <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.utm_medium || ''}
                onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="cpc, email, social"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                utm_campaign <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.utm_campaign}
                onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="black_friday_2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                utm_content
              </label>
              <input
                type="text"
                value={formData.utm_content || ''}
                onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="banner_top, link_footer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                utm_term
              </label>
              <input
                type="text"
                value={formData.utm_term || ''}
                onChange={(e) => setFormData({ ...formData, utm_term: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="palavra-chave"
              />
            </div>
          </div>

          {/* URL Preview */}
          {formData.utm_source && formData.utm_campaign && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Preview da URL
              </label>
              <code className="text-xs text-blue-600 break-all">
                {generateUTMUrl('https://seusite.com')}
              </code>
            </div>
          )}

          {/* Métricas */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Métricas (opcional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Visitas</label>
                <input
                  type="number"
                  value={formData.totalVisits || ''}
                  onChange={(e) => setFormData({ ...formData, totalVisits: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Conversões</label>
                <input
                  type="number"
                  value={formData.totalConversions || ''}
                  onChange={(e) => setFormData({ ...formData, totalConversions: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Receita (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalRevenue || ''}
                  onChange={(e) => setFormData({ ...formData, totalRevenue: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ROI (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.roi || ''}
                  onChange={(e) => setFormData({ ...formData, roi: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
