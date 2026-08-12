# AdsFlow Audiences Sync — Blueprint

**Status**: Spec v1 — pronto pra implementação
**Owner**: Efeito Digital
**Criado**: 2026-05-27
**Trigger**: Necessidade MOAI (Vinícius Postai) automatizar envio de público Clint → Meta Custom Audiences. Caso de uso reusável pra qualquer cliente Efeito com CRM + tráfego pago.

---

## 1. Por que existir

Hoje cada cliente Efeito gera Custom Audiences manualmente:
- Exporta lista CRM (Clint, Kommo, Brevo, Sheets...) → CSV
- Hasha SHA-256 emails/phones
- Upload manual no Audience Manager Meta / Google
- Refaz toda semana ou mensalmente
- Sem rastreio se sync funcionou
- Sem exclusões automáticas (compradores, inadimplentes)

Resultado: 30-60 min por cliente por update. Erros frequentes (subir lista desatualizada, esquecer exclusão). Audiences "frescas" só nos primeiros dias após upload, depois ficam stale.

**Audiences Sync** vira o problema do avesso: cada cliente configura uma vez "receitas" do que sincronizar, e o sistema mantém audiences sempre frescas (sync configurável de horário em horário até diário). Acabou o trabalho manual.

---

## 2. Casos de uso reais (clientes Efeito)

| Cliente | Recipe | Source → Destination |
|---|---|---|
| **MOAI** | Alavanca Hot LAL seed | Clint tags `Master Alavanca - Trafego` + `Formulários Alavanca` (excl: `Compra aprovada Masterclass`, `Inadimplente`) → Meta CA `[ED][CRM] Alavanca Hot` |
| **MOAI** | Compradores exclusão | Clint tag `Compra aprovada - MOAI Masterclass` → Meta CA `[ED][CRM] Compradores - EXCL` |
| **MOAI** | High End premium | Clint tag `High End Club` (excl: `Inadimplente`) → Meta CA `[ED][CRM] High End` |
| **MOAI** | Engaj IG amplo | Clint `Instagram Moai` + `MOAI SOMA` (excl: `Inadimplente`) → Meta CA seed LAL amplo |
| **MOAI** | Compradores → Google | Clint `Compra aprovada Masterclass` → Google Customer Match |
| **Picnic** | Leads Maedoteca | Kommo etapa "Lead qualificado" → Meta CA Picnic |
| **Blink** | Pacientes Estrabismo | Spreadsheet manual → Meta CA Blink (1x/sem) |
| **Isaac Newton** | Pais Fund I 2027 | Bia DB (SQLite local) → Meta CA Isaac |

→ **1 sistema serve todos**. Pricing: produto incluso no plano Growth (R$ 2k+/mês) ou módulo separado (R$ 500/mês cliente standalone).

---

## 3. Arquitetura

```
┌─ AdsFlow App (React 19 + Vite) ──────────────────────────────────┐
│                                                                   │
│   /audiences/recipes — List + Filter por cliente                  │
│   /audiences/recipes/new — Form de criação                        │
│   /audiences/recipes/:id — Detail + Sync logs + Run Now           │
│   /audiences/dashboard — KPIs cross-recipe                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ↓ (Supabase JS client)
┌─ Supabase ───────────────────────────────────────────────────────┐
│                                                                   │
│  Schema:                                                          │
│  ├─ audience_recipes (config das receitas)                        │
│  ├─ audience_sync_runs (histórico de execução)                    │
│  ├─ audience_source_connections (credenciais Clint/Kommo/Brevo)   │
│  └─ audience_destination_connections (tokens Meta/Google)         │
│                                                                   │
│  RLS por client_id (multi-tenant via clients existente)           │
│  Edge Functions:                                                  │
│  └─ sync-recipe(recipe_id) — função reutilizada                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ↑
┌─ Vercel Cron Functions ──────────────────────────────────────────┐
│  /api/cron/audiences-sync (rodando ex: 7,37 * * * *)              │
│   1. SELECT * FROM audience_recipes WHERE status='active'         │
│      AND next_run_at <= now()                                     │
│   2. for each → POST supabase Edge sync-recipe(id)                │
│   3. Edge function:                                               │
│      a. Fetch source (Clint/Kommo/Brevo) com filtros              │
│      b. Aplicar exclusions (subtrair contatos das tags excl)      │
│      c. Hash SHA-256 emails/phones (nunca enviar plain)           │
│      d. Upload destination API (Meta/Google)                      │
│      e. INSERT INTO audience_sync_runs                            │
│      f. UPDATE recipe.last_sync_at, last_count                    │
│      g. Se erro: notificar Slack + email                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Schema Supabase

### audience_source_connections

```sql
CREATE TABLE audience_source_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Clint MOAI"
  type TEXT NOT NULL,                    -- 'clint' | 'kommo' | 'brevo' | 'sheets' | 'http'
  credentials_encrypted JSONB NOT NULL,  -- { api_token: 'enc:...', base_url: '...' }
  config JSONB DEFAULT '{}'::jsonb,      -- type-specific
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### audience_destination_connections

