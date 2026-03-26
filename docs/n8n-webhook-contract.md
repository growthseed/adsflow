# N8N Webhook Contract — `/adsflow/meta-sync`

## Overview

O frontend do Ads Flow envia um POST para o N8N webhook.
O N8N consulta a Meta Graph API e retorna os dados formatados.

**Base URL**: `https://ia-kommo-n8n.xl78rn.easypanel.host/webhook`
**Endpoint**: `/adsflow/meta-sync`
**Method**: `POST`

---

## Request

```json
{
  "ad_account_id": "act_433655990500782",
  "sync_type": "full",
  "date_range": {
    "since": "2026-01-17",
    "until": "2026-02-16"
  },
  "level": "all"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ad_account_id` | string | Sim | ID da conta Meta Ads (ex: `act_433655990500782`) |
| `sync_type` | `"full"` \| `"incremental"` \| `"manual"` | Sim | Tipo de sincronização |
| `date_range.since` | string (YYYY-MM-DD) | Não | Data inicial (default: últimos 30 dias) |
| `date_range.until` | string (YYYY-MM-DD) | Não | Data final (default: hoje) |
| `level` | `"campaign"` \| `"adset"` \| `"ad"` \| `"all"` | Não | Nível de detalhe (default: `"all"`) |

---

## Response (Success)

```json
{
  "success": true,
  "campaigns": [
    {
      "platform_campaign_id": "120237979789750760",
      "name": "[ED] ENGAJ Apetit Natural | Ceia",
      "objective": "OUTCOME_ENGAGEMENT",
      "status": "ACTIVE",
      "daily_budget": null,
      "lifetime_budget": 700.00,
      "start_date": "2024-12-28",
      "end_date": null
    }
  ],
  "campaign_insights": [
    {
      "platform_campaign_id": "120237979789750760",
      "date": "2026-02-15",
      "impressions": 12500,
      "reach": 8900,
      "clicks": 320,
      "spend": 45.80,
      "ctr": 2.56,
      "cpc": 0.14,
      "cpm": 3.66,
      "conversions": 12,
      "conversion_value": 480.00,
      "cost_per_conversion": 3.82,
      "roas": 10.48,
      "frequency": 1.40,
      "engagement": 156,
      "post_reactions": 89,
      "post_comments": 23,
      "post_shares": 44,
      "video_views": 2300,
      "video_thruplay": 1200,
      "leads": 8,
      "cost_per_lead": 5.73,
      "breakdown": null,
      "raw_data": null
    }
  ],
  "adset_insights": [
    {
      "platform_campaign_id": "120237979789750760",
      "platform_adset_id": "120237979789760760",
      "adset_name": "Conjunto Engajamento - WhatsApp",
      "date": "2026-02-15",
      "impressions": 12500,
      "reach": 8900,
      "clicks": 320,
      "spend": 45.80,
      "ctr": 2.56,
      "cpc": 0.14,
      "cpm": 3.66,
      "conversions": 12,
      "cost_per_conversion": 3.82,
      "roas": 10.48,
      "leads": 8,
      "cost_per_lead": 5.73,
      "raw_data": null
    }
  ],
  "ad_insights": [
    {
      "platform_campaign_id": "120237979789750760",
      "platform_adset_id": "120237979789760760",
      "platform_ad_id": "120237979826300760",
      "ad_name": "Ad 05 - Pizza para Final de Ano",
      "date": "2026-02-15",
      "impressions": 6200,
      "reach": 4500,
      "clicks": 180,
      "spend": 24.50,
      "ctr": 2.90,
      "cpc": 0.14,
      "cpm": 3.95,
      "conversions": 7,
      "cost_per_conversion": 3.50,
      "roas": 12.24,
      "hook_rate": 28.5,
      "hold_rate": 15.2,
      "engagement": 89,
      "post_reactions": 52,
      "post_comments": 15,
      "post_shares": 22,
      "post_saves": 8,
      "video_views": 1300,
      "video_thruplay": 680,
      "video_p25": 1100,
      "video_p50": 900,
      "video_p75": 750,
      "video_p100": 680,
      "creative_id": "862765513199716",
      "creative_thumbnail_url": "https://scontent.xx.fbcdn.net/v/...",
      "raw_data": null
    }
  ]
}
```

---

## Response (Error)

```json
{
  "success": false,
  "error": "Invalid access token or account ID"
}
```

---

## Meta Graph API Fields Required

### Campaigns (`/act_{id}/campaigns`)
```
fields=id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time
```

### Campaign Insights (`/{campaign_id}/insights`)
```
fields=impressions,reach,clicks,spend,ctr,cpc,cpm,actions,action_values,frequency,
       post_engagement,post_reactions_like_total,comment,share,
       video_thruplay_watched_actions
time_increment=1
date_preset=last_30d  (ou time_range com since/until)
```

### AdSet Insights (`/act_{id}/insights?level=adset`)
```
fields=adset_id,adset_name,impressions,reach,clicks,spend,ctr,cpc,cpm,
       actions,action_values
time_increment=1
```

### Ad Insights (`/act_{id}/insights?level=ad`)
```
fields=ad_id,ad_name,adset_id,impressions,reach,clicks,spend,ctr,cpc,cpm,
       actions,action_values,
       post_engagement,post_reactions_like_total,comment,share,
       video_thruplay_watched_actions,
       video_p25_watched_actions,video_p50_watched_actions,
       video_p75_watched_actions,video_p100_watched_actions
time_increment=1
```

### Calculated Fields (N8N deve calcular)

| Campo | Fórmula |
|-------|---------|
| `conversions` | Sum of `actions` where `action_type` in (`lead`, `purchase`, `complete_registration`, `contact`, `onsite_conversion.messaging_conversation_started_7d`) |
| `conversion_value` | Sum of matching `action_values` |
| `cost_per_conversion` | `spend / conversions` |
| `roas` | `conversion_value / spend` |
| `leads` | `actions` where `action_type` = `lead` or `onsite_conversion.messaging_conversation_started_7d` |
| `cost_per_lead` | `spend / leads` |
| `hook_rate` | `(video_3s_views / impressions) * 100` |
| `hold_rate` | `(video_p75 / impressions) * 100` |
| `engagement` | `post_reactions + post_comments + post_shares` |

---

## N8N Workflow Steps

1. **Webhook Trigger** → Recebe POST
2. **Set Variables** → Extrai `ad_account_id`, `date_range`
3. **HTTP Request — Campaigns** → GET `https://graph.facebook.com/v21.0/{account_id}/campaigns`
4. **HTTP Request — Campaign Insights** → GET `https://graph.facebook.com/v21.0/{account_id}/insights?level=campaign`
5. **HTTP Request — AdSet Insights** → GET `https://graph.facebook.com/v21.0/{account_id}/insights?level=adset`
6. **HTTP Request — Ad Insights** → GET `https://graph.facebook.com/v21.0/{account_id}/insights?level=ad`
7. **Function — Transform** → Normaliza dados para o formato do contrato
8. **Respond to Webhook** → Retorna JSON

### Authentication
O N8N deve ter um **HTTP Header Auth** ou **OAuth2** configurado com:
- Token de longa duração do Meta Ads
- Ou System User Token do Business Manager

---

## Budget Values

Meta retorna budgets em **centavos**. O N8N deve converter para reais:
```
lifetime_budget = meta_value / 100
daily_budget = meta_value / 100
spend = já vem em reais no insights
```

---

## Pagination

Para contas com muitas campanhas, o N8N deve implementar paginação:
```
?limit=100&after={cursor}
```
Iterar até `paging.next` ser `null`.
