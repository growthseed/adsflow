# Diagnóstico de conexões + checklist de OAuth — Ad Flow

Documento de apoio para destravar as integrações (Google, Meta, Kommo) em escala.
Base: leitura do código real do repositório (services, api/, migrations) em maio/2026.

---

## Os 2 suspeitos número 1 de "nada conecta hoje"

### 1. Variáveis `VITE_*` são congeladas no build
O front lê `import.meta.env.VITE_...` **no momento do build**. Se a variável não existir no
ambiente de **Production** do Vercel — ou se foi adicionada e **não houve redeploy** — ela vira
string vazia e o botão cai num "gate":

- Kommo: `isKommoOAuthConfigured = Boolean(VITE_KOMMO_CLIENT_ID)` → erro "Kommo OAuth não configurado".
- Meta: `isFacebookConfigured = Boolean(VITE_FACEBOOK_APP_ID)` → erro "VITE_FACEBOOK_APP_ID não configurado".
- Google: sem `VITE_GOOGLE_CLIENT_ID` a URL de consentimento sai inválida.

Ação: confirmar TODAS as `VITE_*` em Vercel → Settings → Environment Variables (Production) e
**fazer um redeploy** depois de qualquer alteração.

### 2. Redirect URI precisa bater exatamente
O código gera o redirect assim (origin = https://adsflow.efeito.digital):

| Plataforma | Redirect URI usado pelo app | Onde registrar |
|---|---|---|
| Google | `https://adsflow.efeito.digital/auth/google/callback` | Google Cloud Console → OAuth client → Authorized redirect URIs |
| Kommo | `https://adsflow.efeito.digital/api/kommo/oauth-callback` | Kommo → sua integração → Link de redirecionamento |
| Meta | domínio `adsflow.efeito.digital` (SDK JS) | Meta App → Facebook Login → Allowed Domains / Valid OAuth Redirect URIs |

Qualquer divergência (http vs https, barra final, subpath) gera `redirect_uri_mismatch`.

---

## Checklist por plataforma

### 0. Login do app (Supabase) — pré-requisito
- Front: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Server: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 1. Google Ads / GA4 — caminho mais completo no código
- Front: `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_REDIRECT_URI` (opcional; default `/auth/google/callback`), `VITE_GOOGLE_ADS_DIRECT`
- Server: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_API_VERSION`
- Server (sync por MCC): `GOOGLE_ADS_SYNC_CLIENT_ID`, `GOOGLE_ADS_SYNC_CLIENT_SECRET`, `GOOGLE_ADS_SYNC_REFRESH_TOKEN`
- App-side: developer token com nível **Basic/Standard** aprovado; tela de consentimento publicada com escopos `adwords` + `analytics.readonly`; redirect URI registrado.
- Estado no código: `api/google-ads.ts` já faz `exchange` (code→token), `refresh` e chamadas à API com developer-token + login-customer-id. **Falta só configuração.**
- Teste: clicar "conectar Google" deve abrir `accounts.google.com`; após aprovar, a página `/auth/google/callback` grava em `client_integrations`.
- Atalho: já tendo token longo, usar `GOOGLE_ADS_SYNC_REFRESH_TOKEN` (MCC) para ler já, e habilitar OAuth por cliente depois.

### 2. Meta Ads — é onde o OAuth realmente falta
- Front: `VITE_FACEBOOK_APP_ID`, `VITE_META_API_VERSION`, `VITE_N8N_WEBHOOK_URL`
- Server: `META_ACCESS_TOKEN` (token global atual — a ser aposentado)
- App-side: App em **modo Live**; **Advanced Access** para `ads_read`/`ads_management` (App Review); domínio `adsflow.efeito.digital` no Facebook Login; fluxo n8n de troca short→long (senão o app usa só short-lived).
- Estado no código: login client-side via FB SDK só escolhe assets; o sync usa o token global. `ad_accounts.access_token` fica `null`.
- Falta estrutural: **callback serverless** (ex.: `api/meta/oauth-callback.ts`) que troque short→long / System User token e **grave por cliente** em `client_integrations`/`ad_accounts`.
- Atalho: gravar o **System User token por cliente** e tirar o sync do token global hardcoded.
- Teste: botão Meta deve abrir o popup do FB; sem App em modo Live, só admins/testers do app conseguem conectar.

### 3. Kommo — pronto no código; decisão é só de onboarding
- Front: `VITE_KOMMO_CLIENT_ID`, `VITE_KOMMO_REDIRECT_URI` (default `/api/kommo/oauth-callback`)
- Server: `KOMMO_CLIENT_ID`, `KOMMO_CLIENT_SECRET`
- App-side: integração registrada no Kommo (client_id/secret) com redirect = `/api/kommo/oauth-callback`; OU token longo manual (subdomínio + token de API).
- Estado no código: OAuth completo (`api/kommo/oauth-callback.ts`) **e** token longo manual já implementados.
- Escala (widget): para todos os clientes, empacotar como **widget privado compartilhado por link** (reaproveita o mesmo `oauth-callback`). Não precisa de Marketplace.
- Teste: conectar → `www.kommo.com/oauth` → aprovar → callback grava token.

---

## Segurança — entra junto da primeira migration
- `client_integrations` guarda tokens protegidos por RLS deny-all (só service role lê via RPC), mas a **criptografia at-rest (pgcrypto) ainda não foi feita** (a própria migration marca como "later"). Cifrar `access_token`/`refresh_token` antes de armazenar tokens reais.
- Aposentar o `META_ACCESS_TOKEN` global / token hardcoded.

---

## Como confirmar rápido o que está setado
- Vercel → Settings → Environment Variables (Production): conferir **presença** de cada variável (não o valor) e se o escopo inclui Production. Redeploy após mudanças.
- No app publicado: abrir o console do navegador em `/integrations` e ver se aparece "X não configurado".

### Para me devolver (eu fecho o diagnóstico)
Marque o que JÁ está setado no Vercel (Production):

- [ ] VITE_GOOGLE_CLIENT_ID            - [ ] GOOGLE_ADS_DEVELOPER_TOKEN
- [ ] VITE_FACEBOOK_APP_ID             - [ ] GOOGLE_ADS_LOGIN_CUSTOMER_ID
- [ ] VITE_KOMMO_CLIENT_ID             - [ ] GOOGLE_ADS_CLIENT_ID / _SECRET
- [ ] VITE_N8N_WEBHOOK_URL             - [ ] KOMMO_CLIENT_ID / _SECRET
- [ ] VITE_GOOGLE_ADS_DIRECT           - [ ] META_ACCESS_TOKEN
- [ ] Houve redeploy após setar as VITE_*?  (sim / não)