```sql
CREATE TABLE audience_destination_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Meta Ads MOAI"
  type TEXT NOT NULL,                    -- 'meta' | 'google' | 'tiktok' | 'linkedin'
  credentials_encrypted JSONB NOT NULL,  -- { access_token: 'enc:...', account_id: '...' }
  config JSONB DEFAULT '{}'::jsonb,
  health_status TEXT DEFAULT 'unknown',  -- 'ok' | 'token_expired' | 'no_permission'
  health_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### audience_recipes

```sql
CREATE TABLE audience_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "MOAI Alavanca Hot → Meta"

  source_connection_id UUID NOT NULL REFERENCES audience_source_connections(id),
  source_filter JSONB NOT NULL,          -- { tag_names: [...], created_after: '...' }
  source_exclusions JSONB DEFAULT '{}'::jsonb, -- { tag_names: ['Inadimplente'] }

  destination_connection_id UUID NOT NULL REFERENCES audience_destination_connections(id),
  destination_audience_id TEXT,          -- ID da CA existente (vazio = criar nova)
  destination_audience_name TEXT NOT NULL,

  identifiers_to_use TEXT[] DEFAULT ARRAY['email','phone'], -- quais hashes enviar

  schedule_cron TEXT NOT NULL,           -- "0 6 * * *" — daily 6am
  status TEXT DEFAULT 'active',          -- 'active' | 'paused' | 'error'
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_source_count INT,
  last_uploaded_count INT,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_next_run ON audience_recipes(next_run_at) WHERE status='active';
