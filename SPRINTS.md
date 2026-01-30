# 📊 ADS FLOW - PLANO DE SPRINTS
## Efeito Digital - Integração B.I. + Funnelytics

---

## 🎯 VISÃO GERAL DO PROJETO

### Objetivo
Transformar o Ads Flow em uma plataforma completa de gestão de campanhas com:
1. **Editor Visual** (já existente) - React Flow para criar fluxos
2. **Dashboard B.I.** (novo) - Análise de funil estilo V4 Company
3. **Tracking Funnelytics** (novo) - Source → Page → Action
4. **Relatórios** (novo) - Export de dados e insights

### Stack Tecnológica
- Frontend: React 19 + TypeScript + Vite
- Flow Editor: ReactFlow 11.11
- Charts: Recharts
- UI: Tailwind CSS + Lucide Icons
- Backend: Supabase (PostgreSQL)
- Integração: Meta Ads API via MCP

---

## 📅 SPRINT 1: FUNDAÇÃO FUNNELYTICS (Semana 1-2)

### 🎯 Objetivo
Adicionar novos tipos de nós inspirados no Funnelytics para rastrear jornada do cliente.

### Tarefas

#### 1.1 Novos Componentes de Nós
- [ ] `SourceNode.tsx` - Origem do tráfego (Google, Facebook, Email, Organic)
- [ ] `PageNode.tsx` - Páginas visitadas (Landing, Product, Checkout)
- [ ] `ActionNode.tsx` - Ações do usuário (Click, View, Submit)
- [ ] `UTMTrackerNode.tsx` - Rastreamento de parâmetros UTM
- [ ] `FunnelNode.tsx` - Visualização de funil inline

#### 1.2 Componentes de UI
- [ ] `DateRangeSelector.tsx` - Seletor de período
- [ ] `ConversionEdge.tsx` - Conexão com % de conversão

#### 1.3 Atualização da Sidebar
- [ ] Adicionar categoria "Funnelytics"
- [ ] Reorganizar componentes existentes
- [ ] Criar ícones para novos nós

### Entregáveis
- 5 novos tipos de nós funcionais
- Sidebar atualizada com nova categoria
- Documentação de uso dos novos nós

---

## 📅 SPRINT 2: DATABASE B.I. (Semana 3-4)

### 🎯 Objetivo
Criar estrutura de dados para o B.I. de Inside Sales.

### Tarefas

#### 2.1 Tabelas Supabase
- [ ] `leads` - Leads com status e métricas
- [ ] `oportunidades` - Oportunidades de venda
- [ ] `vendedores` - Equipe comercial
- [ ] `historico_funil` - Transições de etapas
- [ ] `flow_conversion_stats` - Estatísticas de conversão
- [ ] `flow_utm_params` - Rastreamento UTM

#### 2.2 Migrations
- [ ] Criar migrations SQL
- [ ] Configurar RLS (Row Level Security)
- [ ] Seeds de dados de exemplo

#### 2.3 Hooks de Dados
- [ ] `useLeads.ts` - CRUD de leads
- [ ] `useOportunidades.ts` - CRUD de oportunidades
- [ ] `useKPIs.ts` - Cálculo de métricas
- [ ] `useFunnelData.ts` - Dados do funil

### Entregáveis
- Schema completo no Supabase
- Hooks funcionais com TypeScript
- Dados de exemplo para testes

---

## 📅 SPRINT 3: DASHBOARD B.I. (Semana 5-6)

### 🎯 Objetivo
Implementar as 4 páginas do B.I. estilo V4 Company.

### Tarefas

#### 3.1 Componentes Base
- [ ] `KPICard.tsx` - Card de métrica com comparação
- [ ] `KPIComparison.tsx` - Comparação período anterior
- [ ] `FilterBar.tsx` - Barra de filtros global

