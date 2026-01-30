# 📊 Integração de Dados - Ads Flow
## Efeito Digital

Este documento explica como os dados chegam aos nós Funnelytics no editor de fluxos.

---

## 🔄 Visão Geral do Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                    FONTES DE DADOS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Meta Ads │  │   GA4    │  │  Pixel   │  │   CSV    │        │
│  │   API    │  │   API    │  │ Tracking │  │  Import  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
│       └─────────────┴─────────────┴─────────────┘                │
│                           │                                      │
│                           ▼                                      │
│             ┌─────────────────────────┐                         │
│             │   Data Integration      │                         │
│             │      Service            │                         │
│             │  (dataIntegration.ts)   │                         │
│             └───────────┬─────────────┘                         │
│                         │                                        │
│                         ▼                                        │
│             ┌─────────────────────────┐                         │
│             │      Supabase           │                         │
│             │   (PostgreSQL)          │                         │
│             │                         │                         │
│             │  • flow_events          │                         │
│             │  • flow_node_stats      │                         │
│             │  • flow_integrations    │                         │
│             └───────────┬─────────────┘                         │
│                         │                                        │
│                         ▼                                        │
│             ┌─────────────────────────┐                         │
│             │    React Hooks          │                         │
│             │  (useBI.ts, etc.)       │                         │
│             └───────────┬─────────────┘                         │
│                         │                                        │
│                         ▼                                        │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              FLOW EDITOR (ReactFlow)                  │      │
│   │                                                       │      │
│   │  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐  │      │
│   │  │Source  │──▶│  Page  │──▶│ Action │──▶│ Funnel │  │      │
│   │  │ Node   │   │  Node  │   │  Node  │   │  Node  │  │      │
│   │  └────────┘   └────────┘   └────────┘   └────────┘  │      │
│   │                                                       │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 Fontes de Dados Suportadas

### 1. Meta Ads API
**Dados obtidos:**
- Impressões, Alcance, Cliques
- Custo, CPC, CPM
- Conversões, Custo por Conversão

**Como usar:**
1. Acesse o modal de Integração no editor
2. Selecione "Meta Ads"
3. Insira o Account ID (formato: `act_123456789`)
4. Conecte e sincronize

**Mapeamento para nós:**
| Meta Ads         | SourceNode           |
|------------------|----------------------|
| clicks           | visits               |
| spend            | cost                 |
| cpc              | cpc                  |
| cpm              | cpm                  |
| reach            | uniqueVisitors       |

---

### 2. Google Analytics 4 (GA4)
**Dados obtidos:**
- Pageviews, Usuários, Sessões
- Bounce Rate, Tempo na Página
- Eventos personalizados
- Dados de UTM

**Como usar:**
1. Acesse o modal de Integração
2. Selecione "Google Analytics 4"
3. Insira o Property ID
4. Conecte e sincronize

**Mapeamento para nós:**
| GA4                | PageNode / ActionNode |
|--------------------|----------------------|
| screenPageViews    | visitors             |
| users              | uniqueVisitors       |
| bounceRate         | bounceRate           |
| avgSessionDuration | avgTimeOnPage        |
| eventCount         | conversions          |

---

### 3. Pixel de Rastreamento (Webhook)
**O que rastreia:**
- Pageviews em tempo real
- Cliques em elementos marcados
- Conversões personalizadas
- Parâmetros UTM automaticamente

**Como usar:**
1. Acesse o modal de Integração
2. Selecione "Pixel/Webhook"
3. Copie o código gerado
4. Cole no `<head>` do seu site

**Exemplo de código:**
```html
<!-- Efeito Digital - Ads Flow Tracking Pixel -->
<script>
(function() {
  var FLOW_ID = 'seu-flow-id';
  var WEBHOOK_URL = 'https://seusite.com/api/webhook/seu-flow-id';
  // ... código do pixel
})();
</script>
```

**Rastrear eventos customizados:**
```html
<!-- Botão com tracking automático -->
<button data-ef-track="click_comprar" data-ef-value="99.90">
  Comprar Agora
</button>

<!-- Conversão via JavaScript -->
<script>
  efTrack('conversion', {
    eventName: 'purchase',
    eventValue: 199.90
  });
</script>
```

---

### 4. Importação de CSV
**Formato esperado:**
```csv
source,visits,conversions,cost,utm_source,utm_medium,utm_campaign
facebook,1500,45,2500.00,facebook,cpc,black_friday
google,2000,60,3000.00,google,cpc,search_brand
email,800,25,0,newsletter,email,weekly
```

**Como usar:**
1. Acesse o modal de Integração
2. Selecione "Importar CSV"
3. Faça upload do arquivo
4. Mapeie as colunas para os campos dos nós

---

### 5. Entrada Manual
**Como usar:**
1. Clique em qualquer nó Funnelytics no canvas
2. O formulário de edição abrirá
3. Preencha os campos manualmente
4. Clique em Salvar

**Ideal para:**
- Demonstrações
- Planejamento de campanhas
- Cenários hipotéticos
- Quando não há integração disponível

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: flow_events
Armazena eventos brutos recebidos do pixel.

```sql
CREATE TABLE flow_events (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES strategy_flows(id),
  event_type TEXT, -- 'pageview', 'click', 'conversion'
  session_id TEXT,
  data JSONB,      -- Dados flexíveis do evento
  created_at TIMESTAMPTZ
);
```

### Tabela: flow_node_stats
Estatísticas agregadas por nó por dia.

```sql
CREATE TABLE flow_node_stats (
  id UUID PRIMARY KEY,
  flow_id UUID,
  node_id TEXT,
  period_date DATE,
  visits INT,
  unique_visitors INT,
  conversions INT,
  revenue DECIMAL,
  created_at TIMESTAMPTZ
);
```

### Tabela: flow_integrations
Configurações de integração por flow.

```sql
CREATE TABLE flow_integrations (
  id UUID PRIMARY KEY,
  flow_id UUID,
  source TEXT,       -- 'meta_ads', 'google_analytics', etc.
  credentials JSONB, -- Credenciais criptografadas
  settings JSONB,    -- Configurações (refresh interval, etc.)
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN
);
```

---

## 🔐 Segurança

1. **Credenciais**: Armazenadas de forma segura no Supabase
2. **RLS (Row Level Security)**: Cada usuário só vê seus próprios dados
3. **Webhook público**: O endpoint do pixel permite INSERT sem auth (necessário para tracking)
4. **Tokens**: Access tokens do Meta/Google são criptografados

---

## 🚀 Próximos Passos

1. **Integração real com Meta Ads MCP** - Usar as ferramentas MCP disponíveis
2. **Sincronização automática** - Cron jobs para atualizar dados periodicamente
3. **Dashboard em tempo real** - WebSockets para updates instantâneos
4. **Alertas** - Notificações quando métricas atingirem limites

---

*Documentação criada em: 27/01/2026*
*Efeito Digital - Ads Flow*
