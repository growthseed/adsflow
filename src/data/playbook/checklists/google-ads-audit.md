# Checklist — Auditoria Google Ads (30 dias)

Roteiro passo-a-passo pra auditar uma conta Google Ads. Use dados dos últimos 30 dias como padrão (configurável). Gera relatório em `~/Clients/{cliente}/07-outputs/audits/{YYYY-MM-DD}-audit-gads.md`.

## 0. Pré-requisitos

- [ ] MCP `google-ads` conectado e autenticado
- [ ] `customer_id` do cliente identificado no CLAUDE.md
- [ ] `login_customer_id` = MCC `1011817676`
- [ ] Vertical do cliente conhecida (pra carregar heurísticas certas)

## 1. Visão geral da conta (health check)

Query inicial — entender o tamanho e status:

```gaql
SELECT
  customer.descriptive_name,
  customer.currency_code,
  customer.time_zone,
  customer.auto_tagging_enabled
FROM customer
```

Captura:
- [ ] Nome da conta
- [ ] Moeda (esperado BRL)
- [ ] Timezone (esperado America/Sao_Paulo)
- [ ] **Auto-tagging habilitado?** Se não, flag vermelha — perde atribuição GA4

## 2. Conversões configuradas

```gaql
SELECT
  conversion_action.name,
  conversion_action.category,
  conversion_action.status,
  conversion_action.primary_for_goal,
  conversion_action.counting_type,
  conversion_action.attribution_model_settings.attribution_model,
  metrics.all_conversions,
  metrics.all_conversions_value
FROM conversion_action
WHERE conversion_action.status = 'ENABLED'
```

Avaliar:
- [ ] Existe pelo menos 1 conversão primária?
- [ ] A conversão primária está recebendo dados nos últimos 30d?
- [ ] Modelo de atribuição é `DATA_DRIVEN` (ideal) ou `LAST_CLICK` (aceitável)?
- [ ] Tem conversão secundária pra otimizar bid?
- [ ] **Se zero conversões configuradas → PARAR auditoria e fazer tracking first.**

## 3. Campanhas — overview

```gaql
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign.bidding_strategy_type,
  campaign_budget.amount_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.search_impression_share,
  metrics.search_budget_lost_impression_share,
  metrics.search_rank_lost_impression_share
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
```

Pra cada campanha, classificar:

| Status diagnóstico | Critério |
|---|---|
| ✅ **Saudável** | ROAS ≥ meta, CPA ≤ meta, SIS ≥ 60%, Budget Lost < 15% |
| ⚠️ **Subscaling** | ROAS/CPA bons mas Budget Lost IS > 20% → pedir autorização pra escalar |
| ⚠️ **Rank-limited** | Rank Lost IS > 30% → investigar QS e bids |
| 🔴 **Underperforming** | CPA > 1.5x meta OU ROAS < 50% da meta → pausar ou reestruturar |
| 🔴 **Learning stuck** | > 14 dias sem sair de "Learning" → bid strategy ou conversão com problema |

## 4. Quality Score — keyword level

```gaql
SELECT
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.quality_info.quality_score,
  ad_group_criterion.quality_info.creative_quality_score,
  ad_group_criterion.quality_info.post_click_quality_score,
  ad_group_criterion.quality_info.search_predicted_ctr,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  campaign.name,
  ad_group.name
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS
  AND ad_group_criterion.status = 'ENABLED'
  AND metrics.impressions > 100
ORDER BY metrics.cost_micros DESC
LIMIT 200
```

Flags automáticas:
- [ ] **QS ≤ 4 com custo > R$ 100**: auditoria urgente (copy, LP, relevância)
- [ ] **Landing Page score = BELOW_AVERAGE**: LP tá matando a campanha
- [ ] **Expected CTR = BELOW_AVERAGE**: copy do anúncio fraca
- [ ] **Ad Relevance = BELOW_AVERAGE**: keyword não casa com ad group

## 5. Search Terms — waste detection

```gaql
SELECT
  search_term_view.search_term,
  segments.keyword.info.text,
  segments.keyword.info.match_type,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.cost_micros > 10000000
ORDER BY metrics.cost_micros DESC
LIMIT 500
```

