---
name: efeito-ads-playbook
description: "Playbook proprietário da Efeito Digital para Google Ads e Meta Ads — auditoria, diagnóstico, estratégia, expansão e otimização. Use sempre que estiver trabalhando numa conta de tráfego pago de cliente Efeito Digital (pasta em ~/Clients/), analisando performance, planejando campanhas, ou gerando relatórios. Contém checklists de auditoria, heurísticas por vertical (educação, saúde, e-commerce, serviços), padrões de nomenclatura, templates de relatório e lições aprendidas de campanhas reais. Topics: Google Ads audit, Meta Ads audit, quality score, search impression share, negative keywords, bid strategies, PMAX, Advantage+, creative testing, CPL optimization, ROAS optimization, vertical playbooks."
---

# Efeito Digital — Ads Playbook

Playbook proprietário da Efeito Digital para gestão de tráfego pago (Google Ads + Meta Ads). Este skill consolida as melhores práticas internas da agência, lições de campanhas passadas, e heurísticas específicas por vertical.

**Quando aplicar**: Qualquer sessão Claude Code trabalhando em pasta `~/Clients/{cliente}/` ou lidando com análise estratégica de contas de ads.

**Autor**: Efeito Digital (growthseed / jw@efeito.digital)
**MCC Google Ads**: 101-181-7676
**Business Meta**: 2299334230139738

## Estrutura deste skill

```
efeito-ads-playbook/
├── SKILL.md                              (este arquivo — índice)
├── philosophy.md                         ⭐ LEIA PRIMEIRO — diagnostic partner, não auto-executor
├── best-practices/
│   ├── search-campaigns.md               [TODO]
│   ├── pmax-campaigns.md                 [TODO]
│   ├── bidding-strategies.md             [TODO]
│   ├── quality-score.md                  [TODO]
│   └── meta-advantage-plus.md            [TODO]
├── checklists/                           (roteiros passo-a-passo)
│   ├── google-ads-audit.md               ✅ Auditoria genérica 30d
│   ├── keyword-ngram-audit.md            ✅ N-gram + SWOT (Aaron Young)
│   ├── landing-page-deep-audit.md        ✅ LP audit com scraping (Tendency Web)
│   ├── campaigns-ready-to-scale.md       ✅ Vertical scaling (Aaron Young)
│   ├── ad-copywriter.md                  ✅ RSA + Meta copy + pesquisa de dor
│   ├── meta-ads-audit.md                 [TODO]
│   ├── onboarding-novo-cliente.md        [TODO]
│   └── weekly-roundup.md                 [TODO]
├── verticals/                            (heurísticas específicas por setor)
│   ├── educacao.md                       [TODO — Escola PA precisa]
│   ├── saude.md                          [TODO]
│   ├── ecommerce.md                      [TODO]
│   ├── servicos.md                       [TODO]
│   └── b2b.md                            [TODO]
└── winning-campaigns/                    (cases internos — estruturas que funcionaram)
    └── _template.md                      [TODO]
```

## ⭐ Ordem de leitura recomendada

1. [philosophy.md](philosophy.md) — princípio de "diagnostic partner" e STAB method
2. [checklists/keyword-ngram-audit.md](checklists/keyword-ngram-audit.md) — ferramenta centerpiece
3. [checklists/landing-page-deep-audit.md](checklists/landing-page-deep-audit.md) — auditoria de LP
4. [checklists/campaigns-ready-to-scale.md](checklists/campaigns-ready-to-scale.md) — scaling inteligente
5. [checklists/ad-copywriter.md](checklists/ad-copywriter.md) — geração de copy em rascunho
6. [checklists/google-ads-audit.md](checklists/google-ads-audit.md) — auditoria genérica

## Fontes externas integradas

Este playbook consolida técnicas adaptadas de:
- **Defined Digital Academy (Aaron Young)** — STAB method, Google Ads Success Loop, N-gram audit, vertical scaling matrix, diagnostic-not-executor philosophy
- **Tendency Web (workflow brasileiro)** — auditoria de LP com scraping real, separação de públicos (SaaS vs agência), geração de anúncios em rascunho via MCP
- **Anti-gravity / Directive Orchestration** — SKAG logic, agente como orquestrador (não executor), memória de workspace como diretivas
- **Experiência Efeito Digital** — princípios não-negociáveis, nomenclatura interna, padrões por vertical

