#!/usr/bin/env node
/**
 * Aplica um arquivo .sql no banco via Supabase Management API.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migration.mjs supabase/migrations/037_consolidate_client_integrations.sql
 *
 * O PAT (sbp_...) sai de https://supabase.com/dashboard/account/tokens
 * O project ref sai da URL do projeto; pode vir por SUPABASE_PROJECT_REF.
 *
 * Roda o arquivo inteiro numa unica chamada — o Postgres trata multiplos
 * statements como um bloco transacional implicito, entao ou entra tudo ou
 * nao entra nada.
 */
import { readFile } from 'node:fs/promises'

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF || 'sdtyynzyfvxigwfmzayk'
const file = process.argv[2]

if (!TOKEN) {
  console.error('Falta SUPABASE_ACCESS_TOKEN (PAT sbp_...) no ambiente.')
  process.exit(1)
}
if (!file) {
  console.error('Uso: node scripts/apply-migration.mjs <caminho/do/arquivo.sql>')
  process.exit(1)
}

async function query(sql, label) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`[${label}] HTTP ${res.status}`)
    console.error(text)
    process.exit(1)
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const sql = await readFile(file, 'utf8')
console.log(`Aplicando ${file} no projeto ${REF} ...`)
await query(sql, 'migration')
console.log('OK — migration aplicada.\n')

// A Management API nao devolve os RAISE NOTICE, entao o relatorio vem por query.
const report = await query(
  `SELECT provider,
          count(*)::int AS total,
          count(*) FILTER (WHERE metadata ? 'migrated_from')::int AS migradas_de_legado
     FROM public.client_integrations
    GROUP BY provider
    ORDER BY provider;`,
  'relatorio'
)
console.log('client_integrations por provider:')
console.table(report)

const orphans = await query(
  `SELECT 'ad_accounts' AS tabela, count(*)::int AS sem_client_id FROM public.ad_accounts WHERE client_id IS NULL
   UNION ALL SELECT 'google_accounts', count(*)::int FROM public.google_accounts WHERE client_id IS NULL
   UNION ALL SELECT 'clickup_configs', count(*)::int FROM public.clickup_configs WHERE client_id IS NULL
   UNION ALL SELECT 'kommo_configs',   count(*)::int FROM public.kommo_configs   WHERE client_id IS NULL;`,
  'orfaos'
)
console.log('\nLinhas legadas que NAO migraram (sem client_id):')
console.table(orphans)
