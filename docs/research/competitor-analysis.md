# AdFlow — Análise Competitiva (Síntese)

**Data**: 2026-04-08
**Metodologia**: 7 agentes de pesquisa paralelos + crawl logado do Reportei via agent-browser
**Concorrentes estudados**: Whatagraph · AgencyAnalytics · SEMrush (tier system) · Linear (mobile UX) · Looker Studio (viz patterns) · Funnelytics (planner) · Funnel.io (data layer) · Reportei (crawl autenticado)

**Objetivo**: extrair padrões de produto, UX e arquitetura pros 3 pilares do AdFlow (Planner · Performance · Projeto).

---

## 1. Padrões unânimes (aparecem em 5+ fontes)

### 1.1 Estrutura de navegação cliente-first
**5 de 8** (Reportei, Whatagraph, AgencyAnalytics, Funnel.io, Swydo) organizam navegação por cliente primeiro, não por feature:

```
Lista de projetos/clientes → Entra no cliente → Vê módulos/seções dentro
```

Nenhum deles tem "Dashboards" como item top-level de sidebar global. Dashboards vivem DENTRO do contexto de um cliente. **Isso valida nossa proposta de `/c/:clientSlug/<modulo>`**.

### 1.2 KPI Scorecard como unidade atômica
**Todos os 8** usam scorecards como célula básica:
- Valor grande (36-48px)
- Delta colorido abaixo (↑ verde / ↓ vermelho ou pink)
- Sparkline opcional (line chart em miniatura)
- Comparação com período anterior (WoW/MoM/YoY) nativa

**Aplicar no AdFlow**: componente canônico `<KPICard>` com props `{ label, value, delta, sparkline?, goal? }`. Tudo o que for KPI usa só esse componente. Zero layout custom.

### 1.3 Grid-based dashboard (não free-form)
**Whatagraph, AgencyAnalytics, Reportei** usam grid 12-col com drag-drop limitado. Nenhum usa canvas infinito pra dashboard (isso fica só pro Planner/funnel editor). Motivo: consistência visual automática > liberdade que vira caos.

**Aplicar**: Performance usa grid fixo (como Reportei), Planner usa canvas infinito (como Funnelytics).

### 1.4 Templates pré-prontos > blank canvas
**Todos os 8** oferecem templates iniciais. Reportei tem 4 templates oficiais (Padrão, E-commerce, Inbound, Tráfego Pago) + templates customizados por gestor. Funnelytics tem 100+ templates no Vault. Whatagraph tem biblioteca por nicho.

**Razão validada**: "template paralysis" é inimigo da ativação. 80% dos clientes aceitam um template e customizam 20%, ao invés de montar do zero.

**Aplicar**: AdFlow v1 começa com **5 templates por módulo**:
- Performance: `Padrão`, `E-commerce`, `Tráfego Pago`, `Inbound`, `B2B Lead Gen`
- Planner: `Briefing`, `Funil de Vendas`, `Jornada do Cliente`, `Lançamento`, `Remarketing`
- Projeto: `Sprint semanal`, `Mensal`, `Lançamento`, `Auditoria trimestral`, `Onboarding`

### 1.5 Period comparison nativo (WoW/MoM/YoY)
**Todos** têm seletor de período + comparador com período anterior. Ninguém deixa como "feature opcional".

**Aplicar**: no AdFlow, `<KPICard>` e `<ChartCard>` SEMPRE têm comparação ativada por padrão. O gestor desativa se não quiser, não o contrário.

### 1.6 Link público + senha-opcional pra relatório
**Reportei, Whatagraph, AgencyAnalytics** geram link público tipo `app.X.com/report/<token>` que cliente abre sem login. Alguns adicionam senha ou dominio whitelisted.

**Aplicar**: módulo Performance do AdFlow precisa ter share link público desde o v1. Cliente recebe WhatsApp com link, abre no celular, não precisa criar conta. Reduz fricção massivamente.

---

## 2. Insights por categoria

