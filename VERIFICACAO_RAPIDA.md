# 🔍 VERIFICAÇÃO RÁPIDA - ADFLOW

Execute este checklist ANTES de iniciar o servidor:

## ✅ ARQUIVOS ESSENCIAIS

```bash
# Verifique se estes arquivos existem:
ls src/hooks/useFlows.ts
ls src/components/UI/FlowCard.tsx  
ls src/pages/HomePage.tsx
ls src/pages/FlowEditorPage.tsx
ls src/App.tsx
```

## ✅ ESTRUTURA DE PASTAS

```
src/
├── hooks/
│   └── useFlows.ts ✅
├── components/
│   └── UI/
│       └── FlowCard.tsx ✅
├── pages/
│   ├── HomePage.tsx ✅
│   └── FlowEditorPage.tsx ✅
├── lib/
│   └── supabase.ts (já existia)
└── App.tsx ✅
```

## ✅ DEPENDÊNCIAS

```bash
# Verifique package.json:
cat package.json | grep "react-router-dom"
cat package.json | grep "lucide-react"
cat package.json | grep "reactflow"
cat package.json | grep "supabase"

# Se faltar alguma:
npm install react-router-dom lucide-react
```

## ✅ CONFIGURAÇÃO SUPABASE

```bash
# Verifique .env.local:
cat .env.local | grep "VITE_SUPABASE_URL"
cat .env.local | grep "VITE_SUPABASE_ANON_KEY"
```

Deve conter:
```
VITE_SUPABASE_URL=https://sdtyynzyfvxigwfmzayk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## ✅ BANCO DE DADOS

Verifique no Supabase Dashboard se existe:
- [x] Tabela `flows`
- [x] 3 registros com `is_template = true`
- [x] Índices criados
- [x] RLS habilitado

## 🚀 INICIAR

Se tudo estiver OK:

```bash
npm run dev
```

Acesse: http://localhost:3000

## ✅ VALIDAÇÃO VISUAL

Ao abrir http://localhost:3000 você DEVE ver:

1. **Header**: "AdFlow" + "Novo Flow" (botão azul)
2. **Busca**: Input grande com ícone de lupa
3. **Filtros**: 3 botões (Todos/Templates/Meus Flows)
4. **Grid**: 3 cards de templates:
   - LinkedIn Lead Gen
   - E-commerce Meta + Google
   - Lançamento de Produto

## ❌ PROBLEMAS COMUNS

### Erro: "Cannot resolve @/..."
```bash
# Verifique tsconfig.json tem:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erro: "Module not found: react-router-dom"
```bash
npm install react-router-dom
```

### Erro: "supabase is not defined"
```bash
# Verifique se existe src/lib/supabase.ts
ls src/lib/supabase.ts
```

### Página em branco
```bash
# Abra console do navegador (F12)
# Procure por erros em vermelho
# Mais comum: falta de dependência
npm install
```

### Templates não aparecem
```bash
# Execute query no Supabase:
SELECT * FROM flows WHERE is_template = true;

# Deve retornar 3 registros
# Se não, execute inserção novamente (veja transcript)
```

## 📱 TESTE RÁPIDO (2 min)

1. ✅ HomePage carrega
2. ✅ 3 templates aparecem
3. ✅ Click "Novo Flow" → vai para /editor
4. ✅ Digite um nome
5. ✅ Click "Salvar"
6. ✅ URL muda para /editor/{id}
7. ✅ Volte para / → Flow aparece

Se passou em todos → **Sistema OK! 🎉**

---

**Tempo estimado**: 2-5 minutos  
**Objetivo**: Validar instalação básica
