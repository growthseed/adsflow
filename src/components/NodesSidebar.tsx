import { useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Search } from 'lucide-react'
import BrandIcon from './BrandIcon'

interface NodeTemplate {
  type: string
  label: string
  brand?: string
  category: string
  icon?: string
  defaultData: Record<string, unknown>
}

const nodeTemplates: NodeTemplate[] = [
  // 🎯 FUNNELYTICS - Customer Journey Tracking (NOVO!)
  { type: 'funnelSource', label: 'Google Ads', icon: '🔍', category: 'Funnelytics', defaultData: { source: 'google_ads', label: 'Google Ads', visits: 0, cost: 0, utm_source: 'google', utm_medium: 'cpc' } },
  { type: 'funnelSource', label: 'Facebook Ads', icon: '📘', category: 'Funnelytics', defaultData: { source: 'facebook', label: 'Facebook Ads', visits: 0, cost: 0, utm_source: 'facebook', utm_medium: 'paid' } },
  { type: 'funnelSource', label: 'Instagram', icon: '📸', category: 'Funnelytics', defaultData: { source: 'instagram', label: 'Instagram', visits: 0, cost: 0, utm_source: 'instagram', utm_medium: 'social' } },
  { type: 'funnelSource', label: 'Email Marketing', icon: '✉️', category: 'Funnelytics', defaultData: { source: 'email', label: 'Email Marketing', visits: 0, utm_source: 'email', utm_medium: 'newsletter' } },
  { type: 'funnelSource', label: 'Orgânico', icon: '🌱', category: 'Funnelytics', defaultData: { source: 'organic', label: 'Tráfego Orgânico', visits: 0, utm_source: 'organic' } },
  { type: 'funnelSource', label: 'Direto', icon: '🔗', category: 'Funnelytics', defaultData: { source: 'direct', label: 'Acesso Direto', visits: 0 } },
  { type: 'funnelPage', label: 'Landing Page', icon: '🎯', category: 'Funnelytics', defaultData: { pageType: 'landing', label: 'Landing Page', visitors: 0, bounceRate: 0 } },
  { type: 'funnelPage', label: 'Página de Produto', icon: '🛍️', category: 'Funnelytics', defaultData: { pageType: 'product', label: 'Página de Produto', visitors: 0, bounceRate: 0 } },
  { type: 'funnelPage', label: 'Checkout', icon: '💳', category: 'Funnelytics', defaultData: { pageType: 'checkout', label: 'Checkout', visitors: 0, bounceRate: 0 } },
  { type: 'funnelPage', label: 'Obrigado', icon: '🎉', category: 'Funnelytics', defaultData: { pageType: 'thank_you', label: 'Página de Obrigado', visitors: 0 } },
  { type: 'funnelAction', label: 'Clique CTA', icon: '👆', category: 'Funnelytics', defaultData: { actionType: 'click', label: 'Clique no CTA', conversions: 0 } },
  { type: 'funnelAction', label: 'Envio Form', icon: '📤', category: 'Funnelytics', defaultData: { actionType: 'submit', label: 'Envio de Formulário', conversions: 0 } },
  { type: 'funnelAction', label: 'Compra', icon: '💰', category: 'Funnelytics', defaultData: { actionType: 'purchase', label: 'Compra Realizada', conversions: 0, value: 0 } },
  { type: 'funnelAction', label: 'Add Carrinho', icon: '🛒', category: 'Funnelytics', defaultData: { actionType: 'add_to_cart', label: 'Adicionar ao Carrinho', conversions: 0 } },
  { type: 'utmTracker', label: 'UTM Tracker', icon: '🔗', category: 'Funnelytics', defaultData: { label: 'Rastreamento UTM', utm_source: '', utm_medium: '', utm_campaign: '' } },
  { type: 'funnelVisualization', label: 'Funil Visual', icon: '📊', category: 'Funnelytics', defaultData: { label: 'Funil de Conversão', stages: [{ id: '1', name: 'Visitantes', count: 1000, percentage: 100 }, { id: '2', name: 'Leads', count: 300, percentage: 30 }, { id: '3', name: 'Oportunidades', count: 100, percentage: 10 }, { id: '4', name: 'Vendas', count: 30, percentage: 3 }] } },

  // REDES SOCIAIS (11)
  { type: 'brand', label: 'WhatsApp', brand: 'whatsapp', category: 'Redes Sociais', defaultData: { brand: 'whatsapp', label: 'WhatsApp', isActive: true } },
  { type: 'brand', label: 'Instagram', brand: 'instagram', category: 'Redes Sociais', defaultData: { brand: 'instagram', label: 'Instagram', isActive: true } },
  { type: 'brand', label: 'Facebook', brand: 'facebook', category: 'Redes Sociais', defaultData: { brand: 'facebook', label: 'Facebook', isActive: true } },
  { type: 'brand', label: 'YouTube', brand: 'youtube', category: 'Redes Sociais', defaultData: { brand: 'youtube', label: 'YouTube', isActive: true } },
  { type: 'brand', label: 'LinkedIn', brand: 'linkedin', category: 'Redes Sociais', defaultData: { brand: 'linkedin', label: 'LinkedIn', isActive: true } },
  { type: 'brand', label: 'TikTok', brand: 'tiktok', category: 'Redes Sociais', defaultData: { brand: 'tiktok', label: 'TikTok', isActive: true } },
  { type: 'brand', label: 'Twitter', brand: 'twitter', category: 'Redes Sociais', defaultData: { brand: 'twitter', label: 'Twitter/X', isActive: true } },
  { type: 'brand', label: 'Pinterest', brand: 'pinterest', category: 'Redes Sociais', defaultData: { brand: 'pinterest', label: 'Pinterest', isActive: true } },
  { type: 'brand', label: 'Reddit', brand: 'reddit', category: 'Redes Sociais', defaultData: { brand: 'reddit', label: 'Reddit', isActive: true } },
  { type: 'brand', label: 'Discord', brand: 'discord', category: 'Redes Sociais', defaultData: { brand: 'discord', label: 'Discord', isActive: true } },
  { type: 'brand', label: 'Slack', brand: 'slack', category: 'Redes Sociais', defaultData: { brand: 'slack', label: 'Slack', isActive: true } },

  // ANÚNCIOS (2)
  { type: 'brand', label: 'Meta Ads', brand: 'meta', category: 'Anúncios', defaultData: { brand: 'meta', label: 'Meta Ads', subtitle: 'Facebook & Instagram', isActive: true } },
  { type: 'brand', label: 'Google Ads', brand: 'google', category: 'Anúncios', defaultData: { brand: 'google', label: 'Google Ads', isActive: true } },

  // MENSAGERIA (4)
  { type: 'brand', label: 'Email', brand: 'email', category: 'Mensageria', defaultData: { brand: 'email', label: 'Email Marketing', isActive: true } },
  { type: 'brand', label: 'Telegram', brand: 'telegram', category: 'Mensageria', defaultData: { brand: 'telegram', label: 'Telegram', isActive: true } },
  { type: 'brand', label: 'Messenger', brand: 'messenger', category: 'Mensageria', defaultData: { brand: 'messenger', label: 'Messenger', isActive: true } },
  { type: 'brand', label: 'Mailchimp', brand: 'mailchimp', category: 'Mensageria', defaultData: { brand: 'mailchimp', label: 'Mailchimp', isActive: true } },

  // E-COMMERCE (4)
  { type: 'brand', label: 'Shopify', brand: 'shopify', category: 'E-commerce', defaultData: { brand: 'shopify', label: 'Shopify', isActive: true } },
  { type: 'brand', label: 'WooCommerce', brand: 'woocommerce', category: 'E-commerce', defaultData: { brand: 'woocommerce', label: 'WooCommerce', isActive: true } },
  { type: 'brand', label: 'Stripe', brand: 'stripe', category: 'E-commerce', defaultData: { brand: 'stripe', label: 'Stripe', isActive: true } },
  { type: 'brand', label: 'PayPal', brand: 'paypal', category: 'E-commerce', defaultData: { brand: 'paypal', label: 'PayPal', isActive: true } },

  // CONTEÚDO (3)
  { type: 'brand', label: 'WordPress', brand: 'wordpress', category: 'Conteúdo', defaultData: { brand: 'wordpress', label: 'WordPress', isActive: true } },
  { type: 'brand', label: 'Notion', brand: 'notion', category: 'Conteúdo', defaultData: { brand: 'notion', label: 'Notion', isActive: true } },
  { type: 'brand', label: 'Spotify', brand: 'spotify', category: 'Conteúdo', defaultData: { brand: 'spotify', label: 'Spotify', isActive: true } },

  // AUTOMAÇÃO (2)
  { type: 'brand', label: 'Zapier', brand: 'zapier', category: 'Automação', defaultData: { brand: 'zapier', label: 'Zapier', isActive: true } },
  { type: 'brand', label: 'HubSpot', brand: 'hubspot', category: 'Automação', defaultData: { brand: 'hubspot', label: 'HubSpot', isActive: true } },

  // CANAIS (6)
  { type: 'channel', label: 'WhatsApp', category: 'Canais', defaultData: { channelType: 'whatsapp', label: 'WhatsApp', icon: '💬' } },
  { type: 'channel', label: 'Website', category: 'Canais', defaultData: { channelType: 'website', label: 'Website', icon: '🌐' } },
  { type: 'channel', label: 'Form', category: 'Canais', defaultData: { channelType: 'form', label: 'Formulário', icon: '📝' } },
  { type: 'channel', label: 'Email', category: 'Canais', defaultData: { channelType: 'email', label: 'Email', icon: '✉️' } },
  { type: 'channel', label: 'Phone', category: 'Canais', defaultData: { channelType: 'phone', label: 'Telefone', icon: '📞' } },
  { type: 'channel', label: 'Store', category: 'Canais', defaultData: { channelType: 'store', label: 'Loja Física', icon: '🏪' } },

  // CAMPANHA VISUAL (6)
  { type: 'visualCampaign', label: 'Campanha', category: 'Campanha Visual', defaultData: { label: 'Nova Campanha', objective: 'Conversões', budget: 'R$ 500/dia', status: 'draft' } },
  { type: 'visualAudience', label: 'Público-Alvo', category: 'Campanha Visual', defaultData: { label: 'Público Brasil', size: '500K pessoas', location: 'Brasil', ageRange: '25-45 anos' } },
  { type: 'visualCreative', label: 'Imagem', category: 'Campanha Visual', defaultData: { label: 'Criativo Principal', format: 'image', dimensions: '1080x1080' } },
  { type: 'visualCreative', label: 'Vídeo', category: 'Campanha Visual', defaultData: { label: 'Vídeo Promocional', format: 'video', dimensions: '1080x1920' } },
  { type: 'visualCreative', label: 'Carrossel', category: 'Campanha Visual', defaultData: { label: 'Carrossel Multi-Produto', format: 'carousel', dimensions: '1080x1080' } },
  { type: 'visualCreative', label: 'Coleção', category: 'Campanha Visual', defaultData: { label: 'Coleção de Produtos', format: 'collection' } },

  // CAMPANHA DETALHADA (6)
  { type: 'campaign', label: 'Campanha (Form)', category: 'Campanha Detalhada', defaultData: { campaignName: 'Nova Campanha', objective: 'CONVERSIONS' } },
  { type: 'trafficSource', label: 'Fonte Tráfego', category: 'Campanha Detalhada', defaultData: { source: 'facebook', campaignName: 'Nova Campanha' } },
  { type: 'adSet', label: 'Conjunto (Form)', category: 'Campanha Detalhada', defaultData: { adSetName: 'Novo Conjunto', targeting: { age_min: 18, age_max: 65 } } },
  { type: 'ad', label: 'Anúncio (Form)', category: 'Campanha Detalhada', defaultData: { adName: 'Novo Anúncio', creative: { type: 'image' } } },
  { type: 'audience', label: 'Audiência', category: 'Campanha Detalhada', defaultData: { label: 'Audiência Personalizada', type: 'custom' } },
  { type: 'result', label: 'Resultado', category: 'Campanha Detalhada', defaultData: { label: 'Meta de Vendas', metric: 'Vendas', target: '100' } },

  // DESTINOS (1)
  { type: 'landingPage', label: '🌐 Landing Page', category: 'Destinos', defaultData: { url: 'https://exemplo.com', label: 'Minha Landing Page' } },

  // ELEMENTOS VISUAIS (5)
  { type: 'advancedText', label: '✏️ Texto Formatado', category: 'Elementos Visuais', defaultData: { text: 'Texto personalizado', fontSize: 16, fontFamily: 'Inter', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', color: '#000000', backgroundColor: 'transparent', hasBox: false, boxColor: '#F3F4F6', boxPadding: 16 } },
  { type: 'shape', label: '⭕ Círculo', category: 'Elementos Visuais', defaultData: { shapeType: 'circle', color: '#3b82f6', size: 100 } },
  { type: 'shape', label: '⬜ Quadrado', category: 'Elementos Visuais', defaultData: { shapeType: 'square', color: '#10b981', size: 100 } },
  { type: 'textbox', label: '📝 Caixa de Texto', category: 'Elementos Visuais', defaultData: { text: 'Digite aqui...', fontSize: 14, color: '#1f2937' } },
  { type: 'postit', label: '📌 Post-it', category: 'Elementos Visuais', defaultData: { text: 'Nota importante...', color: 'yellow' } },
]

const NodesSidebar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(['Mensageria', 'E-commerce', 'Conteúdo', 'Automação', 'Canais', 'Campanha Detalhada', 'Destinos'])
  )

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const filteredTemplates = nodeTemplates.filter(template =>
    template.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = Array.from(new Set(filteredTemplates.map(t => t.category)))

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: template.type,
      data: template.defaultData
    }))
  }

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Componentes</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar componente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {categories.map(category => {
          const categoryNodes = filteredTemplates.filter(t => t.category === category)
          const isCollapsed = collapsedCategories.has(category)

          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>{category} ({categoryNodes.length})</span>
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Category Nodes */}
              {!isCollapsed && (
                <div className="space-y-2 pl-2">
                  {categoryNodes.map((template) => (
                    <div
                      key={`${template.type}-${template.label}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, template)}
                      className="group flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-blue-300 rounded-lg cursor-move transition-all"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      
                      {template.brand ? (
                        <BrandIcon name={template.brand} size={20} className="text-gray-600" />
                      ) : template.icon ? (
                        <span className="text-lg">{template.icon}</span>
                      ) : null}

                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {template.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Arraste componentes para o canvas
        </p>
      </div>
    </div>
  )
}

export default NodesSidebar