```

### audience_sync_runs

```sql
CREATE TABLE audience_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES audience_recipes(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_type TEXT NOT NULL,            -- 'cron' | 'manual' | 'api'

  status TEXT NOT NULL,                  -- 'running' | 'success' | 'partial' | 'error'

  source_count INT,                      -- contatos retornados pela source antes da exclusion
  excluded_count INT,                    -- removidos por exclusion rules
  hashed_count INT,                      -- com pelo menos 1 identifier hash válido
  uploaded_count INT,                    -- aceitos pela destination API
  match_rate NUMERIC,                    -- preenchido depois pela destination

  duration_ms INT,
  error_message TEXT,
  raw_response JSONB,

  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_runs_recipe_time ON audience_sync_runs(recipe_id, triggered_at DESC);
```

### Encrypted credentials

Não armazenar tokens em plain. Usar `pgcrypto` ou Supabase Vault:

```sql
-- exemplo de encrypt no insert
INSERT INTO audience_source_connections (client_id, name, type, credentials_encrypted)
VALUES (
  '...',
  'Clint MOAI',
  'clint',
  jsonb_build_object(
    'api_token', encode(pgp_sym_encrypt('U2FsdGVk...', current_setting('app.encryption_key')), 'base64'),
    'base_url', 'https://api.clint.digital/v1'
  )
);
```

---

## 5. Edge Function — sync-recipe (Deno)

```typescript
// supabase/functions/sync-recipe/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req) => {
  const { recipe_id, trigger_type } = await req.json();
  const supabase = createClient(...);

  // 1. Load recipe + connections
  const { data: recipe } = await supabase
    .from('audience_recipes')
    .select(`*,
      source: audience_source_connections!source_connection_id (*),
      destination: audience_destination_connections!destination_connection_id (*)`)
    .eq('id', recipe_id)
    .single();

  // 2. Decrypt credentials
  const sourceCreds = await decrypt(recipe.source.credentials_encrypted);
  const destCreds = await decrypt(recipe.destination.credentials_encrypted);

  // 3. Fetch source — dispatch by type
  let contacts = await fetchSource(recipe.source.type, sourceCreds, recipe.source_filter);

  // 4. Apply exclusions
  const excluded = await fetchSource(recipe.source.type, sourceCreds, recipe.source_exclusions);
  const excludedIds = new Set(excluded.map(c => c.id));
  contacts = contacts.filter(c => !excludedIds.has(c.id));

  // 5. Hash identifiers
  const hashed = contacts.map(c => ({
    hashed_email: c.email ? sha256(normalizeEmail(c.email)) : null,
    hashed_phone: c.phone ? sha256(normalizePhone(c.phone)) : null,
  })).filter(h => h.hashed_email || h.hashed_phone);

  // 6. Upload destination — dispatch by type
  const result = await uploadDestination(recipe.destination.type, destCreds, {
    audience_id: recipe.destination_audience_id,
    audience_name: recipe.destination_audience_name,
    users: hashed,
  });

  // 7. Log run
  await supabase.from('audience_sync_runs').insert({
    recipe_id,
    trigger_type,
    status: result.success ? 'success' : 'error',
    source_count: contacts.length + excludedIds.size,
    excluded_count: excludedIds.size,
    hashed_count: hashed.length,
    uploaded_count: result.uploaded,
    error_message: result.error,
    completed_at: new Date(),
  });

  return new Response(JSON.stringify(result));
});
```

---

## 6. Source/Destination Adapters

### Source: Clint

```typescript
// adapters/source/clint.ts
async function fetchClintContacts(creds, filter) {
  const tags = filter.tag_names || [];
  const results = [];
  for (const tag of tags) {
    let page = 1;
    while (true) {
      const res = await fetch(
        `${creds.base_url}/contacts?tag_names=${encodeURIComponent(tag)}&limit=100&page=${page}`,
        { headers: { 'api-token': creds.api_token } }
      );
      const data = (await res.json()).data;
      if (!data?.length) break;
      results.push(...data);
      page++;
      if (page > 50) break; // safety
    }
  }
  // dedup por id
  return Array.from(new Map(results.map(c => [c.id, c])).values());
}
```

### Source: Kommo, Brevo, Google Sheets, HTTP

Same pattern: implement `fetchContacts(creds, filter): Contact[]` for each.

### Destination: Meta

```typescript
// adapters/destination/meta.ts
async function uploadMeta(creds, { audience_id, audience_name, users }) {
  // Create audience if doesn't exist
  if (!audience_id) {
    const create = await fetch(
      `https://graph.facebook.com/v24.0/act_${creds.account_id}/customaudiences`,
      {
        method: 'POST',
        body: new URLSearchParams({
          name: audience_name,
          subtype: 'CUSTOM',
          customer_file_source: 'USER_PROVIDED_ONLY',
          access_token: creds.access_token,
        }),
      }
    );
    audience_id = (await create.json()).id;
  }

  // Upload in batches of 10k (Meta limit)
  const batchSize = 10000;
  let total = 0;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const schema = ['EMAIL', 'PHONE'];
    const data = batch.map(u => [u.hashed_email || '', u.hashed_phone || '']);

    const upload = await fetch(
      `https://graph.facebook.com/v24.0/${audience_id}/users`,
      {
        method: 'POST',
        body: new URLSearchParams({
          payload: JSON.stringify({ schema, data }),
          access_token: creds.access_token,
        }),
      }
    );
    const r = await upload.json();
    if (r.error) throw new Error(r.error.message);
    total += batch.length;
  }
  return { success: true, uploaded: total, audience_id };
}
```

### Destination: Google Customer Match, TikTok, LinkedIn

Same `uploadDestination(creds, { audience_id?, audience_name, users })` signature.

---

## 7. UI AdsFlow

### /audiences/recipes (lista)

```
[Filter: cliente ▼] [Status ▼] [+ Nova Recipe]

| Cliente | Nome | Source → Destination | Schedule | Última sync | Conta | Status |
|---|---|---|---|---|---|---|
| MOAI | Alavanca Hot → Meta | Clint (4 tags, 2 excl) → Meta CA | 6h diário | 4h atrás | 478 → 312 | 🟢 |
| MOAI | High End → Meta | Clint (1 tag) → Meta CA | 6h diário | 4h atrás | 124 → 89 | 🟢 |
| Picnic | Leads Qualificados → Meta | Kommo etapa → Meta CA | 12h diário | 8h atrás | 234 → 198 | 🟢 |
| MOAI | Engaj IG → Meta LAL seed | Clint (4 tags) → Meta | 6h diário | erro 4h | 0 | 🔴 token expirado |
```

### /audiences/recipes/new (form)

```
[Step 1] Identificação
  Cliente: [dropdown]
  Nome da recipe: [text]

[Step 2] Source
  Conexão: [Clint MOAI ▼]  ou [+ Conectar nova fonte]
  Filtro de inclusão:
    Tags: [multiselect carregando do Clint ▼]
    Criados após: [date]
  Filtro de exclusão:
    Tags: [multiselect ▼]

[Step 3] Destination
  Conexão: [Meta Ads MOAI ▼]  ou [+ Conectar destino]
  Audience: [usar existente ▼] OU [criar nova]
  Nome (se nova): [text autopreenchido]
  Identifiers: [✓ email] [✓ telefone]

