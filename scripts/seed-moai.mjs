#!/usr/bin/env node
/**
 * Seed do cliente MOAI no Supabase + integração Meta Ads com System User Token permanente.
 *
 * Lê o token salvo em `~/.claude/secrets/meta_moai_system_user.json` e grava em
 * `client_integrations` (RLS bypass via SUPABASE_SERVICE_ROLE_KEY).
 *
 * Idempotente: se o cliente ou a integração já existem, faz UPDATE em vez de INSERT.
 *
 * Run: node scripts/seed-moai.mjs
 */

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadDotenv(file) {
  const p = resolve(ROOT, file)
  if (!existsSync(p)) return
  const raw = readFileSync(p, 'utf-8')
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line)
    if (!m) continue
    const [, k, vRaw = ''] = m
    if (k.startsWith('#')) continue
    const v = vRaw.replace(/^['"]|['"]$/g, '')
    if (process.env[k] === undefined) process.env[k] = v
  }
}

loadDotenv('.env.local')
loadDotenv('.env')

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const HEADERS = {
  'content-type': 'application/json',
  apikey: KEY,
  authorization: `Bearer ${KEY}`,
}

// ============================================================
// 1. Carrega o System User Token salvo
// ============================================================

const TOKEN_FILE = resolve(homedir(), '.claude', 'secrets', 'meta_moai_system_user.json')
if (!existsSync(TOKEN_FILE)) {
  console.error(`Token file não encontrado: ${TOKEN_FILE}`)
  process.exit(1)
}
const meta = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'))
console.log(`[INFO] Token MOAI carregado — system_user_id=${meta.system_user_id} expires_at=${meta.expires_at}`)
console.log(`[INFO] Status: ${meta.status} (approval expira em ${meta.approval_expires})`)

// ============================================================
// 2. Helpers Supabase REST
// ============================================================

async function pgGet(table, query = '') {
  const url = `${URL}/rest/v1/${table}${query ? `?${query}` : ''}`
  const r = await fetch(url, { headers: HEADERS })
  if (!r.ok) throw new Error(`GET ${table}: ${r.status} ${await r.text()}`)
  return r.json()
}

async function pgUpsert(table, rows, onConflict) {
  const conflict = onConflict ? `?on_conflict=${onConflict}` : ''
  const url = `${URL}/rest/v1/${table}${conflict}`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      ...HEADERS,
      prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`UPSERT ${table}: ${r.status} ${await r.text()}`)
  return r.json()
}

async function pgInsert(table, rows) {
  const url = `${URL}/rest/v1/${table}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, prefer: 'return=representation' },
    body: JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`INSERT ${table}: ${r.status} ${await r.text()}`)
  return r.json()
}

// ============================================================
// 3. Cria/garante o cliente MOAI
// ============================================================

// ============================================================
// 3. Resolve owner (jw@efeito.digital) PRIMEIRO — clients.user_id é NOT NULL
// ============================================================

const OWNER_EMAIL = 'jw@efeito.digital'
const ownerRows = await pgGet('users', `email=eq.${encodeURIComponent(OWNER_EMAIL)}&select=id,email`)
const owner = ownerRows[0]
if (!owner) {
  console.error(`Owner ${OWNER_EMAIL} não encontrado em public.users — abortando.`)
  process.exit(1)
}

const MOAI_CLIENT = {
  name: 'MOAI',
  slug: 'moai',
  industry: 'Mentoria / Consultoria B2B',
  website: null,
  contact_name: 'Vinícius Postai',
  contact_email: null,
  contact_phone: null,
  logo_url: null,
  status: 'active',
  user_id: owner.id,
  service_tier: 'basic',
  active_scope: 'performance',
}

let [client] = await pgGet('clients', 'slug=eq.moai&select=*')
if (!client) {
  const created = await pgInsert('clients', MOAI_CLIENT)
  client = created[0]
  console.log(`[OK] Cliente MOAI criado — id=${client.id}`)
} else {
  console.log(`[SKIP] Cliente MOAI já existe — id=${client.id}`)
}

// ============================================================
// 4. Garante membership como owner em client_members (multi-owner pattern)
// ============================================================

const existingMember = await pgGet(
  'client_members',
  `client_id=eq.${client.id}&user_id=eq.${owner.id}&select=id`,
)
if (existingMember.length === 0) {
  try {
    await pgInsert('client_members', {
      client_id: client.id,
      user_id: owner.id,
      role: 'owner',
    })
    console.log(`[OK] Owner ${OWNER_EMAIL} vinculado a MOAI (client_members)`)
  } catch (e) {
    // tabela pode não existir em ambientes antigos — silencie
    console.warn(`[WARN] client_members não disponível: ${e.message.split('\n')[0]}`)
  }
} else {
  console.log(`[SKIP] Owner ${OWNER_EMAIL} já era membro de MOAI`)
}

// ============================================================
// 5. Integração Meta Ads com token permanente
// ============================================================

const META_ROW = {
  client_id: client.id,
  provider: 'meta_ads',
  external_account_id: meta.ad_account_id,            // "act_394842817764673"
  external_account_name: 'MOAI — Conta Principal',
  external_workspace_id: meta.business_manager_id,    // "126368668455583"
  access_token: meta.access_token,
  refresh_token: null,                                 // System User token não tem refresh
  token_expires_at: null,                              // never expires
  status: meta.status === 'AGUARDA_APROVACAO_2STEP_BM' ? 'active' : 'active',
  metadata: {
    token_type: meta.token_type,                       // "SYSTEM_USER"
    expires_at: meta.expires_at,                       // "never"
    system_user_id: meta.system_user_id,
    system_user_name: meta.system_user_name,
    app_id: meta.app_id,
    app_name: meta.app_name,
    business_manager_name: meta.business_manager_name,
    page_id: meta.page_id,
    pixel_id: meta.pixel_id,
    scopes: meta.scopes,
    approval_status: meta.status,                      // "AGUARDA_APROVACAO_2STEP_BM"
    approval_expires: meta.approval_expires,           // "2026-06-02"
    requested_by: meta.requested_by,
    requested_at: meta.requested_at,
    source_file: 'meta_moai_system_user.json',
    note: meta.note,
  },
}

const upserted = await pgUpsert(
  'client_integrations',
  META_ROW,
  'client_id,provider,external_account_id',
)
console.log(`[OK] Integração Meta Ads MOAI gravada — id=${upserted[0].id} status=${upserted[0].status}`)

// ============================================================
// 6. Resumo final
// ============================================================

const integrations = await pgGet(
  'client_integrations_public',
  `client_id=eq.${client.id}&select=provider,external_account_id,external_account_name,has_access_token,status`,
)
console.log('\n=== Estado final MOAI ===')
console.log(`Cliente: ${client.name} (slug=${client.slug}, id=${client.id})`)
console.log(`Integrações:`)
for (const i of integrations) {
  console.log(`  • ${i.provider} → ${i.external_account_id} (${i.external_account_name || '-'}) — token=${i.has_access_token ? 'YES' : 'NO'} status=${i.status}`)
}
console.log('\nObservação:')
console.log(`  Token Meta é System User permanente (expires_at=never).`)
console.log(`  Status: ${meta.status} — assets do BM aprovam até ${meta.approval_expires}.`)
console.log(`  Após aprovação, o mesmo token passa a enxergar ad_account+page+pixel sem regenerar.`)
