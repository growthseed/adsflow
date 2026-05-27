# 🔍 Auditoria BI — Ads Flow

**Data:** 26 de maio de 2026
**Auditor:** Cowork (Claude)
**Escopo:** Mapear gaps reais do BI no app (não no .pbit antigo). Foco em métricas avançadas (ROAS/CAC/LTV/atribuição) e oportunidades pra elevar o BI ao nível "completo e avançado".

---

## 📋 Sumário executivo

**O bom:** O Ads Flow é uma plataforma SaaS de classe — arquitetura template-driven (WidgetRenderer), stack moderna (React 19, TanStack Query, Supabase com RLS, Vercel), 28 migrations cobrindo praticamente tudo que um BI de mídia precisa.

**O ruim:** Vários sistemas críticos foram **modelados no banco mas nunca foram populados ou conectados na UI**. O resultado é um BI com fundação excelente, mas com gaps específicos que limitam o "wow factor" e a profundidade analítica.

**Veredito:** Não falta arquitetura, falta **conteúdo, conexão e widgets visuais**. Resolvendo 5 gaps específicos, o Ads Flow vira o "BI completo e avançado" que você quer.

---

## 🔴 Gaps críticos (alto impacto)

### 1. `metric_definitions` está VAZIA — sem seed

**Evidência:**
```bash
$ grep -rn "INSERT INTO metric_definitions" supabase/
# zero resultados
```

A tabela foi criada em **022_metric_registry.sql** com colunas perfeitas (`key`, `label`, `formula`, `direction`, `objectives`, `unit`, `format`), tem RLS, tem índice — **mas nenhuma migration popula ela**. Resultado: o registry de métricas está fingido.

**Consequência:**
- Dashboards mostram CPL, CPC, CTR (hardcoded em widgets) mas não têm ROAS, CAC, LTV, Payback, Sales Velocity, LTV:CAC, ROI.
- Time não consegue adicionar métrica nova sem mexer em código.
- Goals (`client_metric_goals.metric_definition_id`) ficam órfãos.

**Solução (Quick Win — 30 min de código):**
Criar `029_seed_metric_definitions.sql` com 30-40 métricas-padrão:
- Mídia: CPM, CPC, CPL, CPA, CTR, Frequência, Alcance, CPV (já implícitas, formalizar)
- Financeiras: **ROAS, CAC, LTV, LTV:CAC, ROI, Payback, Margem Bruta**
- Funil: Vazamento Lead→Op, Vazamento Op→Venda, Tempo Médio Fechamento
- Forecast: **Sales Velocity, Pipeline Coverage, Atingimento Meta %, Forecast Vendas Mês**
- Atribuição: Receita Atribuída Meta, Receita Atribuída Google, ROAS por canal real
- Saúde: Quality Score Médio (Google), Relevance Score (Meta)

### 2. `conversion_truth` (atribuição cross-platform) está MORTA

**Evidência:**
```bash
$ grep -rn "conversion_truth\|conversionTruth" src/ api/
# zero resultados em src/ ou api/
```

Migration **010_conversion_truth.sql** criou o schema. Zero código consome. Significa que: **você sabe quanto cada plataforma gastou, mas NÃO sabe qual plataforma fechou a venda no Kommo.**

**Consequência:** ROAS "por plataforma" é sempre estimado, nunca real. Cliente pergunta "Meta ou Google?" e ninguém responde com dados.

**Solução (Investimento médio — 2-3 dias):**
1. Criar serviço `attributionService.ts` que casa `fato_deals` (Kommo) com `fato_campanhas` (Meta) e `fato_google_ads` via UTM ou last-touch.
2. Criar widget `AttributionSankeyWidget` (gráfico de fluxo Plataforma → Lead → Venda).
3. Expor métrica `ROAS_Atribuido_Meta` e `ROAS_Atribuido_Google` no registry.
4. Adicionar no template do dashboard.

### 3. Apenas 7 widgets visuais (faltam 6+ críticos)

**Evidência:**
```
src/components/canonical/widgets/
├── AreaChartWidget.tsx
├── BarChartWidget.tsx
├── DonutChartWidget.tsx
├── FunnelChartWidget.tsx
├── GaugeWidget.tsx
├── LineChartWidget.tsx
└── TableWidget.tsx
```