Ação:
- [ ] Termos com **custo > R$ 50 e 0 conversões** → candidatos a negative
- [ ] Termos com CTR > 10% e 0 conversões → LP ou oferta não bate com intenção
- [ ] Termos "grátis", "curso gratuito", "download free" (se não é oferta) → negative imediato
- [ ] Termos com intenção informacional ("o que é", "como funciona") → considerar mover pra campanha separada de awareness

## 6. Ads (anúncios)

```gaql
SELECT
  ad_group.name,
  ad_group_ad.ad.id,
  ad_group_ad.ad.type,
  ad_group_ad.ad.responsive_search_ad.headlines,
  ad_group_ad.ad.responsive_search_ad.descriptions,
  ad_group_ad.ad_strength,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM ad_group_ad
WHERE segments.date DURING LAST_30_DAYS
  AND ad_group_ad.status = 'ENABLED'
ORDER BY metrics.impressions DESC
```

Avaliar:
- [ ] **Ad Strength = POOR** ou **AVERAGE**: adicionar assets (headlines, descriptions, sitelinks, callouts)
- [ ] Mínimo 2 RSAs por ad group (para A/B)
- [ ] Headlines com keyword da campanha pelo menos 3x
- [ ] Usar pinning só se existir razão (compliance, marca)

## 7. Extensions (assets)

```gaql
SELECT
  asset.type,
  asset.name,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions
FROM asset
WHERE asset.type IN ('SITELINK', 'CALLOUT', 'STRUCTURED_SNIPPET', 'CALL', 'LOCATION', 'PROMOTION')
```

Checklist mínimo:
- [ ] ≥ 6 sitelinks com descrições
- [ ] ≥ 4 callouts
- [ ] ≥ 2 structured snippets
- [ ] Call extension (se ligação for meio válido)
- [ ] Location extension (se tem ponto físico)

## 8. Audiências e remarketing

```gaql
SELECT
  user_list.name,
  user_list.size_for_display,
  user_list.size_for_search,
  user_list.membership_status
FROM user_list
```

- [ ] Existe lista de visitantes do site (180d)?
- [ ] Existe lista de usuários convertidos (pra excluir ou lookalike)?
- [ ] Listas populadas (size > 1000)?

## 9. Geografia e horário

Analisar `campaign_criterion` e `ad_schedule_view`:
- [ ] Segmentação geográfica faz sentido pro ticket médio?
- [ ] Dia/hora com performance muito diferente do médio → schedule
- [ ] Excluir países/estados onde o cliente não atende

## 10. Síntese — TOP 5 achados

Estrutura do relatório final em `07-outputs/audits/{data}-audit-gads.md`:

```markdown
# Auditoria Google Ads — {Cliente} — {YYYY-MM-DD}

## Resumo executivo
- Gasto período: R$ X
- Conversões: N
- CPA médio: R$ X (meta: R$ Y)
- ROAS: Nx (meta: Yx)
- **Status geral**: ✅ saudável | ⚠️ atenção | 🔴 crítico

## TOP 5 achados (priorizados por impacto financeiro)
1. **[ACHADO]**: contexto → ação recomendada → impacto estimado
2. ...

## Diagnóstico por campanha
| Campanha | Status | Principal issue | Ação |
|---|---|---|---|

## Waste detectado
- Negative keywords sugeridas: {lista}
- Keywords com QS baixo pra pausar: {lista}
- Budget a realocar: R$ X de {campanha A} → {campanha B}

## Oportunidades de crescimento
- Keywords/temas sub-explorados
- Campanhas com Budget Lost IS alto pra escalar
- Novos formatos (PMAX, Video) pra testar

## Próximos passos
1. ...
```

## Pós-auditoria

- [ ] Salvar relatório em `07-outputs/audits/`
- [ ] Registrar decisões no CLAUDE.md do cliente em "Histórico de decisões estratégicas"
- [ ] Se mudanças forem executadas: criar TODO em `07-outputs/audits/{data}-acoes-executadas.md`
