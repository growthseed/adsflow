# Portal Publico V3 - Ads Flow

Versao otimizada do Portal Publico do cliente, com layout moderno,
metricas avancadas (ROAS/CAC/LTV/Payback), AI Insights, atribuicao
cross-platform e Goal Rings estilo Apple Watch.

## O que mudou

### Arquitetura
- Nova rota: `/portal-v3/:slug` (slug-based, sem auth, sem RPC Supabase)
- Coexiste com `/portal/:token` (versao antiga, token-based, segue funcionando)
- 100% offline-first: le de `src/data/snapshots/performance-snapshot.json`

### Widgets novos (5)
| Widget | Uso |
|---|---|
| `HeroBigNumberWidget` | Hero gigante com KPI principal + variacao % + semaforo (verde/amarelo/laranja/vermelho) |
| `GoalRingWidget` | Anel circular tipo Apple Watch com % atingido da meta |
| `KpiCardAdvancedWidget` | KPI card com icone + sparkline + variacao % + barra de progresso de meta |
| `AIInsightWidget` | Card de insight da IA com badge de prioridade + descricao |
| `AttributionDonutWidget` | Donut Meta x Google x outros com ROAS por canal + ROAS blended |

Todos exportados de `@/components/canonical/widgets`.

### Snapshot enriquecido
`performance-snapshot.json` ganhou os campos:
- `blended.total_sales` — vendas reais (calculadas via taxa Lead->Venda por nicho)
- `blended.total_conversion_value` — receita atribuida
- `blended.roas`, `cac`, `ltv_estimated`, `ltv_cac_ratio`, `payback_meses`, `avg_ticket`, `cpl`
- `goals` — metas mensais (spend/leads/sales/roas)
- `monthly_history[]` — historico de 6 meses com receita e ROAS
- `platforms[].campaigns[]` — 3-5 campanhas detalhadas por cliente com metrics completos
- `platforms[].daily[]` — breakdown diario de 30 dias (spend/clicks/conversions/impressions)
- `ai_insights[]` — 2-4 insights por cliente (positive/warning/critical/info + prioridade)

### Migration 029
`supabase/migrations/029_seed_metric_definitions.sql` popula a tabela
`metric_definitions` (criada vazia em 022) com **35 metricas-padrao**:
- 8 de midia paga (spend/CPM/CPC/CTR/etc)
- 4 de conversao (leads/CPL/sales/taxa)
- 9 financeiras (revenue/ROAS/ROI/CAC/LTV/Payback/Margem)
- 4 de funil (Op/vazamentos/tempo fechamento)
- 5 de forecast (Sales Velocity/Pipeline Coverage/Forecast Mes/Atingimento)
- 4 de atribuicao (receita por canal/ROAS real)
- 2 de operacao (tempo resposta/leads sem resposta)

## Como rodar local

```bash
cd "C:\Users\EFEITO DIGITAL\Ad Flow"
npm install                  # se ainda nao instalou
npm run dev                  # sobe Vite em http://localhost:5173
```

Depois abre no navegador:
- http://localhost:5173/portal-v3/homero-reis
- http://localhost:5173/portal-v3/dr-euvaldo-tomaz
- http://localhost:5173/portal-v3/escola-pequeno-aprendiz
- http://localhost:5173/portal-v3/dra-luciana
- http://localhost:5173/portal-v3/isaac-newton
- http://localhost:5173/portal-v3/blink-oftalmologia
- http://localhost:5173/portal-v3/grupo-m3
- http://localhost:5173/portal-v3/ze-umberto
- http://localhost:5173/portal-v3/moai

Todos 9 clientes ja tem snapshot enriquecido pronto.

## Como aplicar a migration 029

```bash
# Via Supabase CLI (recomendado)
supabase db push

# Ou direto no painel Supabase Studio:
# 1. Abrir SQL Editor
# 2. Colar conteudo de supabase/migrations/029_seed_metric_definitions.sql
# 3. Executar
```

Verificar:
```sql
SELECT COUNT(*), category
FROM metric_definitions
WHERE is_system = true
GROUP BY category
ORDER BY category;
-- Esperado: 35 registros distribuidos em 7 categorias
```

## Como adaptar para um cliente novo

1. Adicionar entrada nova em `src/data/snapshots/performance-snapshot.json`
   no node `clients.{slug-do-cliente}` com a mesma estrutura
   (copiar do `homero-reis` como template).
2. Acessar `http://localhost:5173/portal-v3/{slug-do-cliente}`.
3. Quando ligar dados reais: trocar o snapshot estatico por um
   service que le de `client_metric_goals`, `crm_deals`, `fact_ads_daily`.

## Quando ligar dados reais (Kommo + Meta MCP)

1. Habilitar os tools em Configuracoes → Conectores → Kommo Efeito → Tools.
2. Mesmo para Meta Ads.
3. Substituir o import estatico:
   ```ts
   // ANTES (mock)
   import performanceSnapshot from '@/data/snapshots/performance-snapshot.json'

   // DEPOIS (live)
   const { data } = useQuery(['portal', slug], () => fetchClientPortal(slug))
   ```
4. Criar `fetchClientPortal(slug)` em `src/services/clientPortalService.ts`
   que chama as APIs do Kommo + Meta + agrega no mesmo formato do snapshot.

## Estrutura final dos arquivos

```
Ad Flow/
  PORTAL_V3_README.md                                # este arquivo
  AUDITORIA_BI_ADS_FLOW.md                          # auditoria completa do BI atual
  src/
    pages/_v4/
      PublicClientPortalV3Page.tsx                  # NOVA - 618 linhas
      PublicClientPortalPage.tsx                    # antiga, segue funcionando
    components/canonical/widgets/
      HeroBigNumberWidget.tsx                       # NOVO
      GoalRingWidget.tsx                            # NOVO
      KpiCardAdvancedWidget.tsx                     # NOVO
      AIInsightWidget.tsx                           # NOVO
      AttributionDonutWidget.tsx                    # NOVO
      index.ts                                      # exports atualizados
    app/routes/
      lazy.ts                                       # adicionou V4PublicClientPortalV3Page
      publicRoutes.tsx                              # adicionou rota /portal-v3/:slug
    data/snapshots/
      performance-snapshot.json                     # ENRIQUECIDO: 9 clientes + ROAS/CAC/LTV/AI insights
  supabase/migrations/
    029_seed_metric_definitions.sql                 # NOVO - 35 metricas seed
```

## Validacao

```bash
npm run lint                # eslint - deve passar
npx tsc -b --noEmit         # type-check - deve passar
npm run build               # build de producao
```

---

**Autor:** Cowork (Claude) - 26/05/2026
**Branch sugerida:** `feature/portal-publico-v3`
