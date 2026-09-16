# Report executivo: referencia e implementacao

## Referencias analisadas

- `Ads Flow/Dashboard_AdsFlow_v2_OTIMIZADO.pbit`: paginas Menu, Visao Geral,
  Meta Ads, Google Ads, Criativos, Comparativo, Ofensores, Funil, Tempo e Perdas.
- `Downloads/Power Bi Modelo/Report/Layout`: estrutura de KPIs, funil,
  serie temporal, barras por status e matriz por responsavel.
- Aproveitamento de hierarquia, alinhamento, densidade e graficos. Sem copiar
  a marca V4 ou importar endpoints, credenciais, metas ou dados demonstrativos.

## Entregue nesta etapa

- Report por cliente em `/c/:clientSlug/report`.
- Operacao: filtros combinados, rosca por status, carga por responsavel,
  agenda semanal, busca, tabela paginada, links ClickUp e exportacao CSV.
- Fotos reais quando disponiveis; iniciais quando ausentes ou com erro.
- Midia: canal, investimento, conversoes, CPA ponderado, CTR ponderado,
  serie diaria, distribuicao por canal e resultados por campanha.
- Periodo e captura das fontes visiveis; ausencia de dados nao vira resultado.
- Layout responsivo, tabela com rolagem propria e controles acessiveis.
- Catalogo de clientes ativos para administradores, preservando o escopo de
  membros comuns. Sincronizacao manual exige administrador ativo no servidor.

## Limites e proximas etapas

- Agenda semanal usa prazos de demandas abertas. Nao e burndown nem velocidade
  SCRUM: estes exigem historico de conclusoes e definicao formal dos sprints.
- Midia mostra o periodo da captura; nao oferece filtros historicos sem dados.
- Conversoes de plataformas podem se sobrepor; nao sao leads unicos.
- Receita, CAC, LTV, ROAS validado, forecast e funil comercial dependem de
  fontes e regras de atribuicao reais. Nao foram preenchidos com exemplos.
- Galeria de criativos e comparativo historico ainda nao foram implementados
  nesta nova view. O PDF permanece no editor existente, separado do dashboard.
- O portal publico e o planner nao foram redesenhados nesta etapa.

## Regressao

`node --test scripts/test-report.mjs` verifica filtros, datas, agregacao de
midia, catalogo de clientes e autorizacao do endpoint manual sem APIs reais.
