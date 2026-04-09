# Checklist — Campaigns Ready to Scale

> Adaptado do tool "Campaigns Ready to Scale" da **Defined Digital Academy (Aaron Young)**. Identifica **vertical scaling** — onde aumentar budget sem aumentar CPA.

## Princípio

**Scaling ≠ subir bid aleatoriamente.** Scaling inteligente é identificar campanhas/keywords com:
1. Performance acima da meta (ROAS ou CPA)
2. **Impression share limited by budget** (não por rank)
3. Demand/volume disponível no mercado (search volume não estourado)

Quando essas 3 condições batem, adicionar budget gera retorno proporcional. Se faltar qualquer uma, você só aumenta o custo.

## Quando usar

- Revisão mensal de performance
- Cliente pede "como faço pra crescer?"
- Fim de mês, restando budget não gasto em campanha saudável
- Início de novo trimestre/sazonalidade alta

## Passo 1 — Identificar candidatas a scaling

Query GAQL:

```gaql
SELECT
  campaign.id,
  campaign.name,
  campaign.advertising_channel_type,
  campaign.bidding_strategy_type,
  campaign_budget.amount_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.cost_per_conversion,
  metrics.search_impression_share,
  metrics.search_budget_lost_impression_share,
  metrics.search_rank_lost_impression_share
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
  AND metrics.conversions >= 10
ORDER BY metrics.conversions DESC
```

## Passo 2 — Matriz de classificação

Pra cada campanha, classificar em um dos 4 quadrantes:

```
                      ROAS/CPA meta
                   atinge        não atinge
                 ┌───────────┬───────────┐
  Budget Lost IS │           │           │
  > 15%          │ 🟢 SCALE  │ 🔴 FIX    │
                 │ UP        │ FIRST     │
                 ├───────────┼───────────┤
  Budget Lost IS │           │           │
  ≤ 15%          │ 🟡 HOLD   │ 🔴 PAUSE/ │
                 │           │ RESTRUCT  │
                 └───────────┴───────────┘
```

### 🟢 SCALE UP (golden)
- **Condições**: CPA/ROAS na meta + Budget Lost IS > 15%
- **Ação**: aumentar budget em 20-30% por semana (não mais! pra não quebrar learning)
- **Medir**: CPA mantém? Subiu? Conversões cresceram proporcional?

### 🟡 HOLD (saudável mas sem espaço)
- **Condições**: CPA/ROAS na meta + Budget Lost IS ≤ 15%
- **Ação**: manter, **NÃO mexer**. Campanha tá otimizada. Qualquer mexida pode quebrar.
- **Exceção**: se cliente quer crescer, considerar duplicar campanha pra nova vertical/geo/audiência

### 🔴 FIX FIRST (potencial bloqueado por problema)
- **Condições**: CPA/ROAS NÃO atinge meta + Budget Lost IS > 15%
- **Ação**: **NÃO adicionar budget**. Resolver problema antes (QS, negative, LP, copy).
- **Se não resolver e adicionar budget** = só acelera o sangramento

### 🔴 PAUSE/RESTRUCTURE
- **Condições**: CPA/ROAS NÃO atinge meta + Budget Lost IS ≤ 15%
- **Ação**: pausar ou reestruturar. Campanha tá gastando tudo e performando mal.
- **Diagnóstico**: Rank Lost IS alto? → QS ou bid. Tudo ruim? → Segmentação/audience errada.

## Passo 3 — Estimar impacto do scaling

Pra cada campanha 🟢 SCALE UP, calcular:

### Fórmula base (regra prática)

```
Budget atual: B
Budget Lost IS: L%
Conversões atuais: C
CPA atual: A

Se aumentar budget até capturar todo o Budget Lost IS:
  Budget novo = B / (1 - L/100)
  Delta budget = Budget novo - B
  Conversões adicionais estimadas ≈ (C * L / 100 / (1 - L/100))
  CPA provável = A (mantém, se scaling for gradual)
```

