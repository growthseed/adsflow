/**
 * Vite plugin · serve os handlers em `api/*.ts` durante `npm run dev`,
 * sem exigir `vercel dev`. Em prod, o Vercel continua executando os
 * handlers normalmente — esse plugin só ativa em dev.
 *
 * Como funciona:
 *   1. `configureServer` registra um middleware no Connect do Vite
 *   2. Toda request que bate em `/api/<rota>` mapeia para o arquivo
 *      correspondente em `api/<rota>.ts` (via import dinâmico)
 *   3. Constrói objetos req/res compatíveis com `VercelRequest/Response`
 *      a partir dos objetos Node nativos — é o mesmo shape.
 *
 * Limitação: não suporta dynamic routes `[id].ts` — só caminhos
 * estáticos. Suficiente para nossos endpoints.
 */

import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve as pathResolve, join as pathJoin } from 'node:path'

interface VercelLikeRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>
  body?: unknown
}

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k) out[k] = decodeURIComponent(rest.join('='))
  }
  return out
}

function parseQuery(search: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  const sp = new URLSearchParams(search)
  for (const key of Array.from(new Set(sp.keys()))) {
    const all = sp.getAll(key)
    out[key] = all.length > 1 ? all : all[0] ?? ''
  }
  return out
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => {
      const buf = Buffer.concat(chunks)
      if (buf.length === 0) return resolve(undefined)
      const ct = req.headers['content-type'] ?? ''
      const raw = buf.toString('utf-8')
      if (ct.includes('application/json')) {
        try {
          resolve(JSON.parse(raw))
        } catch {
          resolve(raw)
        }
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        resolve(Object.fromEntries(new URLSearchParams(raw).entries()))
      } else {
        resolve(raw)
      }
    })
    req.on('error', reject)
  })
}

function enhanceResponse(res: ServerResponse): ServerResponse & {
  status: (n: number) => ServerResponse & { json: (body: unknown) => void; send: (b: unknown) => void; end: () => void }
  json: (body: unknown) => void
  send: (body: unknown) => void
} {
  const self = res as unknown as ServerResponse & {
    status: (n: number) => ServerResponse & {
      json: (body: unknown) => void
      send: (b: unknown) => void
      end: () => void
    }
    json: (body: unknown) => void
    send: (body: unknown) => void
  }
  self.status = (code: number) => {
    res.statusCode = code
    return self
  }
  self.json = (body: unknown) => {
    if (!res.getHeader('content-type')) res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(body))
  }
  self.send = (body: unknown) => {
    if (typeof body === 'object' && body !== null) {
      self.json(body)
    } else {
      res.end(body == null ? '' : String(body))
    }
  }
  return self
}

async function resolveHandler(apiDir: string, pathname: string, server?: ViteDevServer): Promise<unknown> {
  const relative = pathname.replace(/^\/api\//, '').replace(/\/+$/, '')
  if (!relative) return null

  const candidates = [
    pathJoin(apiDir, `${relative}.ts`),
    pathJoin(apiDir, `${relative}.js`),
    pathJoin(apiDir, relative, 'index.ts'),
    pathJoin(apiDir, relative, 'index.js'),
  ]
  for (const file of candidates) {
    if (existsSync(file)) {
      const url = pathToFileURL(file).href + `?t=${Date.now()}`
      let mod: Record<string, unknown>
      try {
        mod = await import(/* @vite-ignore */ url)
      } catch (err) {
        // Handlers importam `../src/server/*.js` (convencao NodeNext, o
        // Vercel compila TS). O import nativo do Node nao mapeia `.js` ->
        // `.ts`; o resolver do Vite mapeia — usa ele como fallback.
        const code = (err as { code?: string }).code
        if (!server || (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'ERR_UNKNOWN_FILE_EXTENSION')) throw err
        mod = await server.ssrLoadModule(file)
      }
      return mod.default ?? mod.handler ?? mod
    }
  }
  return null
}

/**
 * Activates in dev. Production builds simply ignore this plugin.
 */
export function devApiPlugin(options: { apiDir?: string } = {}): Plugin {
  const apiDir = options.apiDir ?? pathResolve(process.cwd(), 'api')

  return {
    name: 'adsflow-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()

        try {
          const parsed = new URL(url, 'http://localhost')
          const handler = (await resolveHandler(apiDir, parsed.pathname, server)) as
            | ((req: VercelLikeRequest, res: ServerResponse) => unknown)
            | null

          if (typeof handler !== 'function') {
            res.statusCode = 404
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'handler not found', path: parsed.pathname }))
            return
          }

          // Enriquece req com .query e .body (estilo Vercel)
          const body = req.method && req.method !== 'GET' && req.method !== 'HEAD'
            ? await readBody(req)
            : undefined
          const enhanced = Object.assign(req, {
            query: parseQuery(parsed.search),
            body,
            cookies: parseCookies(req.headers.cookie as string | undefined),
          }) as unknown as VercelLikeRequest

          const enhancedRes = enhanceResponse(res)
          await handler(enhanced, enhancedRes)
        } catch (err) {
          console.error('[dev-api] handler error:', err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'dev-api handler crashed',
                detail: err instanceof Error ? err.message : String(err),
              }),
            )
          }
        }
      })
    },
  }
}
