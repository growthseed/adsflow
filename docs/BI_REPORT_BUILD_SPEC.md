# BI / Report — Spec de construção (V2 + Blueprint Power BI)

> Consolidado em 2026-08-17 a partir de duas fontes: os mockups em `V2 - Novas Implementações/` (dentro do repo Ad Flow) e `BLUEPRINT_REPORTO.md` (em `Downloads/Nova pasta (3)/`, engenharia reversa de 2 templates Power BI "Mídia Hub / MKT Lab"). Isso não é design novo — é o que já existia, organizado numa spec só, pra virar backlog de construção.

## 1. Direção de IA confirmada

Entre as 3 taxonomias de navegação incompatíveis que existiam nos 4 arquivos `hifi-leva*.html`, ficou definido: **leva1 + leva2** — shell de agência enxuto + drill-down por cliente. Isso já foi implementado no código (`Sidebar.tsx`, `ClientContextGuard.tsx`, `AgencyRoute`). `leva3`/`leva4` (taxonomia "Carteira + Ferramentas" tudo num nível só) fica descartada.

O token visual (cor, tipografia, espaçamento, sombra) documentado em `handoff-pack.html` **é** consistente entre os 4 arquivos — isso pode ser usado como base de design system sem reconciliação.

## 2. O que falta construir — cruzando com o blueprint do Power BI

O blueprint documenta 2 dashboards de referência ("A" = Kommo+Meta, "B" = +Google Ads):

| Métrica | A | B |
|---|---|---|
| Tabelas de fato/dimensão | 25 | 34 |
| Medidas DAX | 136 | 165 |
| Relacionamentos | 14 | 17 |
| Páginas | 8 | 12 |
| Visuais | 227 | 397 |

Cruzando as páginas do blueprint com o que existe nos mockups V2 (`hifi-leva1-4`, `wireframes.jsx`) e no Ad Flow atual, **isto não tem nenhuma tela correspondente ainda**:

- **Funil** — funil de vendas Kommo (etapas, pipeline × vendedor, stage-stacked bars).
- **Perdas** — análise de perda por etapa/pipeline/motivo.
- **Tempo** — cohort real de tempo de fechamento por vendedor (o "cohort" que existe em leva2 é parecido visualmente mas modela retenção de aluno, não fechamento de deal — não serve de base direta).
- **Ofensores** — waterfall de variação por campanha. Segundo o blueprint, é o visual mais sofisticado do modelo antigo. Zero cobertura hoje.
- **Correlação CPL × CTR** (scatter) dentro de Criativos — hoje o Creative Library do V2 só tem grid de card + número de CTR solto, sem correlação.
- **Espelho Google Ads** — página dedicada, hoje ausente.
- **Comparador período A vs. período B lado a lado** — V2 favorece período único + delta; o blueprint usa `dim_data_comparativo` com `USERELATIONSHIP` pra comparação de verdade.

**Net-new no V2 sem equivalente no blueprint** (ou seja, não é regressão, é evolução): AI assistant/chat, LTV:CAC, Budget Pacing com auto-pause, Metas & Alertas (rules engine), Health Score por cliente, Portal compartilhável via WhatsApp.

## 3. Categorias de medida a portar (do blueprint)

O blueprint organiza as medidas em pastas DAX — isto é o checklist de métrica, não de visual:

- **`_medidas` (91, Kommo)** — funil, forecast, cohort, Pareto. Inclui `Sales_Velocity`, `Pipeline_Coverage`, `Forecast_Vendas_Mes`, `Atingimento_Meta_%`, `Vazamento_Lead_Oportunidade`, `Pct_Acumulado_Valor` (curva Pareto), `Meses_Desde_Criacao_Lead` (base do cohort).
- **`_Medidas_Meta` (44, Meta Ads)** — performance de campanha/conjunto/anúncio.
- **Financeiras (18, tabela `_MedidasGoogle_Meta`)** — `CPL_Real_LM/LY`, `ROAS_por_Lead`, `ROAS_por_Venda`, `CAC`, `ROI`, `LTV_Estimado`, `LTV_CAC_Ratio`, `Margem_Bruta_%`, `Payback_CAC_Meses`.
- **Calc group de comparativo** — overlay período vs. período reutilizável em qualquer medida, via `USERELATIONSHIP`.

## 4. Atenção: multi-CRM

Confirmado pelo Jow em 2026-08-17: nem todo cliente do Ad Flow usa Kommo, e existe intenção de construir um CRM próprio da Efeito no futuro. **Qualquer página nova de Funil/Perdas/Tempo listada acima deve ser modelada contra uma interface genérica de CRM** (deal/stage/pipeline/won-lost), não contra campos literais do Kommo (`amount_total`, `win`, `deal_stage_id` etc. como aparecem no blueprint são só a *referência* de shape, não o contrato final). Ver memória `project_ad_flow_multi_crm`.

## 5. Ordem sugerida de construção

1. Funil + Perdas (maior gap de conteúdo, dado CRM genérico já é pré-requisito de qualquer forma).
2. Ofensores (waterfall) — maior valor analítico por esforço, segundo o próprio blueprint.
3. Tempo (cohort de fechamento) — depende do modelo de CRM genérico estar resolvido primeiro.
4. Espelho Google Ads + comparador A/B período.
5. Scatter CPL×CTR dentro de Criativos.

Isto ainda não tem estimativa de esforço nem componentes React especificados — é o backlog de conteúdo, não o plano de sprint.
