# Checklist — Landing Page Deep Audit

> Técnica adaptada do workflow do Tendency Web (vídeo prático brasileiro). O diferencial: Claude **visita a URL real** do anúncio, cruza com keyword/intent de busca, e identifica desalinhamentos específicos.

## Princípio central

> "Quem pesquisa '{keyword X}' chega numa homepage genérica. Google avalia se a página de destino é relevante pro termo — e homepage raramente passa."

Quality Score é função direta de: **keyword → anúncio → landing page**. Se a LP for genérica, toda a conta sofre.

## Quando usar

- Qualquer keyword com **QS ≤ 5** e custo significativo
- CTR alto + conversão baixa (LP problem classical)
- "Landing Page Experience" = `BELOW_AVERAGE` no Google Ads
- Antes de criar campanha nova (prevenir em vez de remediar)
- Quando o mesmo URL atende a múltiplos ad groups (red flag)

## Passo 1 — Mapear ad_group → url de destino

Query via MCP Google Ads:

```gaql
SELECT
  ad_group.id,
  ad_group.name,
  ad_group_ad.ad.final_urls,
  ad_group_ad.ad.final_mobile_urls,
  metrics.clicks,
  metrics.conversions,
  metrics.ctr,
  ad_group_criterion.keyword.text
FROM ad_group_ad
WHERE segments.date DURING LAST_30_DAYS
  AND ad_group_ad.status = 'ENABLED'
```

Output esperado:

| Ad group | Keyword principal | URL destino | Cliques | Conv |
|---|---|---|---|---|
| Criar LP | "criar landing page" | /home | 340 | 3 |
| Criar Página de Venda | "página de vendas" | /home | 210 | 1 |
| Criador de Site | "criador de site" | /home | 180 | 2 |

**Red flag #1 — Múltiplos ad groups → mesma URL**: "Todos os grupos apontam pra homepage" é o caso clássico de QS destruído.

## Passo 2 — Visitar cada URL (scrape + análise)

Pra cada URL única no ad_group mapping, usar WebFetch ou agent-browser pra capturar:

- **`<title>` da aba**
- **H1, H2 visíveis above the fold**
- **CTA principal above the fold**
- **Copy do hero section**
- **Prova social (depoimentos, números, logos)**
- **Primeira dobra de imagem/ilustração**
- **Formulário visível? campos? botão?**

## Passo 3 — Matching: keyword ↔ LP

Pra cada par (keyword, LP), avaliar:

### Relevance Score (1-5)

| Score | Critério |
|---|---|
| 5 | Keyword aparece no H1, no `<title>`, na URL, e no primeiro CTA |
| 4 | Keyword aparece em 2 dos 4 locais acima |
| 3 | Keyword aparece em 1 dos 4 locais ou como sinônimo |
| 2 | Keyword não aparece, mas oferta geral é relacionada |
| 1 | Keyword não aparece e oferta não é clara/relacionada |

**Qualquer coisa ≤ 3 → ação imediata**

### Intent Alignment

Classifica a intenção da keyword:

| Tipo de intenção | Landing page ideal |
|---|---|
| **Navegacional** (marca) | Homepage está ok |
| **Informacional** ("como", "o que é", "tipos de") | Página de blog / conteúdo |
| **Comercial** ("melhor", "top", "comparação") | Página de comparação / avaliação |
| **Transacional** ("comprar", "contratar", "preço", "criar X") | LP dedicada com CTA direto |

**Se a keyword é transacional mas cai numa homepage institucional → desalinhamento fatal.**

### Audience Match

Se o cliente atende múltiplos públicos (B2B e B2C, SaaS e agência, etc), cada público precisa de LP própria. **Mensagem unificada numa só LP confunde todo mundo.**

**Exemplo do case Tendency Web:**
- Homepage misturava "edite tudo sem programar" (mensagem SaaS) com "implementação assistida, entrega em 15 dias" (mensagem agência) → ambos públicos ficavam confusos
- Solução: criar 2 LPs dedicadas com copy e CTA distintos

## Passo 4 — Diagnóstico por URL

Template de análise por URL auditada:

```markdown
## URL: {url_completa}

**Keywords que chegam aqui:**
- "criar landing page" (cliques: 340, conv: 3, CPL: R$ 98)
- "página de vendas" (cliques: 210, conv: 1, CPL: R$ 180)

### Análise

**Title da aba**: "Tendency Web — Criador de Sites de Alta Performance"
**H1**: "Crie sites profissionais sem programar"
**CTA principal**: "Comece agora"
**Prova social**: Sem depoimentos visíveis above the fold

### Red flags identificadas

1. 🔴 **Múltiplos ad groups mesma URL** — Groups 1, 2, 3 apontam aqui
2. 🟡 **H1 não contém "landing page"** nem "página de vendas" — Quality Score impactado
3. 🔴 **Mensagem dupla** SaaS vs Agência — confunde ambos públicos
4. 🟡 **CTA "Comece agora"** muito genérico — sem promessa específica
5. 🟢 **Velocidade de carregamento** OK
6. 🟢 **Mobile responsive** OK

### Recomendações

**Curto prazo (esta semana):**
1. Criar LP dedicada `/criar-landing-page` com:
   - Title: "Criador de Landing Page | Tendency Web"
   - H1: "Crie Sua Landing Page em Minutos, Sem Programar"
   - Subtítulo: "Editor drag & drop com templates validados pra conversão"
   - CTA: "Comece grátis, pague ao publicar"
   - Prova social: "500+ páginas criadas" + 3 depoimentos
2. Trocar final URL do Ad Group "Criar LP" para nova URL
3. Aguardar 14 dias, medir QS

**Médio prazo (este mês):**
1. Criar LP dedicada `/criar-pagina-de-vendas` (público SaaS)
2. Criar LP dedicada `/agencia-de-landing-pages` (público agência)
3. Separar ad groups atuais entre públicos → 2 campanhas dedicadas

**Impacto estimado:**
- QS subir de 4 → 7 = CPC cai ~30%
- Relevância + CTA específico = conversão sobe ~40%
- Economia mensal estimada: R$ {valor}
```

## Passo 5 — Gerar cópia de LP sugerida (opcional)

Se o gestor pedir, Claude pode gerar copy completo pra nova LP em rascunho:

```markdown
# [Rascunho] Copy da LP: /criar-landing-page

## Above the fold
**H1**: Crie Sua Landing Page em Minutos, Sem Programar
**Subtítulo**: Editor drag & drop com templates validados para tráfego pago. Você monta, publica e escala — sem precisar de agência ou código.

**CTA**: Comece grátis, pague ao publicar
**Prova social (faixa)**: ⭐ 4.9/5 · 500+ páginas criadas · Suporte em português

## Benefícios (3 colunas)
1. **Rápido**: Primeira página no ar em 15 minutos
2. **Otimizado**: Templates feitos pra converter tráfego pago
3. **Suporte real**: Atendimento 100% em português, sem bot

## Seção social proof
[3 depoimentos com foto e nome]

## FAQ
...

## CTA final
**H2**: Pronto pra escalar suas campanhas?
**CTA**: Criar minha primeira página
```

> ⚠️ Todo copy gerado é **rascunho** — gestor revisa, ajusta com contexto do cliente, e só depois publica.

## Passo 6 — Validar pós-implementação

Depois de aprovar e publicar:

1. Aguardar 14 dias (Google Ads Success Loop)
2. Re-rodar query de QS e Landing Page Experience
3. Comparar:
   - QS antes vs depois
   - CPC antes vs depois
   - Conversão antes vs depois
4. Registrar no `07-outputs/audits/{data}-lp-audit-resultado.md`

## Padrões aprendidos (atualizar conforme usa)

- **Vertical Educação**: LPs de cursos funcionam melhor com depoimentos em vídeo + lista de conteúdo do curso above the fold
- **Vertical Saúde**: Precisa disclaimer CFM + fotos de consultório real (evitar stock)
- **Vertical E-commerce**: Shopping ads → página de produto específica, NUNCA categoria ou home
- **Vertical B2B**: LP com case de cliente + logo de empresas atendidas above the fold
- _(adicionar conforme for encontrando novos padrões)_