**O que falta:**
| Widget | Pra quê serve | Esforço |
|---|---|---|
| `KpiCardWidget` | Big numbers com sparkline + variação + semáforo | 2h |
| `BigNumberWidget` | KPI gigante de página executiva | 1h |
| `HeatmapWidget` | Sazonalidade dia × hora | 4h |
| `CohortWidget` | Coorte de leads (mês criação × meses desde criação) | 6h |
| `WaterfallWidget` | Decomposição de variação | 4h |
| `SankeyWidget` | Atribuição cross-platform (fluxo) | 6h |
| `TreemapWidget` | Pareto/ABC de campanhas ou clientes | 3h |
| `ComboChartWidget` | Barras + linha (Investimento × ROAS) | 3h |
| `ScorecardWidget` | Cartão com KPI + meta + atingimento + alerta | 3h |

Sem esses widgets, o `WidgetRenderer` (que é arquiteturalmente lindo) está usando 30% do potencial.

### 4. Snapshots de cliente são mocks genéricos, não personalizados por nicho

**Evidência:**
```
src/data/snapshots/
├── clickup-snapshot.json
├── meta-ads-snapshot.json
└── performance-snapshot.json
```

Só 3 arquivos, genéricos. A página `ClientPerformancePage` é **template-driven** mas o template é único — não diferencia ecommerce vs serviço vs B2B vs SaaS.

**Solução (Quick Win — 1 dia):**
Criar templates por nicho:
- `ecommerce-template.json` (ROAS, ROI, CAC, AOV, conversão)
- `lead-gen-b2b-template.json` (CPL, pipeline coverage, sales velocity, ciclo de venda)
- `serviços-locais-template.json` (CPL, taxa de ligação, agendamentos, no-show)
- `saas-template.json` (CAC, LTV, MRR, churn, payback)

### 5. Página "Executiva" da agência (AgencyOverviewPage) provavelmente fraca

**Hipótese (a confirmar):**
A página que o gestor abre de manhã pra ver o status de todos os clientes provavelmente não tem:
- ❌ Semáforos por cliente (🟢🟡🔴 baseado em pacing + meta)
- ❌ Top 3 alertas urgentes da semana
- ❌ Ranking de clientes por ROAS / CAC / atingimento
- ❌ Comparativo agência vs mês anterior
- ❌ Forecast consolidado de receita do mês

**Próximo passo:** abrir `src/pages/_v4/AgencyOverviewPage.tsx` e validar.

---

## 🟡 Gaps médios

### 6. AI Insights (012) — está conectado nos dashboards?

Tabela `ai_insights` existe + feature `ai-chat` existe + `api/ai/chat.ts` existe. Mas precisa confirmar:
- O AI gera insight automaticamente quando dashboard abre?
- Ou só responde no chat quando o usuário pergunta?

Se for só reativo, virar **proativo** seria game-changer (cartão "💡 IA notou: seu CPL Meta subiu 23% essa semana, principal causa = criativo X").

### 7. Comparador — comparativo entre clientes?

Feature `comparador` existe (`src/features/comparador/`). Precisa confirmar se compara só período (M/M, Y/Y) ou também **entre clientes** (benchmark interno da agência).

Benchmark intra-agência é poderosíssimo — vendedor mostra pro cliente novo: "olha onde você está vs média da agência no seu nicho".

### 8. Reports — branding por cliente?

Feature `reports` + `api/reports/generate.ts` + `jsPDF` + `html-to-image`. Provavelmente exporta PDF. Mas: usa cores/logo do **cliente final** ou da **Efeito Digital**? Pro positioning de agência white-label é crucial diferenciar.

### 9. Performance de queries — sem evidência de materialized views

Pelo nome das migrations, não vi `CREATE MATERIALIZED VIEW`. Em dashboards que somam dezenas de milhares de linhas (3 meses de Meta Ads × 50 campanhas × 30 dias = 4.500 linhas só do Meta), aggregations on-the-fly degradam UX.

**Solução:** criar materialized views diárias por cliente + cron de refresh às 6am.

