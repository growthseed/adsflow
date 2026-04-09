# Checklist — Ad Copywriter (RSA + Meta)

> Combinação do **Ad Copywriter** da Defined Digital Academy + workflow do **Tendency Web** de gerar anúncios em rascunho via API. Claude gera, gestor aprova, MCP publica.

## Princípio

**Copy que converte não vem do LLM — vem da pesquisa.** Antes de gerar headlines, Claude precisa de:
1. Keywords-alvo do ad group (do CLAUDE.md ou do último keyword audit)
2. Oferta/produto (do `01-contexto/offering.md`)
3. Público-alvo (do `01-contexto/personas.md`)
4. Tom de voz (do CLAUDE.md do cliente)
5. Pain points reais (do site, de reviews, de Reddit/Facebook, de transcripts de venda)

**Se faltar qualquer um desses**, Claude pergunta antes de gerar. Não "inventa" copy do nada.

## Pesquisa prévia obrigatória

### 1. Customer pain points
Fontes em ordem de prioridade:
1. **Transcripts de vendas do cliente** → `03-emails-reunioes/transcripts/`
2. **Reviews do próprio cliente** (Google, Facebook, Trustpilot)
3. **Reviews dos concorrentes** (mesma fonte) — o que os clientes reclamam do concorrente é sua oportunidade
4. **Reddit** (subreddits do nicho) — via Firecrawl MCP ou WebFetch
5. **Facebook Groups** do nicho — usar agent-browser
6. **YouTube comments** em vídeos do tema — captura dores não filtradas

Saída esperada: lista de 10-15 **dores reais em primeira pessoa** ("não consigo X", "odeio quando Y", "queria que Z").

### 2. Promessas que funcionam (competitor copy)
Via Meta Ad Library + Google Ads Transparency:
- Capturar 10-20 anúncios de concorrentes ativos
- Anotar hooks, CTAs, formatos que mais aparecem
- Identificar **gaps** (promessas que ninguém tá fazendo) → vantagem competitiva

### 3. Value propositions próprias
Do `01-contexto/offering.md`:
- O que o cliente vende (objetivo)
- Pra quem (público)
- Qual a transformação prometida
- Qual a prova (dados, cases, garantias)

## Gerando Responsive Search Ads (RSA)

RSA permite 15 headlines + 4 descriptions. Claude gera variedade por categoria:

### Headlines — distribuição recomendada (15 total)

| Categoria | Quantidade | Propósito |
|---|---|---|
| **Keyword match** (inclui a keyword principal) | 3 | Relevância + QS |
| **Benefício principal** | 3 | "Crie em Minutos", "Sem Programar" |
| **Prova social** | 2 | "+500 Clientes", "⭐ 4.9/5" |
| **Diferencial** | 2 | "Templates Validados", "Suporte 100% BR" |
| **Urgência/escassez** | 1 | "Oferta Limitada", "Últimas Vagas" (se autêntico!) |
| **CTA direto** | 2 | "Comece Grátis", "Peça Orçamento" |
| **Brand** | 2 | Nome do cliente (pinned, opcional) |

### Descriptions — 4 total

| # | Foco | Exemplo |
|---|---|---|
| 1 | Benefício + CTA | "Editor drag-and-drop com templates validados. Comece grátis e pague só ao publicar." |
| 2 | Diferencial + prova | "Mais de 500 páginas criadas. Suporte 100% em português e sem bots." |
| 3 | Objection handling | "Sem cartão de crédito. Cancele quando quiser. 30 dias de garantia." |
| 4 | Urgência ou futuro | "Comece hoje e tenha sua primeira página no ar em 15 minutos." |

### Regras (não negociáveis)

1. **Nunca usar CAPS LOCK** completo (Google rejeita)
2. **Headline ≤ 30 caracteres**, description ≤ 90 caracteres (limite oficial)
3. **Evitar pontuação duplicada** (!!, ??)
4. **Proibido**: superlativos não comprovados ("o melhor", "o número 1") sem prova
5. **Pinning** só quando necessário (compliance, brand) — limita otimização do Google
6. **Keyword no H1 / headline 1** pra QS máximo
7. **Testar 2 RSAs por ad group** (A/B built-in)

