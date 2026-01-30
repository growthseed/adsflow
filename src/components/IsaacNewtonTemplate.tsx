// Template Isaac Newton - Versão Corrigida
// SEM dependências de tipos do ReactFlow - Compatível com todas as versões

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createIsaacNewtonTemplate(handleEditNode?: (id: string, type: string, data: any) => void) {
  const nodes = [
    // Brand Node - Principal
    {
      id: 'brand-isaac-newton',
      type: 'brand',
      position: { x: 100, y: 100 },
      data: {
        label: 'Isaac Newton Schools',
        brand: 'meta',
        description: 'Educação de Excelência',
        totalBudget: 'R$ 77,50/dia',
        totalAccounts: 3,
        activeCampaigns: 3,
        isActive: true
      },
      style: {
        width: 220,
        height: 120,
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff'
      }
    },

    // Traffic Sources (substituindo Accounts)
    {
      id: 'source-vila-primary',
      type: 'trafficSource',
      position: { x: 400, y: 50 },
      data: {
        label: 'Vila Primary',
        source: 'meta',
        accountId: 'act_3482049598727995',
        balance: 'R$ 991,22',
        status: 'active',
        campaignsCount: 23,
        activeCampaigns: 3
      }
    },
    {
      id: 'source-campinas-main',
      type: 'trafficSource',
      position: { x: 400, y: 150 },
      data: {
        label: 'Campinas Main',
        source: 'meta',
        accountId: 'act_1234567890123456',
        balance: 'R$ 856,90',
        status: 'active',
        campaignsCount: 18,
        activeCampaigns: 2
      }
    },
    {
      id: 'source-campinas-backup',
      type: 'trafficSource',
      position: { x: 400, y: 250 },
      data: {
        label: 'Campinas Backup',
        source: 'meta',
        accountId: 'act_6789012345678901',
        balance: 'R$ 445,33',
        status: 'active',
        campaignsCount: 5,
        activeCampaigns: 1
      }
    },

    // Campaigns Nodes
    {
      id: 'campaign-vila-whatsapp',
      type: 'campaign',
      position: { x: 700, y: 30 },
      data: {
        label: 'Vila WhatsApp',
        campaignId: '23858745515780407',
        objective: 'MESSAGES',
        budgetType: 'daily',
        budget: 45.50,
        status: 'active',
        reach: 12845,
        impressions: 42156,
        cpm: 4.89
      }
    },
    {
      id: 'campaign-artur-whatsapp',
      type: 'campaign',
      position: { x: 700, y: 130 },
      data: {
        label: 'Artur WhatsApp',
        campaignId: '23858745515690406',
        objective: 'MESSAGES',
        budgetType: 'daily',
        budget: 26.00,
        status: 'active',
        reach: 8234,
        impressions: 28567,
        cpm: 5.12
      }
    },
    {
      id: 'campaign-video-warming',
      type: 'campaign',
      position: { x: 700, y: 230 },
      data: {
        label: 'Video Warming',
        campaignId: '23858745515590405',
        objective: 'VIDEO_VIEWS',
        budgetType: 'daily',
        budget: 6.00,
        status: 'active',
        reach: 3456,
        impressions: 15678,
        cpm: 2.34
      }
    },

    // Ad Sets Nodes
    {
      id: 'adset-frio-4km',
      type: 'adSet',
      position: { x: 1000, y: 50 },
      data: {
        label: 'FRIO 4KM',
        adsetId: '23858745515880408',
        targeting: 'Raio 4km Vila',
        budget: 22.75,
        status: 'active',
        cpc: 0.89,
        ctr: 4.94
      }
    },
    {
      id: 'adset-frio-10km',
      type: 'adSet',
      position: { x: 1000, y: 150 },
      data: {
        label: 'FRIO 10KM',
        adsetId: '23858745515880409',
        targeting: 'Raio 10km Artur',
        budget: 13.00,
        status: 'active',
        cpc: 1.12,
        ctr: 3.67
      }
    },
    {
      id: 'adset-lal-high',
      type: 'adSet',
      position: { x: 1000, y: 250 },
      data: {
        label: 'LAL High',
        adsetId: '23858745515880410',
        targeting: 'Lookalike Alto',
        budget: 3.00,
        status: 'active',
        cpc: 0.67,
        ctr: 5.23
      }
    },

    // Visual Creatives Nodes
    {
      id: 'creative-whatsapp-cta',
      type: 'visualCreative',
      position: { x: 1300, y: 100 },
      data: {
        label: 'WhatsApp CTA',
        creativeId: '23858745515980411',
        format: 'image',
        headline: 'Matrículas Abertas 2026',
        cta: 'Fale no WhatsApp',
        ctr: 4.94,
        engagement: 892
      }
    },
    {
      id: 'creative-instagram-video',
      type: 'visualCreative',
      position: { x: 1300, y: 200 },
      data: {
        label: 'Instagram Video',
        creativeId: '23858745515980412',
        format: 'video',
        headline: 'Conheça Nossa Escola',
        cta: 'Saiba Mais',
        videoPlayRate: 85.6,
        engagement: 1234
      }
    },

    // Audience Node
    {
      id: 'audience-christian-parents',
      type: 'audience',
      position: { x: 1600, y: 150 },
      data: {
        label: 'Pais Cristãos',
        audienceSize: '45.000 - 67.000',
        location: 'SP - Vila e Campinas',
        interests: 'Educação Cristã, Família',
        age: '28-45 anos',
        behavior: 'Pais com filhos 3-17 anos'
      }
    },

    // Results Node
    {
      id: 'results-conversions',
      type: 'result',
      position: { x: 1900, y: 150 },
      data: {
        label: 'Conversões',
        metric: 'Mensagens',
        target: '150',
        achieved: '117',
        percentage: '78',
        costPerResult: 'R$ 0,43',
        totalSpend: 'R$ 2.535'
      }
    }
  ];

  const edges = [
    // Brand -> Traffic Sources
    { id: 'e1', source: 'brand-isaac-newton', target: 'source-vila-primary', type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e2', source: 'brand-isaac-newton', target: 'source-campinas-main', type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e3', source: 'brand-isaac-newton', target: 'source-campinas-backup', type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },

    // Traffic Sources -> Campaigns
    { id: 'e4', source: 'source-vila-primary', target: 'campaign-vila-whatsapp', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e5', source: 'source-campinas-main', target: 'campaign-artur-whatsapp', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e6', source: 'source-campinas-backup', target: 'campaign-video-warming', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },

    // Campaigns -> Ad Sets
    { id: 'e7', source: 'campaign-vila-whatsapp', target: 'adset-frio-4km', type: 'smoothstep', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    { id: 'e8', source: 'campaign-artur-whatsapp', target: 'adset-frio-10km', type: 'smoothstep', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    { id: 'e9', source: 'campaign-video-warming', target: 'adset-lal-high', type: 'smoothstep', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },

    // Ad Sets -> Creatives
    { id: 'e10', source: 'adset-frio-4km', target: 'creative-whatsapp-cta', type: 'smoothstep', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e11', source: 'adset-frio-10km', target: 'creative-whatsapp-cta', type: 'smoothstep', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e12', source: 'adset-lal-high', target: 'creative-instagram-video', type: 'smoothstep', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },

    // Creatives -> Audience
    { id: 'e13', source: 'creative-whatsapp-cta', target: 'audience-christian-parents', type: 'smoothstep', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    { id: 'e14', source: 'creative-instagram-video', target: 'audience-christian-parents', type: 'smoothstep', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },

    // Audience -> Results
    { id: 'e15', source: 'audience-christian-parents', target: 'results-conversions', type: 'smoothstep', animated: true, style: { stroke: '#22c55e', strokeWidth: 3 } }
  ];

  // Adicionar onEdit callback aos nós se handleEditNode foi fornecido
  const nodesWithCallbacks = handleEditNode
    ? nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onEdit: () => handleEditNode(node.id, node.type, node.data)
        }
      }))
    : nodes;

  return {
    nodes: nodesWithCallbacks,
    edges,
    name: 'Isaac Newton Schools - Meta Ads Flow',
    description: 'Estrutura completa das campanhas Meta Ads das Escolas Isaac Newton - Vila, Artur Alvim e Campinas. Visualização dos funis de tráfego, públicos e resultados baseada em dados reais das campanhas.'
  };
}

export default createIsaacNewtonTemplate;