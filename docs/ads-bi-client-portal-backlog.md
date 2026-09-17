# BI de Ads e acompanhamento individual

## Direcao confirmada pelo usuario em 16/09/2026

O produto deve ser um BI de Ads consolidado, inspirado nos prints do Reportei
e no modelo Power BI. Google Ads e Meta Ads sao fontes/filtros, nao relatorios
separados. Cada cliente deve acompanhar seu painel com acesso individual.
Projeto e planner continuam disponiveis, mas separados do BI de Ads.

## P0: antes de liberar acesso externo

- Validar isolamento por cliente nas APIs e RLS, incluindo tentativas de
  consultar o slug/id de outro cliente e revogacao de acesso.
- Remover snapshots globais de clientes do bundle publico. Os adapters
  clickupAdapter e performanceAdapter ainda importam JSON de snapshots da
  agencia; filtrar apenas a tela nao protege esses dados.
- Substituir leitura global por consultas autenticadas limitadas ao cliente.
- Validar convites/login, recuperacao de acesso, perfis de leitura e rotas.
- Separar portal do cliente da operacao interna da Efeito.

## P1: BI de Ads

- Visao consolidada: investimento, resultados, receita atribuida e ROAS quando
  houver valores confiaveis; CPL/CPA, CPC, CPM, CTR, cliques e impressoes.
- Periodos e comparacao anterior com mesma cobertura de dados.
- Evolucao temporal, campanhas, criativos com imagens, metas e alertas.
- Definir conversao por objetivo; nao somar eventos como se fossem leads unicos.
- Mostrar fonte, periodo, ultima captura e indisponibilidade de cada indicador.
- Aplicar as referencias visuais ao dashboard e portal, nao apenas ao report.

## P1: pendencias operacionais relatadas

- Validar Momma, Dale e demais clientes atuais; Grupo M3 e MOAI descontinuados.
- Corrigir cabecalho/cliente ativo e rotas sem mistura com a agencia.
- Revisar dimensoes de todos os nodes circulares, selecao, handles e zoom.
- Validar integracoes Ads, OAuth, renovacao e rotina de sincronizacao.
- Validar layout desktop/mobile e estados vazios/erro em cada modulo.

## P2: expansao

- Sprints reais com historico de concluidas, burndown e capacidade.
- Convites e permissoes por modulo para colaboradores de cada cliente.
- Multiagencia/revenda com isolamento por agencia, onboarding e personalizacao.

## Entrega parcial existente

Report operacional com filtros, graficos, responsaveis, links ClickUp e CSV;
visao inicial de midia agregada; endpoint de catalogo restrito a administradores;
sincronizacao manual autenticada. Isso nao equivale ao BI completo nem a um
portal individual com isolamento de dados ja certificado.
