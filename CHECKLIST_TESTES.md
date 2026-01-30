# ✅ CHECKLIST DE TESTES - ADFLOW

## 📦 1. VERIFICAÇÃO DE ARQUIVOS

- [x] `src/hooks/useFlows.ts` - Hook CRUD
- [x] `src/components/UI/FlowCard.tsx` - Card de flow
- [x] `src/pages/HomePage.tsx` - Listagem de flows
- [x] `src/pages/FlowEditorPage.tsx` - Editor de flows
- [x] `src/App.tsx` - Rotas configuradas
- [x] `INSTALACAO.md` - Guia de instalação

## 🔧 2. DEPENDÊNCIAS

Execute no terminal:
```bash
npm install
```

Verifique se estas dependências estão no `package.json`:
- [ ] `react-router-dom` (para rotas)
- [ ] `lucide-react` (para ícones)
- [ ] `reactflow` (já instalado)
- [ ] `@supabase/supabase-js` (já instalado)

## 🚀 3. INICIAR APLICAÇÃO

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## ✅ 4. TESTES FUNCIONAIS

### A. HomePage (/)

- [ ] HomePage carrega sem erros
- [ ] Mostra 3 templates do banco
- [ ] Botão "Novo Flow" funciona
- [ ] Busca filtra flows por nome/descrição/tags
- [ ] Filtros funcionam (Todos/Templates/Meus Flows)
- [ ] Cards exibem corretamente
- [ ] Menu hover aparece nos cards

### B. Criar Novo Flow

1. [ ] Click "Novo Flow" → Redireciona para `/editor`
2. [ ] Editor carrega vazio
3. [ ] Digite nome e descrição
4. [ ] Arraste nodes da paleta (se existir)
5. [ ] Conecte nodes
6. [ ] Click "Salvar" → URL muda para `/editor/{id}`
7. [ ] Indicador "Salvo HH:MM:SS" aparece
8. [ ] Volte para `/` → Flow aparece na lista

### C. Editar Flow Existente

1. [ ] Na HomePage, click em um card de template
2. [ ] Editor carrega com nodes/edges corretos
3. [ ] Nome e descrição aparecem
4. [ ] Edite um node (double-click ou botão edit)
5. [ ] Modal de edição abre
6. [ ] Salve mudanças no modal
7. [ ] Aguarde 3s → "Salvando..." → "Salvo HH:MM:SS"
8. [ ] Volte para `/` → Mudanças persistidas

### D. Duplicar Flow

1. [ ] Hover sobre card → Menu aparece
2. [ ] Click "Duplicar"
3. [ ] Nova cópia aparece com "(Cópia)" no nome
4. [ ] Cópia tem mesmos nodes/edges
5. [ ] Cópia tem ID diferente

### E. Deletar Flow

1. [ ] Hover sobre card → Menu aparece
2. [ ] Click "Deletar"
3. [ ] Confirmação aparece
4. [ ] Confirme → Flow removido da lista
5. [ ] Cancele → Flow permanece

### F. Auto-save

1. [ ] Edite um flow existente
2. [ ] Faça mudanças (mova node, edite data)
3. [ ] Aguarde 3s sem tocar em nada
4. [ ] Indicador "Salvando..." aparece
5. [ ] Indicador muda para "Salvo HH:MM:SS"
6. [ ] Recarregue página → Mudanças persistidas

### G. Busca e Filtros

1. [ ] Digite "LinkedIn" na busca → Filtra template correto
2. [ ] Digite "B2B" → Filtra por tag
3. [ ] Limpe busca → Mostra todos
4. [ ] Click "Templates" → Mostra só templates
5. [ ] Click "Meus Flows" → Mostra só flows criados
6. [ ] Click "Todos" → Mostra tudo

## 🐛 5. TESTES DE ERRO

- [ ] Desconecte internet → Erro aparece ao salvar
- [ ] Tente deletar flow que não existe
- [ ] Tente abrir `/editor/{id-invalido}` → Redireciona ou mostra erro

## 📊 6. VERIFICAR NO SUPABASE

1. Acesse: https://supabase.com/dashboard/project/sdtyynzyfvxigwfmzayk
2. [ ] Tabela `flows` existe
3. [ ] 3 templates estão lá (is_template = true)
4. [ ] Flows criados aparecem (is_template = false)
5. [ ] Campo `updated_at` atualiza ao editar
6. [ ] Nodes e edges salvos como JSONB

## 🎨 7. VERIFICAR UI/UX

- [ ] Loading spinner aparece ao carregar
- [ ] Empty states aparecem quando sem flows
- [ ] Cards responsivos (grid 3 cols → 2 → 1)
- [ ] Hover states funcionam
- [ ] Transições suaves
- [ ] Cores brand-primary aplicadas

## ❗ PROBLEMAS COMUNS

### Erro: "Cannot find module '@/hooks/useFlows'"
**Solução:** Verifique se o path alias `@` está configurado no `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erro: "supabase is not defined"
**Solução:** Verifique se `src/lib/supabase.ts` existe e está configurado corretamente.

### Erro: "react-router-dom not found"
**Solução:** 
```bash
npm install react-router-dom
```

### Auto-save não funciona
**Solução:** 
1. Verifique se há `currentFlowId` (só funciona para flows salvos)
2. Verifique console do navegador por erros

### Templates não aparecem
**Solução:**
1. Verifique se tabela `flows` existe no Supabase
2. Execute novamente a inserção dos templates (veja transcript)

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique o console do terminal (npm run dev)
3. Verifique logs do Supabase
4. Revise `INSTALACAO.md`

---

**Última atualização:** 23/12/2024
**Status:** Pronto para teste
