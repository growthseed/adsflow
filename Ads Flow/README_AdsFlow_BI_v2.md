# Dashboard Ads Flow v2 — Manual de Uso

**Otimização do Dashboard Padrão CRM Kommo + Meta Ads + Google Ads**
Versão 2 (Maio/2026) — preparada para multi-cliente, com métricas financeiras e forecast.

---

## 1. O que mudou da v1 para a v2

### Limpeza estrutural
- Removidas as 2 páginas duplicadas (Comparativo e Ofensores apareciam 2× cada).
- Total de páginas: **10** (era 12).
- LocalDateTables auto-geradas marcadas como ocultas (recomendado desativar em Opções → Time Intelligence → desmarcar "Auto Date/Time").

### +31 novas medidas DAX

**Tabela `_MedidasGoogle_Meta` — Financeiras (18 medidas):**
CPL_Real_LM, CPL_Real_LY, CPL_Var%_LM, CPL_Var%_LY,
ROAS_por_Lead, ROAS_por_Venda, ROAS_por_Venda_LM, ROAS_Var%_LM,
CAC, CAC_LM, CAC_Var%_LM,
ROI, ROI_LM,
LTV_Estimado, LTV_CAC_Ratio,
Margem_Bruta_%, Margem_Bruta_Valor, Payback_CAC_Meses

**Tabela `_medidas` — Forecast e análise avançada (13 medidas):**
Sales_Velocity, Pipeline_Coverage,
Dias_Decorridos_Mes, Dias_Mes_Total,
Forecast_Vendas_Mes, Forecast_Leads_Mes,
Atingimento_Meta_%, Atingimento_Forecast_%,
Sinalizador_Meta (com emojis 🟢🟡🟠🔴),
Vazamento_Lead_Oportunidade, Vazamento_Oportunidade_Venda,
Pct_Acumulado_Valor (Pareto), Meses_Desde_Criacao_Lead (Coorte)

### Nova tabela `Metas` (editável)
Tabela com 12 meses de meta de exemplo (Vendas R$, Leads, Investimento R$). Você edita direto no Power BI Desktop em **Transformar dados → Metas → fonte**.

---

## 2. Como abrir o template (primeira vez)

1. Abra **Power BI Desktop** (versão 2.124 ou mais recente).
2. Duplo-clique em `Dashboard_AdsFlow_v2_OTIMIZADO.pbit`.
3. Vai abrir uma janela pedindo 3 parâmetros:
   - **Project Id** → ID do projeto na sua plataforma reportei.com.br
   - **Token** → token da API V4 (gere em reportei.com.br > Integrações > API)
   - **Unit Id** → ID da unidade/empresa
4. Clique em **Carregar**. O Power BI vai puxar os dados do Kommo CRM, Meta Ads e Google Ads.

---

## 3. Como usar com MÚLTIPLOS CLIENTES

O template foi feito pra isso. Pra cada cliente novo:

**Caminho A (mais simples):**
1. Abra o `.pbit` (cria uma nova cópia do arquivo).
2. Preencha Token + Unit Id + Project Id daquele cliente.
3. Salve como `Dashboard_AdsFlow_NomeDoCliente.pbix`.

**Caminho B (template versionado):**
1. Mantenha sempre o `.pbit` como master.
2. Cada cliente vira um `.pbix` separado salvo numa pasta `/Clientes/`.
3. Quando precisar atualizar o template (nova medida, novo visual), edita o `.pbit` e re-aplica.

---

## 4. Como EDITAR as metas (mensal e por cliente)

1. Abra o arquivo no Power BI Desktop.
2. Menu superior → **Transformar dados** (Power Query).
3. No painel esquerdo, clique na tabela **Metas**.
4. No painel direito (Etapas Aplicadas), clique na engrenagem ⚙️ da etapa **Source**.
5. Edite os valores diretamente:
   ```
   {#date(2026, 1, 1), "Cliente Padrão", 100000, 500, 30000}
   ```
   - 1º campo: data do mês (sempre dia 1)
   - 2º campo: nome do cliente (use o mesmo nome em todos os meses do cliente)
   - 3º campo: meta de vendas R$
   - 4º campo: meta de leads (número)
   - 5º campo: meta de investimento R$