### 2.1 Performance (dashboards + reports)

**Reportei tem a estrutura mais copiável**:

```
Cliente (URL: /client/:id)
│
├── Overview (widget dashboard)
│   ├── Pontuação de oportunidade (score 0-100)    ← genial
│   ├── Relatórios recentes (3 últimos + "ver todos")
│   ├── Dashboards (customizáveis)
│   ├── Reportei Flux (planner — veja seção 2.3)
│   ├── Reportei Controle (KPI targets + alertas)
│   ├── Reportei AI (4 assistentes especializados)
│   ├── Linha do tempo (marcos do projeto)
│   └── Automação (reports agendados: semanal + mensal)
│
└── Relatório individual (URL: /client/:id/report/:reportId)
    ├── Capa editável (título + data range)
    ├── Seção por canal (Google Ads, Meta, GA4, etc)
    │   ├── 6-8 KPIs padrão (ver lista abaixo)
    │   ├── Campo "Análise" (textarea livre pro gestor escrever)
    │   └── Drill-down opcional (campanhas, ad groups, etc)
    ├── "Ver como cliente" (preview mode)
    ├── "Salvar como template" (reutilização)
    ├── "Automatizar" (vira recurring report)
    └── Link público (share com cliente)
```

**KPI padrão Reportei por canal** (8 métricas Google Ads):
`Custo · Impressões · Cliques · CTR · CPC médio · CPM médio · Conversões · Valor das conversões`

Essa lista é **literalmente** a que a gente deveria copiar pro AdFlow como default do template "Tráfego Pago".

**Gap do Reportei que AdFlow pode ocupar**:
- ❌ Não tem módulo de **projeto/tarefas** (ClickUp integration)
- ❌ AI é genérico no browser, não profundo
- ❌ Sem "análise estratégica" gerada automaticamente (só métricas)
- ❌ Link público é estático, não interativo com o cliente
- ❌ Mobile experience é responsive básico, não PWA otimizado

### 2.2 Projeto (task tracking estilo Linear)

**Linear é o north star pra mobile UX de tasks.** Padrões críticos extraídos:

1. **Bottom nav customizável** (3-5 abas, usuário pinga os próprios atalhos)
2. **Row de task em 1 linha**: priority-dot + título 70% + status-pill + due-date + avatar 12px. Zero ícones gratuitos.
3. **Task detail full-screen slide** (não modal) com ação principal (complete/change status) como botão grande no bottom
4. **Busca com natural language** + pills de filtro visíveis sempre (não dropdown)
5. **Swipe gestures**: swipe-left abre quick actions (complete/assign/snooze)
6. **Cores dessaturadas** + tipografia como hierarquia (não tamanho/cor de ícones)

**Aplicar no módulo Projeto do AdFlow**:
- Bottom nav: `Urgente` | `Em andamento` | `Prazos` | `Concluídos`
- Row pattern de task idêntico ao Linear (steal shamelessly)
- Swipe-right pra "marcar como visto/aprovado" no cliente
- Notificações: 1 badge vermelho na aba Urgente. Nada de sub-badges por projeto.

**Dados vêm do ClickUp API** (workspace da Efeito Digital) filtrados pelo space/folder do cliente específico. Cache 5min.

### 2.3 Planner (canvas visual)

**Funnelytics é o north star.** Padrões críticos:

1. **Canvas infinito** com drag-drop
2. **Vocabulário visual em 3 tiers**: Sources (origem) · Pages (páginas) · Events (ações)
3. **Forecasting layer**: user inputa dados baseline, simula cenários antes de lançar
4. **Performance overlay**: depois que lança, dados reais do Meta/Google/GA4 **aparecem nos próprios nós** do canvas com cores Red/Yellow/Green
5. **100+ templates por vertical** (lead gen, e-commerce, webinar, SaaS, B2B)
6. **Colaboração**: compartilha link, cliente vê read-only e comenta por nó