### 10. Mobile layout das páginas v4 — provavelmente desktop-first

A maioria dos clientes finais abre o portal pelo celular. Páginas `_v4/` foram feitas com react-grid-layout (que é responsivo), mas precisa confirmar se os breakpoints estão bem tuned.

---

## 🟢 Quick wins (impacto alto + esforço baixo)

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| Q1 | **Seed `metric_definitions` com 30+ métricas avançadas** | 2h | 🟢🟢🟢 Destrava registry + UI |
| Q2 | **Criar `KpiCardWidget` e `BigNumberWidget`** | 3h | 🟢🟢 Página executiva fica polida |
| Q3 | **Adicionar templates por nicho (4 nichos)** | 4h | 🟢🟢 Multi-cliente customizado |
| Q4 | **Materialized view `mv_client_performance_daily`** | 2h | 🟢🟢 Performance 5-10x mais rápida |
| Q5 | **AI Insights proativo no topo do dashboard** | 4h | 🟢🟢 Wow factor + valor diário |

**Total quick wins: ~15h de trabalho focado = transforma o BI.**

---

## 🚀 Investimentos maiores (alto impacto, 1-3 dias cada)

| # | Ação | Esforço | Por quê vale |
|---|---|---|---|
| I1 | Implementar atribuição (`conversion_truth` → UI + Sankey) | 2-3 dias | Resposta única do mercado: "Meta ou Google fechou a venda?" |
| I2 | Widget de Coorte de leads + retenção | 1-2 dias | Diferencial vs Reportei/Looker |
| I3 | Página Executiva da Agência (overhaul) | 2 dias | Vira ferramenta de gestão diária |
| I4 | Pacing avançado com forecast Monte Carlo | 3 dias | Previsão estatística vs linear |
| I5 | Export PDF white-label por cliente | 1-2 dias | Diferencial comercial |

---

## 📊 O que comparar contra meu plano antigo (.pbit)

As 31 medidas que eu propus para o Power BI são todas válidas — vão pro `metric_definitions` direto:

| Categoria | Quantidade |
|---|---|
| Financeiras (CPL/ROAS/CAC/ROI/LTV/Payback/Margem) | 18 |
| Forecast e funil (Sales Velocity/Pipeline/Vazamento/Coorte) | 13 |
| **Total pronto pra seed** | **31** |

---

## 🎯 Recomendação de execução (proposta minha)

**Sprint 1 (1 semana — Quick wins):**
- Q1 + Q2 + Q4 → metric_definitions povoado + 2 widgets novos + materialized view
- **Entrega:** dashboards 5-10× mais rápidos, com métricas avançadas, com cartões polidos.

**Sprint 2 (1 semana — Templates + AI proativo):**
- Q3 + Q5 → 4 templates por nicho + AI insight proativo no topo do dashboard.
- **Entrega:** cada cliente vê dashboard adequado ao nicho dele, com insight de IA no topo.

**Sprint 3 (2 semanas — Atribuição):**
- I1 → conversion_truth conectado, Sankey de atribuição, métricas reais por canal.
- **Entrega:** Ads Flow responde "qual plataforma trouxe a venda?" com dados.

**Sprint 4 (1-2 semanas — Diferencial competitivo):**
- I2 + I3 → Coorte + página executiva refeita.
- **Entrega:** Ads Flow vira ferramenta de gestão de carteira de clientes.

**Total: 5-6 semanas pra um Ads Flow 10× melhor.**

---

## 📝 Próximo passo recomendado

**Eu sugiro começar pelo Quick Win #1 (Seed metric_definitions) AGORA**, porque:
1. Resolve sua dor #1 declarada (faltam ROAS/CAC/LTV/atribuição)
2. Destrava todos os outros: widgets, templates, alertas, AI insights — tudo lê do registry
3. Esforço: 2 horas
4. Risco: zero (só insert, sem mudar código de UI)

Se você topar, eu já gero o `029_seed_metric_definitions.sql` com 30+ métricas, cada uma com formula DAX-equivalente em SQL/JS, descrição, categoria, direção, format, etc.

---

**Auditoria gerada por Cowork em 2026-05-26.**