#### 3.2 Gráficos (Recharts)
- [ ] `LeadsLineChart.tsx` - Leads por mês/ano
- [ ] `FunnelBarChart.tsx` - Funil de vendas horizontal
- [ ] `ConversionFunnelChart.tsx` - Funil visual de conversão
- [ ] `LossesBarChart.tsx` - Perdas por fonte/etapa

#### 3.3 Páginas do B.I.
- [ ] `BIPage1_FunilVendas.tsx` - Análise de Funil
- [ ] `BIPage2_Variacoes.tsx` - Variações e Filtros
- [ ] `BIPage3_TempoFechamento.tsx` - Análise de Tempo
- [ ] `BIPage4_Perdas.tsx` - Análise de Perdas

#### 3.4 Layout
- [ ] `BISidebar.tsx` - Navegação entre páginas
- [ ] `BIHeader.tsx` - Header com filtros globais

### Entregáveis
- 4 páginas de B.I. funcionais
- 10+ componentes de visualização
- Filtros interativos

---

## 📅 SPRINT 4: INTEGRAÇÕES (Semana 7-8)

### 🎯 Objetivo
Conectar dados reais via APIs.

### Tarefas

#### 4.1 Meta Ads Integration
- [ ] Sincronização de campanhas reais
- [ ] Importação de métricas (impressions, clicks, spend)
- [ ] Mapeamento automático para nós do fluxo

#### 4.2 Sistema de Relatórios
- [ ] `ReportGenerator.tsx` - Gerador de relatórios
- [ ] Export PDF (usando react-pdf)
- [ ] Export Excel (usando xlsx)
- [ ] Templates de relatório

#### 4.3 Webhooks N8N
- [ ] Endpoint de sincronização automática
- [ ] Notificações de mudanças
- [ ] Atualização de KPIs em tempo real

### Entregáveis
- Integração Meta Ads funcional
- Sistema de export de relatórios
- Webhooks configurados

---

## 📅 SPRINT 5: POLISH & DEPLOY (Semana 9-10)

### 🎯 Objetivo
Refinar UX, testes e deploy.

### Tarefas

#### 5.1 UX/UI
- [ ] Animações com Framer Motion
- [ ] Loading states e skeletons
- [ ] Empty states com CTAs
- [ ] Responsividade mobile

#### 5.2 Performance
- [ ] Lazy loading de páginas
- [ ] Cache de dados (TanStack Query)
- [ ] Otimização de re-renders

#### 5.3 Testes
- [ ] Testes de componentes
- [ ] Testes de hooks
- [ ] Testes E2E principais fluxos

#### 5.4 Deploy
- [ ] Build de produção
- [ ] Configurar Vercel
- [ ] Monitoramento (Sentry)

### Entregáveis
- Aplicação production-ready
- Deploy no Vercel
- Documentação completa

---

## 📊 MÉTRICAS DE SUCESSO

| Sprint | Métrica | Target |
|--------|---------|--------|
| 1 | Novos nós funcionais | 5 |
| 2 | Tabelas criadas | 6 |
| 3 | Páginas B.I. | 4 |
| 4 | Integrações ativas | 2 |
| 5 | Cobertura testes | 70% |

---

## 🚀 PRÓXIMOS PASSOS

### Hoje - Sprint 1 Kickoff
1. ✅ Analisar estrutura atual
2. 🔄 Criar SourceNode.tsx
3. 🔄 Criar PageNode.tsx
4. 🔄 Criar ActionNode.tsx
5. 🔄 Atualizar Sidebar

---

## 📝 NOTAS TÉCNICAS

### Estrutura de Arquivos (Sprint 1)
```
src/
├── components/
│   ├── Nodes/
│   │   ├── Funnelytics/          # NOVO
│   │   │   ├── SourceNode.tsx
│   │   │   ├── PageNode.tsx
│   │   │   ├── ActionNode.tsx
│   │   │   ├── UTMTrackerNode.tsx
│   │   │   ├── FunnelNode.tsx
│   │   │   └── index.ts
│   │   └── ... (existentes)
│   ├── Edges/                     # NOVO
│   │   ├── ConversionEdge.tsx
│   │   └── index.ts
│   └── UI/
│       ├── DateRangeSelector.tsx  # NOVO
│       └── ... (existentes)
```