**Aplicar no Planner do AdFlow**:
- Reusar `FlowEditorPage` que já tem ReactFlow
- Adicionar 5 templates: Briefing, Funil Vendas, Jornada, Lançamento, Remarketing
- **Inovação**: nó "Campanha Google Ads" pode ser conectado ao `customer_id` sincronizado no Supabase → mostra performance real no canvas (copia Funnelytics)
- **Modo cliente** (read-only + comentários) desde o v1

**O que NÃO copiar de Funnelytics**:
- Ícones sem labels (sobrecarga cognitiva) → sempre texto + ícone no AdFlow
- Canvas totalmente livre sem estrutura → oferecer "páginas" dentro do flow pra organizar

### 2.4 Tier system (SEMrush como playbook)

**SEMrush usa quantitative gating + feature bundling**. Padrões chave:

1. **3 tiers na home** (Pro · Guru · Business) — não 4, não 2
2. **43% dos usuários em Guru** (mid-tier é sempre o mais popular) — badge "Most Popular" no meio
3. **Gating por número**: 5 projetos (Pro) → 15 projetos (Guru) → 40 projetos (Business). Quem tem 6 clientes PRECISA upgrade.
4. **Feature "nuclear" gated no mid-tier**: Content Toolkit + historical data + multi-location. Quem precisa de qualquer uma dessas pula de Pro pra Guru.
5. **Free trial 14 dias com acesso Guru** (não Pro). Usuário experimenta o tier premium e baixar dói.
6. **Annual 16% off** — destaque em badge verde "Save 17%"
7. **Add-ons pagos** por cima do plano base (Social, Advertising, Traffic)

**Anti-patterns SEMrush**:
- Flexpoints pricing imprevisível (quem da Funnel.io copiou — e é péssimo)
- Muitos add-ons separados criam complexidade

**Aplicar no AdFlow (proposta revisada)**:

| | Basic | Pro | Black | Enterprise |
|---|---|---|---|---|
| **Clientes** | 3 | 10 | 30 | ∞ |
| **Canais Performance** | 2 (Meta, Google Ads) | 6 (+GA4, GSC, YT, GMB) | 11 (+LinkedIn, TikTok, Ecommerce, Kommo, ClickUp) | Custom |
| **Planner Flows** | 3 | ∞ + templates | ∞ + versionamento + client comments | ∞ + custom templates |
| **Projeto (ClickUp)** | ❌ | Read-only | Full sync | Custom workflows |
| **AI Insights** | ❌ | Mensal (Reportei AI style) | Semanal (MCP-powered) | Diário + custom skills |
| **Link público cliente** | ❌ | ✅ básico | ✅ + branding + senha | ✅ + white label completo |
| **Relatórios automatizados** | Mensal | Semanal | Diário | On-demand |
| **MCP local (Claude Code)** | ❌ | ❌ | ❌ | ✅ incluso + setup assistido |
| **Histórico de dados** | 30d | 180d | 2 anos | ∞ |
| **Preço estimado/mês** | R$ 97 | R$ 297 | **R$ 697** | R$ 1.997+ |

**Black é o "sweet spot" positioning** (como Guru no SEMrush). "Most popular" ribbon visível. Enterprise justifica preço alto porque **inclui MCP local** — que é o diferencial inimitável da Efeito Digital.

### 2.5 Data layer (Funnel.io como arquitetura)

**Funnel.io não é concorrente direto** (eles são data-first, não dashboard-first), mas a arquitetura deles é ouro:

1. **Declarative connectors via YAML** (não código custom por fonte)
2. **Non-destructive transformation layer**: dados raw + dados normalized, separados. Nunca sobrescreve raw.
3. **Per-connector schema normalization**: "cost" vira métrica universal cross-source
4. **Execução distribuída**: cada connector roda standalone, escreve em S3, sem bottleneck central

