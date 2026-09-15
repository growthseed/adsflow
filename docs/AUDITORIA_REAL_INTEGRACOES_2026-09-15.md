# Auditoria real do AdsFlow — 15/09/2026

## Resultado executivo

O Google Ads está acessível pela MCC `101-181-7676` e respondeu a consultas reais de campanhas. O ClickUp também está acessível e foi reconciliado com a Space `Operação Efeito`. A Meta continua parcialmente bloqueada por custódia de token: 12 contas ativas não possuem `access_token` salvo em `client_integrations`.

## ClickUp

- Space verificada: `Operação Efeito` (`90113696605`).
- Folders encontrados: 9.
- `CL00 - Efeito Digital` foi mantido como estrutura interna da agência e não virou cliente.
- 8 folders de clientes foram importados/reconciliados no painel.
- Cada cliente recebeu o folder real, o ID da Space, as listas reais e o horário da última verificação em `client_integrations`.
- A lista real varia por cliente; o sistema não deve mais assumir apenas as cinco listas padrão do onboarding.

Clientes importados do ClickUp nesta auditoria: Dale Carnegie, Legacy Business, Grupo GAP (Simmons & Kasa dos Colchões), Momma, Evolve, Fire Consultoria Imobiliária (Emanuella), SINDMPU e Rharo.

## Google Ads

Consulta executada em 15/09/2026 com `LAST_30_DAYS`, usando o conector Google Ads e a MCC da Efeito.

| Conta | Estrutura recente observada |
|---|---|
| 2302878546 · Escola Pequeno Aprendiz | 1 Search ENABLED; 15 campanhas históricas pausadas/removidas; Maximizar conversões; 21 impressões, 3 cliques, custo R$ 0,16 e 0 conversões no período |
| 7150972245 · Isaac Newton Vila Matilde | 2 Search ENABLED; Maximizar conversões; 6.723 impressões, 611 cliques, custo R$ 978,97 e 51,02 conversões |
| 4965532144 · Isaac Newton Campinas | 1 Search ENABLED; Maximizar conversões; 7.126 impressões, 479 cliques, custo R$ 1.032,97 e 47 conversões |
| 4989960017 · Grupo M3 | 2 Search ENABLED e 1 pausada; custo recente R$ 0,11, 2 cliques e 0 conversões |
| 9268816860 · Ize Gestão | Demand Gen e vídeo pausados com entrega; 10.086 impressões, 384 cliques, custo R$ 536,51 e 1 conversão |
| 4305171303 · Kasa do Colchões | 2 Search ENABLED e 18 estruturas históricas pausadas/removidas; custo R$ 4.937,85, 3.349 cliques e 419 conversões |
| 2294636796 · Estudio Cocada | Sem entrega recente; campanhas removidas/pausadas |

Leitura de gestão: há mistura de Search, Performance Max, Display, Video, Smart e Demand Gen no histórico. A próxima auditoria de otimização deve ser feita por cliente, aplicando Spending, Targeting, Ads/Landing Pages e Bidding, sem alterar campanhas automaticamente.

## Meta Ads

- As outras 12 integrações Meta ativas estão sem token armazenado. O painel pode exibir a conta, mas não consegue sincronizar estrutura ou insights até receber um token por cliente.
- O conector Meta também devolveu sessão invalidada, coerente com a ausência/expiração do token armazenado.
- Próximo passo: cadastrar o token longo ou System User token por cliente em `client_integrations`, via endpoint server-side. Não colocar token em `VITE_*`, no bundle ou em mensagem de chat.

## B.I. e referências

O B.I. ainda não está completo em relação ao blueprint Power BI. A Visão Geral usa `performance-snapshot.json` para mídia, enquanto Funil/Perdas/Tempo/Ofensores dependem de fontes diferentes. O snapshot atual é datado de abril de 2026 e o script de reconstrução consolida apenas Meta, portanto não representa o inventário Google recém-consultado.

Gaps prioritários já confirmados nos materiais: Funil CRM genérico, Perdas, Tempo por fechamento, Ofensores waterfall, Espelho Google Ads, comparador A/B real e scatter CPL x CTR em Criativos. O detalhamento está em [BI_REPORT_BUILD_SPEC.md](BI_REPORT_BUILD_SPEC.md).

## Correções aplicadas nesta auditoria

- Administrador global agora pode criar cliente mesmo sem tenant ativo.
- Cadastro de cliente envia `user_id`, campo obrigatório no banco, e gera slug correto para nomes com acento.
- Onboarding deixou de simular OAuth concluído e passou a criar o cliente pelo serviço real usado no painel.
- Folders reais do ClickUp foram reconciliados com clientes e integrações.
- Nodes sociais passaram a usar bounding box compacta de `112 x 112`, círculos de 64px, gaps menores e fit view com mais área útil.

## Pendências que dependem de dado externo

- Token Meta válido para cada conta que deverá sincronizar.
- A visão geral do B.I. precisa trocar o snapshot estático por uma rotina de sincronização Google + Meta por cliente; as páginas de detalhe já possuem endpoints server-side para essa evolução.

## Descontinuação de cliente

O cliente descontinuado e suas integrações Meta Ads, Google Ads e Monday foram removidos do banco em 15/09/2026. Os objetos legados exclusivos foram incluídos em uma migration de limpeza idempotente; os arquivos históricos de migration permanecem apenas para preservar a rastreabilidade do schema.