### Tipos TypeScript (Sprint 1)
```typescript
// src/types/funnelytics.ts
export interface SourceNodeData {
  source: 'google_ads' | 'facebook' | 'instagram' | 'email' | 'organic' | 'direct';
  label: string;
  visits: number;
  cost?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface PageNodeData {
  pageType: 'landing' | 'product' | 'blog' | 'checkout' | 'thank_you';
  label: string;
  url?: string;
  visitors: number;
  bounceRate?: number;
}

export interface ActionNodeData {
  actionType: 'click' | 'view' | 'submit' | 'add_to_cart' | 'purchase';
  label: string;
  conversions: number;
  conversionRate?: number;
}
```

---

---

## ✅ PROGRESSO ATUAL

### Sprint 1: COMPLETO ✅
- [x] SourceNode, PageNode, ActionNode, UTMTrackerNode, FunnelNode criados
- [x] DateRangeSelector implementado
- [x] ConversionEdge com métricas visuais
- [x] Sidebar atualizada com categoria "Funnelytics"
- [x] Novos nós registrados no FlowEditor

### Sprint 2: COMPLETO ✅
- [x] Tabelas Supabase: leads, oportunidades, vendedores, historico_funil, etc.
- [x] Tipos TypeScript para B.I. (src/types/bi.ts)
- [x] Hooks: useLeads, useKPIs, useFunnelData, etc. (src/hooks/useBI.ts)
- [x] Componentes: KPICard, FunnelChart, LeadsLineChart, ResponsavelTable, PerdasChart
- [x] BIDashboardPage com 4 views (Funil, Variações, Tempo, Perdas)
- [x] Rota /bi adicionada ao App.tsx
- [x] Link "Dashboard B.I." no DashboardPage

### Sprint 3: PENDENTE
- [ ] Refinamento de gráficos
- [ ] Testes de performance
- [ ] Dados de exemplo

### Sprint 4: PENDENTE
- [ ] Integração real com Meta Ads API
- [ ] Sistema de relatórios exportáveis (PDF/Excel)

---

## 📁 ARQUIVOS CRIADOS

### Tipos
- `src/types/funnelytics.ts` - Tipos para nós Funnelytics
- `src/types/bi.ts` - Tipos para Dashboard B.I.

### Componentes Funnelytics
- `src/components/Nodes/Funnelytics/SourceNode.tsx`
- `src/components/Nodes/Funnelytics/PageNode.tsx`
- `src/components/Nodes/Funnelytics/ActionNode.tsx`
- `src/components/Nodes/Funnelytics/UTMTrackerNode.tsx`
- `src/components/Nodes/Funnelytics/FunnelNode.tsx`
- `src/components/Nodes/Funnelytics/index.ts`

### Edges
- `src/components/Edges/ConversionEdge.tsx`
- `src/components/Edges/index.ts`

### UI
- `src/components/UI/DateRangeSelector.tsx`

### B.I. Dashboard
- `src/components/BI/KPICard.tsx`
- `src/components/BI/FunnelChart.tsx`
- `src/components/BI/LeadsLineChart.tsx`
- `src/components/BI/ResponsavelTable.tsx`
- `src/components/BI/PerdasChart.tsx`
- `src/components/BI/index.ts`

### Hooks
- `src/hooks/useBI.ts`

### Pages
- `src/pages/BIDashboardPage.tsx`

### Database
- `supabase/migrations/001_bi_tables.sql`

---

*Documento criado em: 27/01/2026*
*Última atualização: 27/01/2026*
*Desenvolvido por: Efeito Digital*