**Exemplo real (Tendency Web, caso brasileiro):**
- Budget atual: R$ 1.000
- Conversões: 17
- CPA: R$ 58
- Budget Lost IS: 33,5%
- Rank Lost IS: 51%

Cálculo:
- Budget novo: 1000 / (1 - 0.335) = R$ 1.503 → **+R$ 503**
- Conversões adicionais: 17 * 0.335 / 0.665 ≈ **+8,5 conversões** (round: 8)
- Total esperado: 25 conversões ao mesmo CPA ~R$ 60

> ⚠️ **Mas atenção**: Rank Lost IS de 51% nesse exemplo indica que só aumentar budget **não resolve**. Tem problema de QS também. Sempre olhar as 2 métricas juntas.

## Passo 4 — Plano de scaling (staged)

**Scaling abrupto = quebra bid strategy learning.** Fazer em fases:

### Semana 1
- Aumentar budget em +15% a +25%
- Monitorar: CPA, conversões, impression share
- Não mexer em bid strategy, ads, keywords

### Semana 2 (se métricas OK)
- Aumentar mais +15% a +25%
- Monitorar mesmos KPIs

### Semana 3
- Avaliar: budget estabilizou? conversões subiram proporcional?
- Se sim: manter nível novo ou continuar subindo
- Se não: voltar 1 degrau

### Quando parar de escalar
- **CPA sobe > 20%** do baseline → pare, re-otimize
- **Budget Lost IS < 10%** → atingiu teto de capture, não adianta subir mais
- **Conversões param de crescer mas custo sobe** → mercado saturado

## Passo 5 — Oportunidades horizontais (se scaling vertical esgotar)

Quando não dá mais pra escalar campanha atual, procurar scaling horizontal:

1. **Novas geografias**: outras cidades/estados/países
2. **Novos públicos**: B2B → B2C, ou criar campanha dedicada pra nicho
3. **Novos formatos**: Search → adicionar PMAX ou Display Remarketing
4. **Novos devices**: se só desktop → adicionar mobile (ou vice-versa)
5. **Novos horários**: se só 9h-18h → testar 18h-23h
6. **Novas keywords** identificadas via keyword-ngram-audit
7. **Competidor bidding**: aparecer em leilões onde o concorrente está

## Output: relatório de scaling

```markdown
# Campaigns Ready to Scale — {Cliente} — {YYYY-MM-DD}

## Candidatas 🟢 SCALE UP

### Campanha: {nome}
- **CPA atual**: R$ X (meta: R$ Y) ✅
- **Budget Lost IS**: Z% 🎯
- **Rank Lost IS**: W%
- **Budget atual**: R$ B
- **Budget sugerido**: R$ B+ΔB (+X%)
- **Conversões esperadas**: +N/mês
- **Plano de scaling**: semana 1 +15%, semana 2 +15%, avaliar

## Fix First 🔴

### Campanha: {nome}
- **Problema principal**: QS baixo / Rank Lost IS alto / LP ruim
- **Ação antes de escalar**: {específica}
- **Não adicionar budget agora**

## HOLD 🟡

### Campanha: {nome}
- Saudável e otimizada. Não mexer.
- Considerar duplicar pra nova vertical/geo se cliente quer crescer.

## Oportunidades horizontais
- {...}

## Próximos passos
- [ ] Gestor aprovar plano de scaling
- [ ] Cliente aprovar aumento de budget total
- [ ] Agendar revisão em 14 dias
```

## Padrão aprendido (atualizar)

- Campanhas PMAX: scaling mais agressivo aceitável (+30-40% por semana) porque algoritmo do Google otimiza rápido
- Campanhas Search com Smart Bidding maduro (> 30 conv/mês): scaling seguro até +25%/semana
- Campanhas Search com Manual CPC: scaling mais lento, +15%/semana, e revisar bid manualmente
- Shopping/PMAX em e-commerce: scaling deve considerar estoque! Nunca escalar se produto está pra esgotar
