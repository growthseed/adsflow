# Checklist — Keyword & Search Terms Audit com N-gram + SWOT

> Técnica adaptada da **Defined Digital Academy (Aaron Young)**. É a ferramenta mais poderosa do playbook pra identificar waste e oportunidades em qualquer conta Search/Shopping, em minutos.

## Quando usar

- Auditoria de conta existente (mensal ou sob demanda)
- Antes de propor grandes mudanças estruturais
- Quando cliente reclama "to gastando muito e o resultado tá caindo"
- Primeiro mês de onboarding de novo cliente (após 30 dias de dados)
- E-commerce com muitos produtos (≥ 100 SKUs) → onde análise manual é impraticável

## Inputs necessários

### Opção A — MCP conectado (preferencial)
- `customer_id` do cliente
- Período (padrão: últimos 30 dias; pra e-commerce usar 60 dias)
- Vertical do cliente (pra aplicar heurística certa)

### Opção B — CSVs exportados do Google Ads (fallback)
Quando MCP não estiver disponível, o gestor exporta e cola na conversa:
1. **Keywords report** (Google Ads → Keywords → Download CSV)
2. **Search Terms report** (Google Ads → Search Terms → Download CSV)
3. **Product report** (e-commerce Shopping → Products → Download CSV)
4. **Campaign report** (contexto geral)

## Passo 1 — N-gram Analysis

**O que é N-gram:** agrupar search terms em frases de 1, 2 ou 3 palavras pra identificar padrões que keyword-level esconde.

### 1-gram (palavras isoladas)
Identifica palavras individuais que mais consomem budget. Útil pra descobrir termos que aparecem em múltiplas search terms.

### 2-gram (pares de palavras) — **o mais útil**
Identifica combinações de 2 palavras que concentram gasto. Exemplo: "grátis download", "como fazer", "curso gratuito" — padrões que matam performance.

### 3-gram (trincas de palavras)
Pra contas com alto volume (> 10k search terms). Revela intenções específicas.

### Como executar via MCP

```
# Pseudocódigo — Claude faz isso internamente via execute_gaql_query
1. Puxar todos os search terms dos últimos 30d com métricas
2. Tokenizar cada search term em 1-gram, 2-gram, 3-gram
3. Agregar métricas por n-gram:
   - Total impressões
   - Total cliques
   - Total cost
   - Total conversões
   - CPA do n-gram
4. Ranquear por cost desc
5. Separar em 3 buckets:
   - Top spenders (top 20 por cost)
   - Top converters (top 20 por conversions)
   - Wasted (cost > X e conversions = 0)
```

### Buckets de ação

| Bucket | Critério | Ação sugerida |
|---|---|---|
| **🟢 Winners** | N-gram com CPA ≤ meta e volume ≥ 10 conv | Considerar promover pra ad group/campanha dedicada |
| **🟡 Suspects** | N-gram com CTR < 1% ou CPA 1.5-2x meta | Investigar LP, copy, ou mover pra STAG |
| **🔴 Wasted** | N-gram com cost ≥ R$ 50 e 0 conversões | Candidato a negative keyword |
| **⚠️ Leakage** | N-gram com palavra "grátis/free/tutorial/como" (se não for oferta) | Negative imediato |

## Passo 2 — SWOT do account

Análise estratégica em 4 eixos:

### Strengths (forças)
- Quais campanhas/ad groups estão com ROAS ou CPA acima da meta?
- Quais keywords têm QS ≥ 8?
- Quais dias/horários têm melhor performance?
- Quais devices convertem melhor?

### Weaknesses (fraquezas)
- Quais campanhas estão com QS < 5?
- Onde a conta tá perdendo impression share por budget?
- Onde a conta tá perdendo impression share por rank?
- Quais keywords têm alto CTR mas baixa conversão (LP problem)?

### Opportunities (oportunidades)
- N-gram winners que podem virar campanha própria
- Budget Lost IS > 20% = espaço pra escalar
- Keywords do competidor aparecendo nos search terms (auction insights)
- Search terms com volume crescente mês a mês