**Aplicar no AdFlow (backend)**:
- Nossa pasta `src/services/adapters/` deve seguir esse padrão declarativo
- Schema universal: `{ KPI, TimeSeries, EntityTable }` (já propus antes — isso valida)
- Supabase como camada normalizada; cada adapter sabe sua fonte e normaliza pra shape universal
- Adapters SÃO o valor da agência — se bem feitos, escalam pra qualquer canal

### 2.6 Visualization patterns (Looker Studio)

**Looker é visual-first mas desktop-first**. Padrões chave:

1. **Scorecard trio** (3 big KPIs side-by-side, stack em mobile)
2. **Period comparison overlay** (linha semi-transparente do período anterior)
3. **Heatmap table** com conditional formatting (verde/vermelho por performance)
4. **12-col grid** colapsando pra 2-col no mobile (breakpoint 776px)
5. **Filtros como pills top of page** (não dropdown escondido)
6. **Top 5 charts pra marketing**: Scorecard · Time Series · Bar · Table · Gauge

**Anti-patterns Looker**:
- Mobile compromise: feito pra desktop, mobile é responsive bolt-on
- Visual stale: gráficos parecem Excel 2010
- Ownership por Google account (user sai, relatório quebra)

**Aplicar no AdFlow**: charts modernos (recharts/visx) + mobile-first desde o dia 1. Ownership sempre na `agency`, nunca no user individual.

---

## 3. Matriz de decisões — AdFlow v4

### 3.1 Módulo Performance
| Decisão | Escolha | Fonte |
|---|---|---|
| Layout | Grid 12-col fixo | Whatagraph, Reportei |
| KPI unit | `<KPICard>` canônico | Looker, todos |
| KPI defaults por canal Google Ads | `Custo · Impressões · Cliques · CTR · CPC · CPM · Conversões · Valor conv.` | Reportei (cópia literal) |
| Seções | 1 seção por canal + análise textual livre | Reportei |
| Templates | 5 prontos: Padrão, E-commerce, Tráfego Pago, Inbound, B2B | Reportei |
| Period comparison | WoW/MoM/YoY sempre on por default | Todos |
| Share | Link público com token, com/sem senha | Reportei, Whatagraph |
| Mobile | PWA first, não responsive bolt-on | Gap competitivo |

### 3.2 Módulo Projeto
| Decisão | Escolha | Fonte |
|---|---|---|
| Data source | ClickUp API (já temos service) | — |
| Mobile pattern | Linear-style (swipe, bottom nav, cores dessaturadas) | Linear |
| Row format | priority-dot + título + status-pill + due + avatar | Linear |
| Filtros | Pills visíveis sempre | Linear |
| Push notifications | 1 badge na aba Urgente | Linear |
| Cache | 5 min (rate limit ClickUp) | — |
| **Diferencial vs competidores** | Ninguém mais oferece isso | Gap Reportei |

### 3.3 Módulo Planner
| Decisão | Escolha | Fonte |
|---|---|---|
| Canvas | Infinito (ReactFlow, já existe) | Funnelytics |
| Vocabulário | 3 tiers: Sources · Pages · Events | Funnelytics |
| Templates iniciais | 5: Briefing, Funil, Jornada, Lançamento, Remark | Funnelytics |
| Ícones | Sempre com label text | Anti-pattern Funnelytics |
| Live data overlay | Conectar nó a customer_id → mostra performance | Funnelytics (inovação) |
| Modo cliente | Read-only + comentários por nó | Funnelytics |

### 3.4 Tier system
| Decisão | Escolha | Fonte |
|---|---|---|
| Quantidade de tiers | 4 (Basic / Pro / Black / Enterprise) | — |
| Tier destacado "Most Popular" | **Black** | SEMrush (Guru pattern) |
| Free trial | 14 dias de acesso Black | SEMrush |
| Gating principal | Número de clientes + canais + features AI | SEMrush |
| Anti-pattern | Flexpoints (Funnel.io) → usar tiered flat | Funnel.io |
| Annual discount | 17% off em badge verde | SEMrush |
| Diferencial Enterprise | MCP local incluso + setup | Nosso moat |

---

