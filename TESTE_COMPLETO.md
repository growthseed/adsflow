# ✅ CHECKLIST DE TESTES COMPLETO - ADFLOW

**Data:** 24/12/2024
**Versão:** FlowEditorPage v2.0 com Atalhos e Elementos Visuais

---

## 🎯 OBJETIVO DO TESTE

Validar todas as funcionalidades implementadas:
1. ✅ Elementos visuais (círculo, quadrado, textbox, post-it)
2. ✅ Atalhos de teclado (Ctrl+D, Ctrl+C, Ctrl+V, Ctrl+S)
3. ✅ Auto-save com logs detalhados
4. ✅ Indicador visual de salvamento
5. ✅ Persistência no Supabase

---

## 📋 PARTE 1: ELEMENTOS VISUAIS

### ⭕ Teste do Círculo
- [ ] Abrir NodesSidebar
- [ ] Expandir categoria "Elementos Visuais"
- [ ] Arrastar "⭕ Círculo" para o canvas
- [ ] Verificar se círculo azul (#3b82f6) aparece
- [ ] Clicar duas vezes no texto "Círculo"
- [ ] Editar texto para "Fase 1"
- [ ] Verificar se texto foi atualizado
- [ ] Conectar círculo a outro nó (4 handles disponíveis)
- [ ] Selecionar círculo e verificar anel de seleção

**Resultado esperado:** ✅ Círculo azul funcional com texto editável

---

### ⬜ Teste do Quadrado
- [ ] Arrastar "⬜ Quadrado" para o canvas
- [ ] Verificar se quadrado verde (#10b981) aparece
- [ ] Editar texto para "Etapa 2"
- [ ] Conectar a outros elementos
- [ ] Testar seleção e movimentação

**Resultado esperado:** ✅ Quadrado verde funcional com texto editável

---

### 📝 Teste da Caixa de Texto
- [ ] Arrastar "📝 Caixa de Texto" para o canvas
- [ ] Clicar duas vezes para editar
- [ ] Digitar texto longo: "Este é um teste de caixa de texto com várias linhas para verificar o comportamento de quebra automática do componente"
- [ ] Verificar se largura se ajusta (min 200px, max 400px)
- [ ] Conectar a outros nós
- [ ] Mover pelo canvas

**Resultado esperado:** ✅ Textbox responsiva com quebra de linha automática

---

### 📌 Teste do Post-it
- [ ] Arrastar "📌 Post-it" para o canvas
- [ ] Verificar se aparece amarelo com rotação -1deg
- [ ] Verificar ícone 📌 no canto superior direito
- [ ] Editar texto: "Lembrete importante!"
- [ ] Criar 4 post-its com cores diferentes (arrastar múltiplas vezes)
- [ ] Verificar rotação e sombra em cada um

**Resultado esperado:** ✅ Post-its coloridos com efeito realista

---

## ⌨️ PARTE 2: ATALHOS DE TECLADO

### 🔁 Ctrl+D - Duplicar
**Setup:**
1. [ ] Carregar template "🎄 DVD Natal"
2. [ ] Selecionar nó "Meta Ads"
3. [ ] Pressionar Ctrl+D

**Verificações:**
- [ ] Console mostra: `✅ 1 nó(s) duplicado(s)`
- [ ] Nó duplicado aparece +50px x, +50px y
- [ ] Novo nó está selecionado
- [ ] Nó original fica desmarcado
- [ ] ID do novo nó: `meta-ads-copy-[timestamp]`

**Teste múltiplos nós:**
4. [ ] Selecionar 3 criativos (Shift+Click)
5. [ ] Pressionar Ctrl+D
6. [ ] Console mostra: `✅ 3 nó(s) duplicado(s)`
7. [ ] Todos aparecem deslocados +50px

**Resultado esperado:** ✅ Duplicação funcional com logs

---

### 📋 Ctrl+C - Copiar
**Setup:**
1. [ ] Selecionar nó "Campaign DVD"
2. [ ] Pressionar Ctrl+C

**Verificações:**
- [ ] Console mostra: `📋 1 nó(s) copiado(s), X conexão(ões)`
- [ ] Nada muda visualmente (clipboard interno)
- [ ] Nó permanece selecionado

**Teste com conexões:**
3. [ ] Selecionar "Meta Ads" + "Campaign DVD" (Shift+Click)
4. [ ] Pressionar Ctrl+C
5. [ ] Console mostra conexões entre eles copiadas

**Resultado esperado:** ✅ Cópia funcional com preservação de conexões

---

### 📌 Ctrl+V - Colar
**Setup:**
1. [ ] Copiar "Campaign DVD" (Ctrl+C)
2. [ ] Pressionar Ctrl+V

**Verificações:**
- [ ] Console mostra: `✅ 1 nó(s) colado(s), X conexão(ões)`
- [ ] Novo nó aparece +100px x, +100px y
- [ ] Novo nó fica selecionado
- [ ] Original fica desmarcado
- [ ] ID: `campaign-dvd-paste-[timestamp]-[random]`

**Teste múltiplos colar:**
3. [ ] Pressionar Ctrl+V novamente
4. [ ] Terceira cópia aparece +100px da anterior

**Teste com rede complexa:**
5. [ ] Selecionar "Audience" + 3 criativos conectados
6. [ ] Ctrl+C
7. [ ] Ctrl+V
8. [ ] Verificar se todas as 4 conexões internas foram recriadas
9. [ ] Verificar novos IDs nas edges

**Resultado esperado:** ✅ Colagem com recriação de conexões internas

---

### 💾 Ctrl+S - Salvar Manual
**Setup:**
1. [ ] Fazer alteração no canvas (mover nó)
2. [ ] Pressionar Ctrl+S

**Verificações:**
- [ ] Console mostra: `💾 Iniciando salvamento...`
- [ ] Console mostra: `📊 Dados: { nodes: X, edges: Y, flowId: ... }`
- [ ] Console mostra: `✅ Flow atualizado: [ID]` ou `✅ Flow criado: [ID]`
- [ ] Console mostra: `💾 Salvamento concluído às [HH:MM:SS]`
- [ ] Indicador visual muda de "Salvando..." para "Salvo há Xmin"

**Resultado esperado:** ✅ Salvamento manual com logs completos

---

### ❌ Delete - Remover
**Setup:**
1. [ ] Selecionar 2 nós quaisquer
2. [ ] Pressionar Delete

**Verificações:**
- [ ] Console mostra: `🗑️ Nós deletados`
- [ ] Nós desaparecem do canvas
- [ ] Conexões ligadas a eles também são removidas
- [ ] Seleção é limpa (contador mostra 0)

**Resultado esperado:** ✅ Remoção funcional com limpeza de edges

---

### 🖱️ V/H - Modos de Interação
**Teste V (Seleção):**
1. [ ] Pressionar tecla V
2. [ ] Botão "👆 Seleção" fica azul
3. [ ] Clicar e arrastar = selecionar nós (não move canvas)
4. [ ] Scroll = zoom (não move canvas)

**Teste H (Mão):**
5. [ ] Pressionar tecla H
6. [ ] Botão "✋ Mão" fica azul
7. [ ] Clicar e arrastar = move canvas
8. [ ] Scroll = move canvas verticalmente

**Resultado esperado:** ✅ Alternância de modos funcional

---

## 💾 PARTE 3: AUTO-SAVE E INDICADORES

### ⏱️ Teste Auto-Save
**Setup:**
1. [ ] Abrir navegador com DevTools (F12)
2. [ ] Ir para aba Console
3. [ ] Adicionar novo nó ao canvas
4. [ ] Aguardar 3 segundos SEM fazer mais alterações

**Verificações:**
- [ ] Após ~3s, console mostra: `💾 Iniciando salvamento...`
- [ ] Console mostra dados completos
- [ ] Console mostra confirmação de salvamento
- [ ] Indicador visual muda para "Salvando..."
- [ ] Depois muda para "Salvo há Xmin"

**Teste cancelamento de timer:**
5. [ ] Adicionar nó
6. [ ] Antes de 3s, mover outro nó
7. [ ] Antes de 3s, adicionar mais um nó
8. [ ] Aguardar 3s agora
9. [ ] Verificar se salvou apenas 1 vez (não 3 vezes)

**Resultado esperado:** ✅ Auto-save com debounce de 3s

---

### 📊 Teste Indicador Visual

**Estado: Salvando**
- [ ] Fazer alteração
- [ ] Verificar spinner azul girando
- [ ] Texto: "Salvando..."
- [ ] Cor: azul (#3b82f6)

**Estado: Salvo**
- [ ] Após salvamento completo
- [ ] Verificar ícone 💾
- [ ] Texto: "Salvo há Xmin" (atualiza dinamicamente)
- [ ] Cor: verde (#10b981)

**Estado: Erro**
- [ ] Desconectar internet (modo avião)
- [ ] Fazer alteração
- [ ] Aguardar 3s
- [ ] Verificar ícone ⚠️
- [ ] Texto: "Erro ao salvar"
- [ ] Cor: vermelho (#ef4444)

**Resultado esperado:** ✅ Indicadores visuais corretos para cada estado

---

## 🗄️ PARTE 4: PERSISTÊNCIA SUPABASE

### 📝 Teste Salvamento no Banco

**Setup:**
1. [ ] Criar novo flow
2. [ ] Adicionar 5 nós diferentes
3. [ ] Conectar todos em sequência
4. [ ] Aguardar auto-save (3s)

**Verificações no Supabase:**
5. [ ] Abrir Supabase Dashboard
6. [ ] Ir para Table Editor > `flows`
7. [ ] Encontrar flow criado (ordenar por `updated_at`)
8. [ ] Verificar campo `name` = nome do flow
9. [ ] Verificar campo `description`
10. [ ] Clicar em campo `content`
11. [ ] Verificar JSON contém:
    - `nodes` array com 5 elementos
    - `edges` array com 4 elementos (5 nós = 4 conexões)
    - Cada node tem: `id`, `type`, `position`, `data`
    - Cada edge tem: `id`, `source`, `target`

**Resultado esperado:** ✅ Dados salvos corretamente no Supabase

---

### 🔄 Teste Carregamento do Banco

**Setup:**
1. [ ] Copiar ID do flow criado acima
2. [ ] Recarregar página (F5)
3. [ ] Ou navegar para: `/editor/[FLOW_ID]`

**Verificações:**
- [ ] Console mostra: `📂 Carregando flow: [ID]`
- [ ] Console mostra: `✅ Flow carregado: { nodes: 5, edges: 4 }`
- [ ] Todos os 5 nós aparecem nas posições corretas
- [ ] Todas as 4 conexões estão intactas
- [ ] Nome do flow aparece no header
- [ ] Descrição aparece no header
- [ ] Indicador mostra "Salvo há Xmin"

**Resultado esperado:** ✅ Carregamento completo e correto

---

### ✏️ Teste Atualização no Banco

**Setup:**
1. [ ] Com flow carregado, adicionar 3 nós novos
2. [ ] Deletar 1 nó antigo
3. [ ] Mover 2 nós de posição
4. [ ] Editar nome do flow
5. [ ] Aguardar auto-save (3s)

**Verificações no Supabase:**
6. [ ] Atualizar view da tabela `flows`
7. [ ] Campo `updated_at` deve ter mudado (timestamp recente)
8. [ ] Campo `name` deve ter novo nome
9. [ ] Campo `content` > `nodes` deve ter 7 elementos (5-1+3)
10. [ ] Posições dos nós movidos devem estar atualizadas

**Resultado esperado:** ✅ Updates salvos incrementalmente

---

## 🎨 PARTE 5: TEMPLATE DVD NATAL

### 🎄 Teste Carregamento do Template

**Setup:**
1. [ ] Clicar botão "🎄 DVD Natal"

**Verificações:**
- [ ] Console mostra: `🎄 Template DVD Natal carregado`
- [ ] 23 nós aparecem no canvas:
  - 1 Meta Ads (brand)
  - 1 Campaign (visualCampaign)
  - 1 Audience (visualAudience)
  - 15 Criativos (5 img + 5 vid + 5 car)
  - 2 Destinos (YouTube + Instagram)
  - 1 Result
- [ ] 49 edges conectando todos
- [ ] Nome do flow: "🎄 DVD Natal 2024"
- [ ] Descrição: "Campanha de visualizações..."
- [ ] Layout visual organizado em colunas

**Teste de interação:**
2. [ ] Selecionar nó "Campaign"
3. [ ] Verificar métricas preenchidas (budget, spent, impressions, etc)
4. [ ] Duplicar criativo (Ctrl+D)
5. [ ] Conectar novo criativo ao YouTube
6. [ ] Salvar (Ctrl+S)
7. [ ] Recarregar (F5)
8. [ ] Verificar se novo criativo permaneceu

**Resultado esperado:** ✅ Template completo e funcional

---

## 🐛 PARTE 6: EDGE CASES E BUGS

### 🔍 Teste de Input/Textarea
**Problema:** Atalhos não devem funcionar ao editar texto

1. [ ] Clicar no input "Nome do Flow"
2. [ ] Digitar "Ctrl+D" (deve inserir letra "d", não duplicar)
3. [ ] Clicar na textbox de um Post-it
4. [ ] Pressionar Ctrl+C (deve copiar texto, não nó)
5. [ ] Sair do input (clicar no canvas)
6. [ ] Agora Ctrl+D deve duplicar normalmente

**Resultado esperado:** ✅ Atalhos ignorados dentro de inputs

---

### ♾️ Teste de Múltiplas Cópias
**Problema:** IDs devem ser únicos

1. [ ] Selecionar nó
2. [ ] Ctrl+C
3. [ ] Ctrl+V 10 vezes seguidas
4. [ ] Verificar console: todos IDs diferentes
5. [ ] Verificar React DevTools: sem warnings de keys duplicadas

**Resultado esperado:** ✅ IDs sempre únicos (timestamp + random)

---

### 🔗 Teste de Conexões em Cópia
**Problema:** Conexões internas devem ser preservadas

1. [ ] Criar rede: A → B → C (3 nós, 2 edges)
2. [ ] Selecionar os 3 (Shift+Click)
3. [ ] Ctrl+C
4. [ ] Ctrl+V
5. [ ] Verificar se A' → B' → C' (cópias conectadas entre si)
6. [ ] Verificar se NÃO há: A → B' ou A' → B (sem conexões cruzadas)

**Resultado esperado:** ✅ Topologia de rede preservada

---

### 🚫 Teste de Clipboard Vazio
**Problema:** Ctrl+V sem Ctrl+C não deve fazer nada

1. [ ] Recarregar página (clipboard vazio)
2. [ ] Pressionar Ctrl+V
3. [ ] Verificar console: sem erros
4. [ ] Nada acontece no canvas

**Resultado esperado:** ✅ Graceful handling de clipboard vazio

---

## 📱 PARTE 7: RESPONSIVIDADE E PERFORMANCE

### ⚡ Teste de Performance com Muitos Nós

1. [ ] Carregar template DVD Natal (23 nós)
2. [ ] Selecionar todos (Ctrl+A ou arrastar seleção)
3. [ ] Ctrl+D para duplicar todos (46 nós)
4. [ ] Ctrl+D novamente (92 nós)
5. [ ] Verificar se canvas continua responsivo
6. [ ] Mover nós, zoom, pan
7. [ ] Verificar tempo de auto-save no console

**Resultado esperado:** ✅ Performance aceitável até ~100 nós

---

### 🖥️ Teste Cross-Browser

**Chrome:**
- [ ] Todos os testes acima

**Firefox:**
- [ ] Atalhos funcionam (especialmente Ctrl+D)
- [ ] Elementos visuais renderizam corretamente
- [ ] Auto-save funciona

**Edge:**
- [ ] Verificação básica de funcionalidade

**Resultado esperado:** ✅ Compatibilidade cross-browser

---

## ✅ CHECKLIST FINAL DE VALIDAÇÃO

### Funcionalidades Core
- [ ] ✅ Círculo funciona
- [ ] ✅ Quadrado funciona
- [ ] ✅ Textbox funciona
- [ ] ✅ Post-it funciona
- [ ] ✅ Ctrl+D duplica
- [ ] ✅ Ctrl+C copia
- [ ] ✅ Ctrl+V cola
- [ ] ✅ Ctrl+S salva
- [ ] ✅ Delete remove
- [ ] ✅ V/H alterna modos
- [ ] ✅ Auto-save (3s debounce)
- [ ] ✅ Indicador visual de save
- [ ] ✅ Logs no console
- [ ] ✅ Persistência Supabase
- [ ] ✅ Template DVD Natal

### Qualidade
- [ ] ✅ Sem erros no console
- [ ] ✅ Sem warnings React
- [ ] ✅ IDs únicos sempre
- [ ] ✅ Conexões preservadas
- [ ] ✅ Atalhos ignorados em inputs
- [ ] ✅ Performance aceitável
- [ ] ✅ Cross-browser OK

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTES

✅ **Se todos os testes passarem:**
1. Commit do código
2. Deploy para staging
3. Testar em ambiente real
4. Partir para integrações Meta Ads API

❌ **Se houver falhas:**
1. Documentar bugs encontrados
2. Criar issues no projeto
3. Priorizar correções críticas
4. Re-testar após fixes

---

## 📝 NOTAS DO TESTE

**Testador:** _______________________  
**Data:** ___/___/______  
**Ambiente:** □ Local  □ Staging  □ Produção  
**Browser:** _______________________  
**Versão:** _______________________

**Bugs encontrados:**
```
1. 
2. 
3. 
```

**Observações:**
```


```

**Status Final:** □ ✅ APROVADO  □ ❌ REPROVADO  □ ⚠️ COM RESSALVAS