## Gerando Meta Ads (copy para Facebook/Instagram)

Estrutura diferente — Meta é feed-first, atenção escassa:

### Hook (primeiras 3-5 palavras)
- Pergunta que faz parar de rolar
- Número específico
- Frase contraintuitiva
- Mention direto do público

Exemplos:
- "Dona de pet shop?"
- "87% das landing pages falham em 1 coisa."
- "Esqueça curso gratuito"
- "Pra advogado que atende família"

### Body (2-4 parágrafos curtos)
- Agita a dor ou o desejo
- Apresenta a solução (seu produto)
- Prova (números, depoimento, case)
- Oferta + CTA

### CTA
- **Lead gen**: "Clique pra receber", "Fale com consultor"
- **Ecommerce**: "Compre agora", "Veja no site"
- **Awareness**: "Saiba mais"

### Criativo
- Meta ainda é visual-first — Claude **não gera imagens**, só sugere direcionamento (tipo, composição, texto overlay)
- Exemplo de direcionamento: "Foto em ambiente real, pessoa segurando o produto, texto overlay em canto: 'Resultado em 30 dias'"

## Workflow prático — gerando via MCP Google Ads

Quando o MCP estiver conectado, o gestor pode pedir:

> "Otimize os RSA da campanha X e deixe em rascunho"

Claude vai:
1. Ler a campanha via GAQL (ad groups, keywords, ads existentes, performance)
2. Identificar gaps (headlines fracas, descriptions duplicadas, ad strength POOR/AVERAGE)
3. Gerar nova versão baseada nas regras acima
4. **Pedir aprovação antes de publicar** (princípio do `philosophy.md`)
5. Ao publicar, criar como rascunho (ad em status `PAUSED`)
6. Gestor ativa manualmente quando validar

Exemplo de output em rascunho:

```markdown
# [RASCUNHO — NÃO PUBLICADO] RSA Sugerido — Ad Group: Criar Landing Page

## Headlines (15)
1. Criar Landing Page Profissional
2. Landing Page em 15 Minutos
3. Criador de Landing Pages
4. Sem Programar, Sem Agência
5. Templates Validados p/ Conversão
6. Editor Drag & Drop Simples
7. ⭐ 4.9/5 — 500+ Páginas Criadas
8. Suporte 100% em Português
9. Garantia 30 Dias
10. Comece Grátis
11. Pague Só ao Publicar
12. Crie Sua Página Agora
13. Teste Sem Cartão
14. {Brand} — Criador Pro
15. Seu Site no Ar Hoje

## Descriptions (4)
1. "Editor drag-and-drop com templates validados pra tráfego pago. Comece grátis."
2. "Mais de 500 páginas criadas. Suporte em português e sem bots. Garantia 30 dias."
3. "Sem cartão de crédito. Publique quando quiser. Cancele a qualquer momento."
4. "Crie hoje e tenha sua primeira página no ar em 15 minutos. Comece agora."

## Sitelinks sugeridos
- Templates Prontos → /templates
- Preços → /precos
- Ver Exemplos → /cases
- Suporte → /ajuda

## Callouts
- "Sem programação"
- "Templates validados"
- "Suporte 24/7"
- "Garantia 30 dias"

## Estrutura de pinning
- Headline 1 (Criar Landing Page Profissional) → pinned position 1 (keyword relevance)
- Sem outros pinnings (deixar Google otimizar)

## Ad Strength esperado
🟢 Excellent (15/15 headlines, 4/4 descriptions, extensões completas)

## Pre-flight checks
- [x] Limites de caracteres OK
- [x] Keyword principal no headline 1
- [x] Prova social presente
- [x] CTA claro
- [x] Sem CAPS LOCK
- [x] Sem superlativos não comprovados

## ⏸️ Status: RASCUNHO — aguardando aprovação do gestor
```

## Depois que publicado

Monitorar por 14 dias:
- Ad Strength subiu pra GREAT/EXCELLENT?
- CTR subiu?
- Quality Score da keyword subiu?
- Conversões mantiveram ou cresceram?

Registrar resultado em `07-outputs/audits/{data}-ad-copy-resultado.md` e, se ganhou performance significativa, adicionar em `winning-campaigns/` como template pra outros clientes do mesmo vertical.
