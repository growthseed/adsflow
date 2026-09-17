/**
 * Grava no Vercel (production) os segredos que o cron de performance usa,
 * lendo dos arquivos locais — nenhum valor é impresso no terminal.
 *
 *   node scripts/push-sync-secrets.mjs
 *
 * Fontes:
 *   META_ACCESS_TOKEN              ← ~/.claude/secrets/meta_efeito_system_user.json (System User "Claude", permanente)
 *   GOOGLE_ADS_SYNC_REFRESH_TOKEN  ← arquivo GOOGLE_ADS_CREDENTIALS_PATH do MCP googleAdsServer (~/.claude.json)
 *   GOOGLE_ADS_SYNC_CLIENT_SECRET  ← idem
 *
 * Depois de rodar, faça um novo deploy: variáveis só entram em deploys novos.
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const home = os.homedir()
const meta = readFileSync(`${home}/.claude/secrets/meta_efeito_system_user.json`, 'utf8').match(/EAA[A-Za-z0-9]{60,}/)?.[0]
const cfg = JSON.parse(readFileSync(`${home}/.claude.json`, 'utf8'))
const mcpEnv = cfg.mcpServers.googleAdsServer.env
const google = JSON.parse(readFileSync(mcpEnv.GOOGLE_ADS_CREDENTIALS_PATH, 'utf8'))
if (!meta || !google.refresh_token || !google.client_secret || !mcpEnv.GOOGLE_ADS_DEVELOPER_TOKEN) throw new Error('Credenciais locais não encontradas.')

// GOOGLE_ADS_DEVELOPER_TOKEN também estava vazio no Vercel — vem do env do MCP googleAdsServer.
const secrets = {
  META_ACCESS_TOKEN: meta,
  GOOGLE_ADS_SYNC_REFRESH_TOKEN: google.refresh_token,
  GOOGLE_ADS_SYNC_CLIENT_SECRET: google.client_secret,
  GOOGLE_ADS_DEVELOPER_TOKEN: mcpEnv.GOOGLE_ADS_DEVELOPER_TOKEN,
}
for (const [name, value] of Object.entries(secrets)) {
  spawnSync('npx', ['vercel', 'env', 'rm', name, 'production', '--yes'], { stdio: 'ignore', shell: true })
  const add = spawnSync('npx', ['vercel', 'env', 'add', name, 'production'], { input: value, encoding: 'utf8', shell: true })
  const line = (add.stderr + add.stdout).split('\n').filter(Boolean).pop() ?? ''
  console.log(`${name}: ${add.status === 0 ? 'ok' : 'FALHOU'} — ${line.replace(value, '<valor>').trim()}`)
}
console.log('\nAgora faça o deploy (git push na main) para o cron usar os novos valores.')
