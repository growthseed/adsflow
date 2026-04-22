#!/usr/bin/env node
/**
 * Seed playbook_docs with real markdown from src/data/playbook/.
 * Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 *
 * Run: node scripts/seed-playbook.mjs
 */

import { readFile, readFileSync } from 'node:fs'
import { readFile as readFileAsync } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

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

const DOCS_DIR = resolve(ROOT, 'src', 'data', 'playbook')

const docs = [
  {
    slug: 'overview',
    title: 'Visão Geral',
    description: 'Índice e princípios não-negociáveis da Efeito Digital',
    category: 'intro',
    file: 'SKILL.md',
    position: 0,
    is_official: true,
  },
  {
    slug: 'philosophy',
    title: 'Filosofia — Diagnostic Partner',
    description: 'Como pensar: parceiro de diagnóstico, não auto-executor',
    category: 'intro',
    file: 'philosophy.md',
    position: 1,
    is_official: true,
  },
  {
    slug: 'keyword-ngram-audit',
    title: 'N-gram Audit + SWOT',
    description: 'Centerpiece — análise de palavras-chave com SWOT (Aaron Young)',
    category: 'checklist',
    file: 'checklists/keyword-ngram-audit.md',
    position: 2,
    is_official: true,
  },
  {
    slug: 'landing-page-deep-audit',
    title: 'Landing Page Deep Audit',
    description: 'Auditoria de LP com scraping real (Tendency Web)',
    category: 'checklist',
    file: 'checklists/landing-page-deep-audit.md',
    position: 3,
    is_official: true,
  },
  {
    slug: 'campaigns-ready-to-scale',
    title: 'Campaigns Ready to Scale',
    description: 'Matriz de escala vertical (Aaron Young)',
    category: 'checklist',
    file: 'checklists/campaigns-ready-to-scale.md',
    position: 4,
    is_official: true,
  },
  {
    slug: 'ad-copywriter',
    title: 'Ad Copywriter',
    description: 'Geração de RSA + Meta copy a partir de pesquisa de dor',
    category: 'checklist',
    file: 'checklists/ad-copywriter.md',
    position: 5,
    is_official: true,
  },
  {
    slug: 'google-ads-audit',
    title: 'Google Ads Audit — 30 dias',
    description: 'Auditoria genérica de conta Google Ads dos últimos 30 dias',
    category: 'checklist',
    file: 'checklists/google-ads-audit.md',
    position: 6,
    is_official: true,
  },
]

async function supaUpsert(table, rows, onConflict) {
  const url = `${URL}/rest/v1/${table}?on_conflict=${onConflict}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: KEY,
      authorization: `Bearer ${KEY}`,
      prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`${resp.status} ${resp.statusText}: ${body.slice(0, 500)}`)
  }
  return resp.json()
}

async function main() {
  const payload = []
  for (const d of docs) {
    const filePath = resolve(DOCS_DIR, d.file)
    const content = await readFileAsync(filePath, 'utf-8')
    payload.push({
      slug: d.slug,
      title: d.title,
      description: d.description,
      category: d.category,
      content,
      position: d.position,
      is_official: d.is_official,
      active: true,
    })
  }

  console.log(`Seeding ${payload.length} playbook docs…`)
  const res = await supaUpsert('playbook_docs', payload, 'slug')
  console.log(`✓ ${res.length} rows upserted`)
  for (const r of res) {
    console.log(`  · ${r.slug} (${r.content.length} chars)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