[Step 4] Schedule
  Frequência: [Diário 6h ▼] | Cron custom
  Status inicial: [✓ Ativo]

[Botão] Testar Agora (dry-run)
[Botão] Salvar
```

### /audiences/recipes/:id (detail)

- Resumo config + KPIs últimos 30d
- Histórico de runs (gráfico count + lista)
- Botão "Sync Agora"
- Botão "Pausar"
- Editar (mesmo form do new)

---

## 8. Health checks + alertas

- Edge function `check-connections-health` (cron diário 5h):
  - Pra cada destination: testa `GET /me/adaccounts` (Meta) ou equivalente
  - Se falhar: marca `health_status = 'token_expired'`
  - Notifica Slack `#alerts-adsflow`: "Token MOAI expirado, regenerar"
- Run logs com `status='error'` 2x consecutivas: pausa recipe + alerta

---

## 9. Multi-tenant + RLS

Já existe tabela `clients` no AdsFlow. Reusar:

```sql
-- Policy: usuário só vê audiences do(s) cliente(s) que tem acesso
CREATE POLICY "users_see_own_clients_recipes"
ON audience_recipes FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM client_users WHERE user_id = auth.uid()
  )
);

-- Mesma policy nas outras tabelas
```

---

## 10. Roadmap de dev (estimativa)

| Fase | Escopo | Duração |
|---|---|---|
| **F1 — Schema + migrations** | 4 tabelas + RLS + encryption setup | 1 dia |
| **F2 — Source Clint adapter** | fetch + filter + dedup + tests | 1 dia |
| **F3 — Destination Meta adapter** | create CA + upload users batched + hash | 1 dia |
| **F4 — Edge Function sync-recipe** | orchestrate fetch → exclusion → hash → upload → log | 1 dia |
| **F5 — Vercel Cron driver** | seleciona recipes due + dispara edge | 0.5 dia |
| **F6 — UI lista + detail** | tela com tabelas e filters | 1 dia |
| **F7 — UI form + connect new source/dest** | wizard de criação | 1.5 dia |
| **F8 — Health checks + alertas Slack** | 0.5 dia |
| **F9 — Adapters extras (Kommo, Brevo, Google)** | 0.5 dia cada |
| **Total v1** | 7 dias |

Depois de v1: 30min por integração nova (novo source ou destination).

---

## 11. Pricing / monetização

| Tier | Pra quem | Inclui | Pricing |
|---|---|---|---|
| **Growth** (já existe Efeito) | Clientes em mgmt total | Audiences Sync incluso (até 10 recipes) | sem custo extra |
| **Sync Standalone** | Cliente self-service | Até 5 recipes + 100k contatos/mês sync | R$ 500/mês |
| **Sync Pro** | Volume alto / multi-canal | Recipes ilimitadas + 1M contatos/mês + alertas custom | R$ 1.500/mês |
| **White-label** | Agências parceiras | Brand customizado | sob consulta |

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Token Meta expira durante sync | Health check antecede sync · Notificação se token quebrado |
| Source API rate limit (Clint pagina) | Backoff exponencial + chunking por tag |
| Hash SHA-256 inconsistente entre runs (encoding) | Lib única + tests cobrindo edge cases |
| Recipe configurada errada → upload audience errada | Dry-run obrigatório antes de ativar |
| Vazamento de tokens em logs | Sempre logar `cred_id`, nunca o token plain |
| Cliente revoga permissão sem avisar | Health daily detecta + recipe vai pra status=error |

---

## 13. Próximos passos

1. **Sprint 1** (próxima semana): F1-F4 (schema + Clint source + Meta destination + edge function)
2. **Sprint 2**: F5-F8 (cron + UI + alertas)
3. **Pilot**: rodar com MOAI 2 semanas em prod
4. **Sprint 3**: adapters Kommo + Brevo
5. **Lançar como produto**: case study MOAI + pricing público

---

## Apêndice — Conexões de stack existente AdsFlow

- Supabase ref: `sdtyynzyfvxigwfmzayk`
- Vercel project: `adsflow`
- Domain: `adsflow.efeito.digital`
- Já tem: `clients`, `client_users`, `campaigns`, `metric_definitions`, `goal_quarter_targets`
- Adicionar nesta feature: 4 tabelas novas (audience_*)

Stack:
- React 19 + TS + Vite 7 + Tailwind 3.4 + shadcn/ui
- Supabase (Postgres + Edge Functions + Auth)
- Vercel (deploys + Cron)
- Token storage: Supabase Vault ou pgcrypto

---

*Documento mantido em `~/Ad Flow/docs/features/audiences-sync.md`. Próxima revisão: pós-Sprint 1.*
