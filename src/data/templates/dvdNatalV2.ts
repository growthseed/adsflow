// Template: DVD de Natal V2
// Estrutura completa com canais orgânicos + Meta Ads

export const dvdNatalV2Template = {
  id: 'dvd-natal-v2',
  name: 'DVD Natal V2 - Campanha Completa',
  description: 'Template completo com 4 canais orgânicos e campanha Meta Ads com 15 anúncios',
  category: 'Natal',
  thumbnail: '/templates/dvd-natal-v2.png',
  
  nodes: [
    // ============================================
    // CANAIS ORGÂNICOS (4)
    // ============================================
    
    // 1. WhatsApp Orgânico
    {
      id: 'whatsapp-organico',
      type: 'brand',
      position: { x: 100, y: 100 },
      data: {
        brand: 'whatsapp',
        label: 'WhatsApp',
        subtitle: 'Canal Orgânico',
        description: 'Divulgação direta para lista de transmissão',
        status: 'Ativo',
        isActive: true
      }
    },

    // 2. Website/Landing Page
    {
      id: 'website-lp',
      type: 'brand',
      position: { x: 100, y: 250 },
      data: {
        brand: 'wordpress',
        label: 'Landing Page',
        subtitle: 'Site Oficial',
        description: 'Página de venda do DVD de Natal',
        status: 'Publicado',
        isActive: true
      }
    },

    // 3. Instagram Orgânico
    {
      id: 'instagram-organico',
      type: 'brand',
      position: { x: 100, y: 400 },
      data: {
        brand: 'instagram',
        label: 'Instagram',
        subtitle: 'Feed & Stories',
        description: 'Posts orgânicos divulgando o DVD',
        status: 'Ativo',
        isActive: true
      }
    },

    // 4. Facebook Orgânico
    {
      id: 'facebook-organico',
      type: 'brand',
      position: { x: 100, y: 550 },
      data: {
        brand: 'facebook',
        label: 'Facebook',
        subtitle: 'Página & Grupos',
        description: 'Posts na página oficial',
        status: 'Ativo',
        isActive: true
      }
    },

    // ============================================
    // CAMPANHA META ADS
    // ============================================

    // Meta Ads Platform
    {
      id: 'meta-ads-platform',
      type: 'brand',
      position: { x: 450, y: 100 },
      data: {
        brand: 'meta',
        label: 'Meta Ads',
        subtitle: 'Facebook & Instagram',
        description: 'Plataforma de anúncios pagos',
        status: 'Ativo',
        isActive: true
      }
    },

    // Campanha Principal
    {
      id: 'campanha-dvd-natal',
      type: 'visualCampaign',
      position: { x: 750, y: 100 },
      data: {
        label: 'Campanha DVD Natal 2024',
        objective: 'Conversões',
        budget: 'R$ 1.500/dia',
        status: 'active'
      }
    },

    // Público-Alvo
    {
      id: 'publico-dvd-natal',
      type: 'visualAudience',
      position: { x: 1050, y: 100 },
      data: {
        label: 'Público Gospel Brasil',
        size: '2M pessoas',
        location: 'Brasil',
        ageRange: '25-65 anos',
        interests: 'Música gospel, Natal, Família'
      }
    },

    // ============================================
    // CRIATIVOS - 15 ANÚNCIOS
    // ============================================

    // Anúncios 1-5: Imagens Estáticas
    {
      id: 'ad-img-1',
      type: 'visualCreative',
      position: { x: 1400, y: -100 },
      data: {
        label: 'Capa DVD - Principal',
        format: 'image',
        dimensions: '1080x1080',
        url: 'https://exemplo.com/capa-dvd.jpg'
      }
    },
    {
      id: 'ad-img-2',
      type: 'visualCreative',
      position: { x: 1400, y: 20 },
      data: {
        label: 'Bastidores Gravação',
        format: 'image',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-img-3',
      type: 'visualCreative',
      position: { x: 1400, y: 140 },
      data: {
        label: 'Depoimento Fãs',
        format: 'image',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-img-4',
      type: 'visualCreative',
      position: { x: 1400, y: 260 },
      data: {
        label: 'Lista de Músicas',
        format: 'image',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-img-5',
      type: 'visualCreative',
      position: { x: 1400, y: 380 },
      data: {
        label: 'Oferta Limitada',
        format: 'image',
        dimensions: '1080x1080'
      }
    },

    // Anúncios 6-10: Vídeos
    {
      id: 'ad-video-1',
      type: 'visualCreative',
      position: { x: 1700, y: -100 },
      data: {
        label: 'Trailer DVD (30s)',
        format: 'video',
        dimensions: '1080x1920'
      }
    },
    {
      id: 'ad-video-2',
      type: 'visualCreative',
      position: { x: 1700, y: 20 },
      data: {
        label: 'Making Of (15s)',
        format: 'video',
        dimensions: '1080x1920'
      }
    },
    {
      id: 'ad-video-3',
      type: 'visualCreative',
      position: { x: 1700, y: 140 },
      data: {
        label: 'Preview Música 1 (10s)',
        format: 'video',
        dimensions: '1080x1920'
      }
    },
    {
      id: 'ad-video-4',
      type: 'visualCreative',
      position: { x: 1700, y: 260 },
      data: {
        label: 'Preview Música 2 (10s)',
        format: 'video',
        dimensions: '1080x1920'
      }
    },
    {
      id: 'ad-video-5',
      type: 'visualCreative',
      position: { x: 1700, y: 380 },
      data: {
        label: 'Testemunho Cliente (20s)',
        format: 'video',
        dimensions: '1080x1920'
      }
    },

    // Anúncios 11-15: Carrosséis
    {
      id: 'ad-carousel-1',
      type: 'visualCreative',
      position: { x: 2000, y: -50 },
      data: {
        label: 'Músicas do DVD (6 cards)',
        format: 'carousel',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-carousel-2',
      type: 'visualCreative',
      position: { x: 2000, y: 90 },
      data: {
        label: 'Bastidores (5 fotos)',
        format: 'carousel',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-carousel-3',
      type: 'visualCreative',
      position: { x: 2000, y: 230 },
      data: {
        label: 'Benefícios DVD (4 cards)',
        format: 'carousel',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-carousel-4',
      type: 'visualCreative',
      position: { x: 2000, y: 370 },
      data: {
        label: 'Antes/Depois (3 cards)',
        format: 'carousel',
        dimensions: '1080x1080'
      }
    },
    {
      id: 'ad-carousel-5',
      type: 'visualCreative',
      position: { x: 2000, y: 510 },
      data: {
        label: 'Reviews Clientes (5 cards)',
        format: 'carousel',
        dimensions: '1080x1080'
      }
    },

    // Landing Page de Conversão
    {
      id: 'lp-checkout',
      type: 'brand',
      position: { x: 2350, y: 200 },
      data: {
        brand: 'shopify',
        label: 'Checkout',
        subtitle: 'Página de Venda',
        description: 'Finalização da compra do DVD',
        status: 'Ativo',
        isActive: true
      }
    },

    // Resultado Final
    {
      id: 'resultado-vendas',
      type: 'result',
      position: { x: 2650, y: 200 },
      data: {
        label: 'Meta de Vendas',
        metric: 'Vendas',
        target: '500',
        achieved: '387',
        percentage: 77
      }
    },
  ],

  edges: [
    // Canais Orgânicos → Landing Page
    { id: 'e1', source: 'whatsapp-organico', target: 'website-lp', animated: true, type: 'smoothstep' },
    { id: 'e2', source: 'instagram-organico', target: 'website-lp', animated: true, type: 'smoothstep' },
    { id: 'e3', source: 'facebook-organico', target: 'website-lp', animated: true, type: 'smoothstep' },

    // Meta Ads → Campanha
    { id: 'e4', source: 'meta-ads-platform', target: 'campanha-dvd-natal', animated: true, type: 'smoothstep' },

    // Campanha → Público
    { id: 'e5', source: 'campanha-dvd-natal', target: 'publico-dvd-natal', animated: true, type: 'smoothstep' },

    // Público → Todos os 15 Anúncios
    { id: 'e6', source: 'publico-dvd-natal', target: 'ad-img-1', animated: true, type: 'smoothstep' },
    { id: 'e7', source: 'publico-dvd-natal', target: 'ad-img-2', animated: true, type: 'smoothstep' },
    { id: 'e8', source: 'publico-dvd-natal', target: 'ad-img-3', animated: true, type: 'smoothstep' },
    { id: 'e9', source: 'publico-dvd-natal', target: 'ad-img-4', animated: true, type: 'smoothstep' },
    { id: 'e10', source: 'publico-dvd-natal', target: 'ad-img-5', animated: true, type: 'smoothstep' },
    { id: 'e11', source: 'publico-dvd-natal', target: 'ad-video-1', animated: true, type: 'smoothstep' },
    { id: 'e12', source: 'publico-dvd-natal', target: 'ad-video-2', animated: true, type: 'smoothstep' },
    { id: 'e13', source: 'publico-dvd-natal', target: 'ad-video-3', animated: true, type: 'smoothstep' },
    { id: 'e14', source: 'publico-dvd-natal', target: 'ad-video-4', animated: true, type: 'smoothstep' },
    { id: 'e15', source: 'publico-dvd-natal', target: 'ad-video-5', animated: true, type: 'smoothstep' },
    { id: 'e16', source: 'publico-dvd-natal', target: 'ad-carousel-1', animated: true, type: 'smoothstep' },
    { id: 'e17', source: 'publico-dvd-natal', target: 'ad-carousel-2', animated: true, type: 'smoothstep' },
    { id: 'e18', source: 'publico-dvd-natal', target: 'ad-carousel-3', animated: true, type: 'smoothstep' },
    { id: 'e19', source: 'publico-dvd-natal', target: 'ad-carousel-4', animated: true, type: 'smoothstep' },
    { id: 'e20', source: 'publico-dvd-natal', target: 'ad-carousel-5', animated: true, type: 'smoothstep' },

    // Todos os Anúncios → Checkout
    { id: 'e21', source: 'ad-img-1', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e22', source: 'ad-img-2', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e23', source: 'ad-img-3', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e24', source: 'ad-img-4', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e25', source: 'ad-img-5', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e26', source: 'ad-video-1', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e27', source: 'ad-video-2', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e28', source: 'ad-video-3', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e29', source: 'ad-video-4', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e30', source: 'ad-video-5', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e31', source: 'ad-carousel-1', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e32', source: 'ad-carousel-2', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e33', source: 'ad-carousel-3', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e34', source: 'ad-carousel-4', target: 'lp-checkout', animated: true, type: 'smoothstep' },
    { id: 'e35', source: 'ad-carousel-5', target: 'lp-checkout', animated: true, type: 'smoothstep' },

    // Canais Orgânicos → Checkout (tráfego direto)
    { id: 'e36', source: 'website-lp', target: 'lp-checkout', animated: true, type: 'smoothstep' },

    // Checkout → Resultado
    { id: 'e37', source: 'lp-checkout', target: 'resultado-vendas', animated: true, type: 'smoothstep' },
  ]
}

export default dvdNatalV2Template
