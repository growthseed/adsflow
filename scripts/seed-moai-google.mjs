#!/usr/bin/env node
/**
 * Seed da integração Google Ads MOAI no client_integrations.
 *
 * Salva o refresh_token de ~/.claude/secrets/google_ads_token.json.
 * Access tokens duram 1h; o handler refresca conforme necessário.
 *
 * Run: node scripts/seed-moai-google.mjs
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

// Token do refresh + metadata
const TOKEN_FILE = resolve(homedir(), '.claude', 'secrets', 'google_ads_token.json')
if (!existsSync(TOKEN_FILE)) {
  console.error(`Token file não encontrado: ${TOKEN_FILE}`)
  process.exit(1)
}
const g = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'))
console.log(`[INFO] Refresh token Google Ads carregado.`)

const MOAI_CLIENT_ID = '76d3f5ed-33c0-4ae1-a904-0d8f19f27c2e'
const ACCOUNT_ID = '7297509788'
const LOGIN_CUSTOMER_ID = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')

const row = {
  client_id: MOAI_CLIENT_ID,
  provider: 'google_ads',
  external_account_id: ACCOUNT_ID,
  external_account_name: 'MOAI — Google Ads',
  external_workspace_id: LOGIN_CUSTOMER_ID || null, // MCC (login-customer-id)
  access_token: null,                                // refresh fresh quando precisar
  refresh_token: g.refresh_token,
  token_expires_at: null,
  status: 'active',
  metadata: {
    // O refresh_token está vinculado ao OAuth client que o emitiu —
    // se o env tiver um client_id diferente, o refresh falha com 401
    // "unauthorized_client". Salvamos client_id+secret aqui pra garantir
    // que o handler use o par correto.
    client_id: g.client_id,
    client_secret: g.client_secret,
    scopes: g.scopes,
    login_customer_id: LOGIN_CUSTOMER_ID || null,
    currency: 'BRL',
    is_manager: false,
    source_file: 'google_ads_token.json',
    note: 'Refresh token persistente. Handler usa refresh→access em runtime. Login customer id = MCC Efeito Digital.',
  },
}

async function pgUpsert(table, rows, onConflict) {
  const conflict = onConflict ? `?on_conflict=${onConflict}` : ''
  const url = `${URL}/rest/v1/${table}${conflict}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`UPSERT ${table}: ${r.status} ${await r.text()}`)
  return r.json()
}

const inserted = await pgUpsert(
  'client_integrations',
  row,
  'client_id,provider,external_account_id',
)
console.log(`[OK] Integração Google Ads MOAI gravada — id=${inserted[0].id} status=${inserted[0].status}`)
console.log(`     account_id=${ACCOUNT_ID} login_customer_id=${LOGIN_CUSTOMER_ID || '(sem MCC)'}`)