6. Clique em **Fechar e Aplicar**.

---

## 5. Medidas-chave para usar nos visuais

| Pergunta de negócio | Medida pra usar |
|---|---|
| Quanto investi em ads? | `Investimento_Total` (Meta + Google) |
| Custo real por lead? | `CPL_Total` |
| Estou ganhando dinheiro? | `ROAS_por_Venda` (>1 = lucro) |
| Quanto custa um cliente? | `CAC` |
| Vale a pena cada cliente? | `LTV_CAC_Ratio` (>3 = saudável) |
| Em quantos meses recupero o CAC? | `Payback_CAC_Meses` |
| Vou bater a meta esse mês? | `Atingimento_Forecast_%` |
| Onde o funil vaza? | `Vazamento_Lead_Oportunidade`, `Vazamento_Oportunidade_Venda` |
| Velocidade do funil? | `Sales_Velocity` (R$/dia) |
| Sinal de saúde? | `Sinalizador_Meta` (🟢🟡🟠🔴) |

---

## 6. Premissas que VOCÊ deve revisar

Algumas medidas têm valores padrão que você precisa ajustar pro seu negócio:

| Medida | Padrão | Onde editar |
|---|---|---|
| `Margem_Bruta_%` | 30% | Editar fórmula DAX (Modelo → Medida) |
| `LTV_Estimado` | Ticket × 1 compra × 12 meses | Ajustar fórmula DAX |
| Meta de vendas/leads/invest. | R$ 100k / 500 / R$ 30k | Tabela Metas (Power Query) |

---

## 7. Páginas do dashboard

1. **Menu** — navegação principal
2. **● Visão Geral** — KPIs consolidados
3. **● Meta Ads** — performance Meta
4. **● Google Ads** — performance Google
5. **Criativos** — análise por criativo Meta
6. **Comparativo** — comparação entre períodos
7. **Ofensores** — top piores performances (atenção)
8. **● Funil** — funil de vendas Kommo
9. **● Tempo** — análise temporal
10. **● Perdas** — motivos de perda

---

## 8. Sugestões de novos visuais (próximos passos manuais — 15-20 min)

Para deixar o dashboard ainda mais avançado, você pode adicionar:

**Na página "● Visão Geral":**
- Cartão grande com `ROAS_por_Venda` ao lado do CPL atual
- Cartão `Atingimento_Forecast_%` com cor condicional via `Sinalizador_Meta`
- Gráfico Combo: Investimento (barras) × ROAS (linha)

**Nova página sugerida "Executivo" (criar manualmente):**
- 4 KPIs grandes: Vendas | Meta | Forecast | ROI
- Velocímetro com Atingimento_Meta_%
- Tabela: Top 10 clientes por valor (curva Pareto usando `Pct_Acumulado_Valor`)
- Cartão Sinalizador (texto grande com emoji)

**Nova página sugerida "Coorte":**
- Matriz: Mês criação lead (linhas) × Meses desde criação (colunas) × % Conversão (valor)
- Usar `Meses_Desde_Criacao_Lead` como eixo X

---

## 9. Solução de problemas

**Erro ao carregar:** verifique se Token está válido em reportei.com.br.
**Medidas vazias:** algumas medidas dependem de campos do Kommo (ex: `win`, `amount_total`). Confirme que esses campos estão preenchidos nos deals.
**ROAS muito alto/baixo:** verifique se o campo `amount_total` no Kommo é a receita REAL (não orçamento) e se o `Investimento_Total` está somando ambas as plataformas.

---

**Gerado por Cowork em 26/05/2026 — Backend BI completo, frontend visual com instruções pra finalizar manualmente. Dúvidas? Chame de novo aqui.**