### Threats (ameaças)
- Rank Lost IS crescente = concorrente subiu bid ou melhorou QS
- CPC médio aumentando sem aumento de conversão (pressão competitiva)
- Search terms saturadas (volume caindo)
- Dependência de 1-2 campanhas (> 70% do gasto em poucas)

## Passo 3 — Output: relatório estratégico

Salvar em `~/Clients/{cliente}/07-outputs/audits/{YYYY-MM-DD}-keyword-ngram-audit.md`:

```markdown
# Keyword & Search Terms Audit — {Cliente} — {YYYY-MM-DD}

## Snapshot da conta
- Período: {data_from} a {data_to}
- Investimento: R$ {cost}
- Conversões: {N}
- CPA médio: R$ {cpa} (meta: R$ {meta_cpa})
- CTR médio: {ctr}% (benchmark vertical: {benchmark})

## 1-gram análise — top 10 por gasto
| Palavra | Impressões | Cliques | Cost | Conv | CPA |
|---|---|---|---|---|---|

## 2-gram análise — 🟢 Winners
| N-gram | Cost | Conv | CPA | Ação sugerida |
|---|---|---|---|---|
| "criar landing" | R$ 450 | 12 | R$ 37 | Criar ad group dedicado "Criar Landing Page" |

## 2-gram análise — 🔴 Wasted
| N-gram | Cost | Conv | Motivo | Negative sugerido |
|---|---|---|---|---|
| "página grátis" | R$ 228 | 0 | Intenção gratuita | ✅ Adicionar [página grátis] |
| "canva grátis" | R$ 85 | 0 | Competitor tool | ✅ Adicionar [canva] |

## SWOT

### 🟢 Strengths
- Campanha X com ROAS 4.2x
- QS médio de 7.8 em keywords core
- Horário 19h-22h converte 2.3x melhor

### 🔴 Weaknesses
- Campanha Y perdendo 84% das impressões (53% budget, 31% rank)
- QS ≤ 4 em 3 keywords com R$ 340/mês de custo

### 🟡 Opportunities
- Escalar Campanha X em R$ {sugestão} (Budget Lost IS 34%)
- Criar campanha dedicada pra intent "como fazer landing page" (N-gram winner)
- Remarketing ainda não ativo

### ⚠️ Threats
- Rank Lost IS cresceu 12% MoM → concorrente subiu bid
- Dependência alta: Campanha X = 68% do budget total

## Ações priorizadas por impacto financeiro

### Alta prioridade (impacto > R$ 500/mês)
1. **Negativar N-grams wasted**: economia estimada R$ {valor}/mês
   - Lista: {lista completa}
2. **Corrigir QS da keyword Z**: custo/mês cai ~30%
3. **Escalar Campanha X em +R$ {valor}**: +{N} conversões estimadas

### Média prioridade
1. ...

### Baixa prioridade
1. ...

## Próximos passos
- [ ] Gestor aprovar lista de negatives antes de aplicar
- [ ] Validar budget adicional com cliente
- [ ] Agendar auditoria pós 14 dias das mudanças
```

## Pós-análise — registrar aprendizados

Se durante a auditoria você descobrir algum padrão que seja útil pra outros clientes do mesmo vertical:

1. Registra no `verticals/{vertical}.md` como "N-gram padrão a negativar" ou "N-gram winner comum"
2. Anota no CLAUDE.md do cliente em "Histórico de decisões estratégicas"
3. Se for insight forte, adiciona como case em `winning-campaigns/`

**Exemplo de aprendizado registrado:**
> 2026-04-07 — Cliente Escola PA, vertical educação. Aprendizado: N-grams com "curso gratuito", "apostila pdf", "download grátis" devem ser negativados de cara no onboarding. Poupa R$ ~600 no primeiro mês em contas de educação com orçamento ≥ R$ 3k.

Esse padrão de aprendizado incremental é o que diferencia o playbook de best practices genéricas — é **conhecimento acumulado da Efeito Digital**.
