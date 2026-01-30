import React, { useState } from 'react';
import { X, RefreshCw, Check, AlertCircle, Copy, Code, ExternalLink } from 'lucide-react';
import type { IntegrationSource, IntegrationConfig } from '@/services/dataIntegration';
import { generatePixelCode } from '@/services/dataIntegration';

interface IntegrationModalProps {
  flowId: string;
  currentConfig?: IntegrationConfig;
  onSave: (config: IntegrationConfig) => void;
  onClose: () => void;
}

const INTEGRATION_OPTIONS: { id: IntegrationSource; name: string; icon: string; description: string }[] = [
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    icon: '📘',
    description: 'Sincronize campanhas do Facebook e Instagram Ads',
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics 4',
    icon: '📊',
    description: 'Importe dados de páginas, eventos e UTMs do GA4',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    icon: '🔍',
    description: 'Sincronize campanhas do Google Ads',
  },
  {
    id: 'webhook',
    name: 'Pixel/Webhook',
    icon: '🔗',
    description: 'Instale um pixel no seu site para rastrear eventos em tempo real',
  },
  {
    id: 'csv_import',
    name: 'Importar CSV',
    icon: '📄',
    description: 'Importe dados históricos de uma planilha',
  },
  {
    id: 'manual',
    name: 'Entrada Manual',
    icon: '✏️',
    description: 'Insira os dados manualmente nos nós',
  },
];

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  flowId,
  currentConfig,
  onSave,
  onClose,
}) => {
  const [selectedSource, setSelectedSource] = useState<IntegrationSource>(
    currentConfig?.source || 'manual'
  );
  const [config, setConfig] = useState<IntegrationConfig>(
    currentConfig || { source: 'manual' }
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  // Webhook URL para o pixel
  const webhookUrl = `${window.location.origin}/api/webhook/${flowId}`;

  const handleSourceSelect = (source: IntegrationSource) => {
    setSelectedSource(source);
    setConfig({ ...config, source });
    setConnectionStatus('idle');
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      // Simular conexão - será substituído pela integração real
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validar credenciais
      if (selectedSource === 'meta_ads' && !config.credentials?.accountId) {
        throw new Error('Account ID é obrigatório');
      }
      if (selectedSource === 'google_analytics' && !config.credentials?.propertyId) {
        throw new Error('Property ID é obrigatório');
      }

      setConnectionStatus('success');
    } catch (error) {
      console.error('Erro na conexão:', error);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...config,
      source: selectedSource,
      lastSync: new Date(),
    });
    onClose();
  };

  const copyPixelCode = () => {
    const code = generatePixelCode(flowId, webhookUrl);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configurar Integração de Dados</h2>
            <p className="text-sm text-gray-500">Escolha como os dados serão importados para os nós</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {/* Integration Options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {INTEGRATION_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSourceSelect(option.id)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${selectedSource === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Configuration Forms */}
          <div className="border-t pt-4">
            {/* Meta Ads Config */}
            {selectedSource === 'meta_ads' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Configuração Meta Ads</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.credentials?.accountId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      credentials: { ...config.credentials, accountId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="act_123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Encontre em: Meta Business Suite → Configurações → Informações da Conta
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={config.credentials?.accessToken || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      credentials: { ...config.credentials, accessToken: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••••••••••"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !config.credentials?.accountId}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg
                             hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : connectionStatus === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isConnecting ? 'Conectando...' : connectionStatus === 'success' ? 'Conectado!' : 'Conectar com Meta'}
                </button>
              </div>
            )}

            {/* Google Analytics Config */}
            {selectedSource === 'google_analytics' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Configuração Google Analytics 4</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.credentials?.propertyId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      credentials: { ...config.credentials, propertyId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement ID
                  </label>
                  <input
                    type="text"
                    value={config.credentials?.measurementId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      credentials: { ...config.credentials, measurementId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !config.credentials?.propertyId}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4285F4] text-white rounded-lg
                             hover:bg-[#3367d6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : connectionStatus === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isConnecting ? 'Conectando...' : connectionStatus === 'success' ? 'Conectado!' : 'Conectar com Google'}
                </button>
              </div>
            )}

            {/* Webhook/Pixel Config */}
            {selectedSource === 'webhook' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Pixel de Rastreamento</h3>
                <p className="text-sm text-gray-600">
                  Instale este código no seu site para rastrear visitantes e eventos em tempo real.
                </p>

                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-xs text-gray-100 overflow-x-auto whitespace-pre-wrap">
                    {generatePixelCode(flowId, webhookUrl)}
                  </pre>
                  <button
                    onClick={copyPixelCode}
                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Como usar
                  </h4>
                  <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                    <li>Copie o código acima</li>
                    <li>Cole antes do fechamento da tag {'</head>'} no seu site</li>
                    <li>Para rastrear cliques, adicione <code className="bg-blue-100 px-1 rounded">data-ef-track="nome_evento"</code> aos elementos</li>
                    <li>Para conversões, use <code className="bg-blue-100 px-1 rounded">efTrack('conversion', {'{eventName: "compra"}'})</code></li>
                  </ol>
                </div>
              </div>
            )}

            {/* CSV Import */}
            {selectedSource === 'csv_import' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Importar Dados de CSV</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={(e) => {
                      // TODO: Processar arquivo CSV
                      console.log('Arquivo selecionado:', e.target.files?.[0]);
                    }}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer"
                  >
                    <div className="text-4xl mb-2">📄</div>
                    <div className="text-gray-600">
                      Arraste um arquivo CSV ou{' '}
                      <span className="text-blue-600 hover:underline">clique para selecionar</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Formato: source, visits, conversions, cost
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Manual */}
            {selectedSource === 'manual' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Entrada Manual</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Com esta opção, você pode editar os dados diretamente em cada nó do fluxo.
                    Clique em qualquer nó Funnelytics para abrir o formulário de edição.
                  </p>
                  <ul className="mt-3 text-sm text-gray-600 space-y-1">
                    <li>✅ Ideal para demonstrações e planejamento</li>
                    <li>✅ Não requer integrações externas</li>
                    <li>✅ Total controle sobre os dados</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {connectionStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Erro ao conectar. Verifique suas credenciais.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;