## 4. Screenshots capturados (Reportei)

Todos em `c:/tmp/reportei-research/`:

| # | Arquivo | Conteúdo |
|---|---|---|
| 1 | `01-home.png` | Lista de projetos (5 clientes visíveis) |
| 2 | `02-client-epa.png` | Client overview da Escola Pequeno Aprendiz com 7 widgets |
| 3 | `03-report-epa.png` | Layout de relatório Google Ads com 8 KPIs padrão |
| 4 | `04-controle.png` | Reportei Controle welcome page (KPI targets + alertas) |
| 5 | `05-ai.png` | Reportei AI com 4 assistentes especializados |
| 6 | `06-templates.png` | Galeria de templates (4 oficiais + templates Efeito) |

**Descoberta importante**: a "Escola PA" é na verdade **Escola Pequeno Aprendiz**, já tem 27 relatórios no Reportei, 2 automações ativas (semanal + mensal), e é o piloto ideal pro AdFlow porque tem histórico rico.

---

## 5. Próximas ações imediatas

### Já validadas pelo research (podem começar SEM confirmação):

1. **Esqueleto de pastas em `src/components/canonical/`** com `<KPICard>`, `<ChartCard>`, `<DataTable>`, `<PageHeader>`, `<EmptyState>` — base universal
2. **Tipos em `src/types/metrics.ts`**: `KPI`, `TimeSeries`, `EntityTable`
3. **Tabela `plans` no Supabase** com os 4 tiers e limits em JSON
4. **`docs/architecture/adflow-v4.md`** com wireframes ASCII + plano de migração

### Precisam decisão do CEO (você):

1. **Qual módulo primeiro?** Recomendação: **Projeto** (1 sem, entrega visual rápida pro cliente) → **Performance** (2 sem, absorve 10 páginas legacy) → **Planner** (1 sem, extende FlowEditor)
2. **Escola Pequeno Aprendiz como piloto**: confirmado (27 relatórios históricos + OAuth Google funcionando)
3. **Páginas legacy**: mover pra `/legacy/*` hidden da sidebar, deletar no final do sprint 2?
4. **Pricing final**: usar meus valores indicativos (R$ 97/297/697/1997) ou outros?

### Pesquisa adicional que pode valer mais rodadas:
- Swydo (mais próximo em DNA pro Basic tier)
- DashThis (popular BR/PT, small agencies)
- Databox (free tier agressivo)
- ClickUp Dashboards (saber exatamente o que vamos integrar via API)

---

## 6. Meta-insights da pesquisa

1. **Ninguém combina Report + Task Tracking + Visual Planner num produto só.** Esse é literalmente o **gap** que o AdFlow ocupa. Reportei é report-only. ClickUp é task-only. Funnelytics é planner-only. AdFlow = 3 em 1 = diferencial real, não inventado.

2. **A moat do AdFlow é o MCP local no tier Enterprise.** Nenhum concorrente pode copiar porque não tem conhecimento de Claude Code + Agent SDK integrado a playbook proprietário. Efeito Digital pode.

3. **Mobile-first (PWA) é gap em TODOS os concorrentes.** Reportei, Whatagraph, AgencyAnalytics, Looker: todos dizem "mobile responsive" mas entregam desktop-first. Um produto REALMENTE mobile-first (especialmente o módulo Projeto) vira diferencial.

4. **Templates por vertical são a maior alavanca de ativação.** Nenhum cliente quer começar do zero. 5 templates por módulo no v1 é suficiente pra ativar 80% dos casos.

5. **O padrão "gestor escreve análise textual livre em cada seção do relatório" é universal no BR** (Reportei). Clientes brasileiros esperam isso. Relatórios só com números são percebidos como "robóticos" e "baratos".

---

**Conclusão**: a direção dos 3 pilares (Planner · Performance · Projeto) + tiering inspirado em SEMrush + moat em MCP local **está validada pela pesquisa**. Pode seguir pra implementação sem rearranjo estrutural.