## Princípios não-negociáveis da Efeito Digital

Essas regras valem pra qualquer conta, vertical ou orçamento. Se for quebrar alguma, documenta o motivo no CLAUDE.md do cliente.

1. **Nunca rodar Search Campaign sem Negative Keyword List compartilhada do vertical.** Cada cliente herda a negative list da sua vertical + a da conta. Poupa budget nos primeiros 30 dias de aprendizado.

2. **Quality Score abaixo de 5 em keyword com gasto > R$ 100/mês = auditoria imediata.** Não aceita — ou melhora (copy, LP, match), ou pausa. Nunca deixa sangrar.

3. **Budget Lost Impression Share > 20% = sinal de subscaling.** Campanha tá limitada por budget, não por performance. Se o ROAS tá bom, pede autorização pra escalar budget, não ajusta bid.

4. **Rank Lost Impression Share > 30% em Search = problema de bid ou ad rank.** Subir bid ou melhorar QS, nunca as duas coisas ao mesmo tempo (não saberá o que funcionou).

5. **Nunca mistura Search + Display na mesma campanha.** Separação obrigatória pra legibilidade de métrica e alocação correta.

6. **PMAX sempre com Asset Group separado por público-alvo/oferta.** Nunca um Asset Group genérico "tudo misturado".

7. **Meta Advantage+ Audiences: sempre começar com testing de `Advantage+ Audiences on` vs `detailed targeting manual`. Nunca assumir que um é melhor que o outro sem teste A/B real do cliente.**

8. **Todo cliente novo: primeiro mês é aprendizado, segundo mês é otimização, terceiro mês é escala.** Nunca prometer ROAS no primeiro mês.

9. **Relatórios sempre com WoW (Week over Week) e MoM (Month over Month), nunca apenas números absolutos.** Contexto > número.

10. **Nunca criar campanha sem ter definido a conversão de sucesso no GA4/GTM primeiro.** Tracking first, ads depois.

## Como usar em sessões práticas

### Auditoria de conta existente
1. `cd ~/Clients/{cliente}/`
2. Peça: "roda auditoria Google Ads últimos 30 dias"
3. Claude carrega [checklists/google-ads-audit.md](checklists/google-ads-audit.md) + vertical relevante
4. Usa MCP `mcp__google-ads__*` pra puxar dados
5. Gera relatório em `07-outputs/audits/{data}-audit-gads.md`

### Onboarding novo cliente
1. `cp -r ~/Clients/_template ~/Clients/novo-cliente`
2. Peça: "onboarding novo cliente"
3. Claude carrega [checklists/onboarding-novo-cliente.md](checklists/onboarding-novo-cliente.md)
4. Guia você pelos passos: briefing → tracking → keyword research → estrutura → criativos → lançamento

### Análise estratégica
1. `cd ~/Clients/{cliente}/`
2. Peça: "me dá as 3 maiores oportunidades de crescimento aqui"
3. Claude cruza dados (Google Ads + Meta + Kommo + GA4) e aplica heurísticas do playbook + vertical

## Referências externas usadas

- Google Ads API v19 docs: https://developers.google.com/google-ads/api
- Meta Marketing API v23 docs: https://developers.facebook.com/docs/marketing-api
- GAQL reference: https://developers.google.com/google-ads/api/docs/query/overview
- Casos do Reportei (benchmark visual): app.reportei.com

## Atualização deste skill

Este playbook é **vivo**. Toda vez que você (Efeito Digital) aprender algo novo em uma conta, documenta:

- **Best practice geral** → adiciona em `best-practices/`
- **Específico de vertical** → adiciona em `verticals/{vertical}.md`
- **Caso de sucesso** → copia `winning-campaigns/_template.md` e preenche
- **Algo que não funcionou** → documenta também! Anti-patterns são ouro

Commit no git pra versionar (opcional, mas recomendado).
