import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import crypto, { randomUUID } from 'node:crypto'
import ts from 'typescript'
import dagre from '@dagrejs/dagre'

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(id => {
    assert.ok(id in dependencies, `Unexpected dependency ${id}`)
    return dependencies[id]
  }, module, module.exports)
  return module.exports
}
const model = load('src/components/Planner/plannerModel.ts', { '@xyflow/react': { MarkerType: { ArrowClosed: 'arrowclosed' } }, '@dagrejs/dagre': dagre })
const node = (id, extra = {}) => ({ id, type: 'clientLogo', data: { size: 'M' }, position: { x: 0, y: 0 }, ...extra })

// ---------------------------------------------------------------- modelo
test('logos have square bounds at all presets; existing circular nodes are untouched', () => {
  for (const [size, px] of Object.entries(model.LOGO_SIZES)) {
    const result = model.normalizeLogo(node('logo', { data: { size }, width: 440, height: 240 }))
    assert.equal(result.width, px); assert.equal(result.height, px)
    assert.deepEqual(result.style, { width: px, height: px })
  }
  assert.equal(model.logoSize('unknown'), 88)
  const original = node('brand', { type: 'brand', width: 112, height: 112 })
  assert.equal(model.normalizeLogo(original), original)
})
test('deleting a selection removes incident and selected edges without mutating input', () => {
  const nodes = [node('a', { selected: true }), node('b'), node('c')]
  const edges = [{ id: 'ab', source: 'a', target: 'b' }, { id: 'bc', source: 'b', target: 'c' }, { id: 'cb', source: 'c', target: 'b', selected: true }]
  const result = model.removeSelection(nodes, edges)
  assert.deepEqual(result.nodes.map(n => n.id), ['b', 'c'])
  assert.deepEqual(result.edges.map(e => e.id), ['bc'])
  assert.equal(nodes.length, 3); assert.equal(edges.length, 3)
})
test('alignment respects dimensions, gaps and unselected nodes', () => {
  const a = node('a', { selected: true, width: 88, position: { x: 10, y: 60 } })
  const b = node('b', { selected: true, width: 112, position: { x: 80, y: 20 } })
  const c = node('c')
  const result = model.alignSelection([a, b, c], 'horizontal')
  assert.deepEqual(result[0].position, { x: 10, y: 20 })
  assert.deepEqual(result[1].position, { x: 162, y: 20 })
  assert.equal(result[2], c)
  assert.deepEqual(a.position, { x: 10, y: 60 })
})
test('collapsing stages hides edges without deleting underlying flow data', () => {
  const nodes = [node('a', { data: { stage: 'Venda' } }), node('b')]
  const edges = [{ id: 'ab', source: 'a', target: 'b' }]
  assert.deepEqual(model.visibleFlow(nodes, edges, new Set(['Venda'])).nodes.map(n => n.id), ['b'])
  assert.equal(model.visibleFlow(nodes, edges, new Set(['Venda'])).edges.length, 0)
  assert.equal(model.visibleFlow(nodes, edges, new Set()).edges.length, 1)
  assert.equal(nodes.length, 2)
})

// ------------------------------------------------------------ auto-layout
test('auto-layout orders a chain along the chosen axis without overlaps and leaves child nodes alone', () => {
  const nodes = [node('c', { type: 'campaign', width: 220, height: 120, position: { x: 900, y: 5 } }), node('a', { width: 88, height: 88, position: { x: 500, y: 500 } }), node('b', { type: 'brand', width: 112, height: 112 }), node('child', { parentId: 'c', position: { x: 4, y: 4 } })]
  const edges = [{ id: 'ab', source: 'a', target: 'b' }, { id: 'bc', source: 'b', target: 'c' }]
  const lr = Object.fromEntries(model.autoLayout(nodes, edges, 'LR').map(n => [n.id, n.position]))
  assert.ok(lr.a.x + 88 < lr.b.x && lr.b.x + 112 < lr.c.x, `expected a<b<c on x, got ${JSON.stringify(lr)}`)
  assert.deepEqual(lr.child, { x: 4, y: 4 })
  for (const [id, p] of Object.entries(lr)) if (id !== "child") { assert.equal(p.x % 16, 0); assert.equal(p.y % 16, 0) }
  const tb = Object.fromEntries(model.autoLayout(nodes, edges, 'TB').map(n => [n.id, n.position]))
  assert.ok(tb.a.y + 88 < tb.b.y && tb.b.y + 112 < tb.c.y)
  assert.deepEqual(nodes[0].position, { x: 900, y: 5 })
  assert.equal(model.autoLayout([], []).length, 0)
})

// ------------------------------------------------- copiar / colar / duplicar
test('copy keeps only the selection and its internal edges, relative to the top-left corner', () => {
  const nodes = [node('a', { selected: true, position: { x: 100, y: 40 } }), node('b', { selected: true, position: { x: 300, y: 80 } }), node('c', { position: { x: 0, y: 0 } })]
  const edges = [{ id: 'ab', source: 'a', target: 'b' }, { id: 'bc', source: 'b', target: 'c' }]
  const payload = model.copySelection(nodes, edges)
  assert.deepEqual(payload.nodes.map(n => [n.id, n.position, n.selected]), [['a', { x: 0, y: 0 }, false], ['b', { x: 200, y: 40 }, false]])
  assert.deepEqual(payload.edges.map(e => e.id), ['ab'])
  assert.equal(model.copySelection([node('x')], []), null)
})
test('paste and duplicate mint new ids, remap edges and select only the new nodes', () => {
  const nodes = [node('a', { selected: true, position: { x: 100, y: 40 }, data: { size: 'S', label: 'A' } }), node('b', { selected: true, position: { x: 300, y: 80 } })]
  const edges = [{ id: 'ab', source: 'a', target: 'b', data: { icon: 'click' } }]
  const result = model.duplicateSelection(nodes, edges)
  assert.equal(result.nodes.length, 4); assert.equal(result.edges.length, 2)
  const pasted = result.nodes.slice(2)
  assert.ok(pasted.every(n => n.selected && !['a', 'b'].includes(n.id)))
  assert.ok(result.nodes.slice(0, 2).every(n => !n.selected))
  assert.deepEqual(pasted[0].position, { x: 148, y: 88 }); assert.deepEqual(pasted[1].position, { x: 348, y: 128 })
  const copy = result.edges[1]
  assert.equal(copy.source, pasted[0].id); assert.equal(copy.target, pasted[1].id); assert.notEqual(copy.id, 'ab')
  copy.data.icon = 'mail'; assert.equal(edges[0].data.icon, 'click')
  pasted[0].data.label = 'changed'; assert.equal(nodes[0].data.label, 'A')
  const placed = model.pasteSelection(nodes, edges, model.copySelection(nodes, edges), { x: 1000, y: 2000 })
  assert.deepEqual(placed.nodes[2].position, { x: 1000, y: 2000 })
})

// ---------------------------------------------------------------- conexões
test('edges animate when selected, flagged or attached to a selected node; metrics hide when live data is off', () => {
  const nodes = [node('a', { selected: true }), node('b'), node('c')]
  const edges = [
    { id: 'ab', source: 'a', target: 'b', data: { conversionRate: 60, conversions: 12 } },
    { id: 'bc', source: 'b', target: 'c', data: {} },
    { id: 'cb', source: 'c', target: 'b', data: { animated: true, color: '#db2777' } },
    { id: 'sel', source: 'b', target: 'c', selected: true },
  ]
  const off = model.decorateEdges(edges, nodes, { liveData: false })
  assert.deepEqual(off.map(e => e.animated), [true, false, true, true])
  assert.ok(off.every(e => e.type === 'conversionEdge' && e.data.hideMetrics === true))
  assert.equal(off[0].data.active, true); assert.equal(off[1].data.active, false)
  assert.equal(off[2].markerEnd.color, '#db2777')
  assert.equal(off[3].markerEnd.color, '#347a61')
  const on = model.decorateEdges(edges, nodes, { liveData: true })
  assert.equal(on[0].data.hideMetrics, false); assert.equal(on[0].markerEnd.color, '#22c55e')
  assert.equal(model.decorateEdges(edges, nodes, { liveData: false, animateAll: true }).every(e => e.animated), true)
  assert.equal(edges[1].animated, undefined)
})
test('edge icon catalog has unique keys and a readable label for each', () => {
  const keys = model.EDGE_ICONS.map(i => i.key)
  assert.equal(new Set(keys).size, keys.length)
  assert.ok(model.EDGE_ICONS.every(i => i.label.length > 2))
  assert.equal(model.edgeColor({ conversionRate: 5, hideMetrics: false }), '#ef4444')
  assert.equal(model.edgeColor({ conversionRate: 5, hideMetrics: true }), '#94a3b8')
})

// ------------------------------------------------------------- miniaturas
test('thumbnail requests are only issued for page nodes with a public URL and no capture for that URL', () => {
  const page = url => node('p', { type: 'landingPage', data: { url } })
  assert.equal(model.thumbnailRequest(node('x', { type: 'campaign', data: { url: 'https://a.com' } })), null)
  assert.equal(model.thumbnailRequest(page('')), null)
  assert.equal(model.thumbnailRequest(page('ftp://a.com')), null)
  assert.deepEqual(model.thumbnailRequest(page('https://a.com/lp')), { url: 'https://a.com/lp', refresh: false })
  const done = model.applyThumbnail(page('https://a.com/lp'), 'https://a.com/lp', 'https://cdn/shot.jpg')
  assert.equal(model.thumbnailRequest(done), null)
  assert.equal(done.data.thumbnail, 'https://cdn/shot.jpg'); assert.ok(done.data.thumbnailAt)
  assert.deepEqual(model.thumbnailRequest({ ...done, data: { ...done.data, url: 'https://a.com/other' } }), { url: 'https://a.com/other', refresh: false })
  const failed = model.failThumbnail(page('https://a.com/lp'), 'https://a.com/lp')
  assert.equal(model.thumbnailRequest(failed), null)
  assert.deepEqual(model.thumbnailRequest(model.requestThumbnailRefresh(failed)), { url: 'https://a.com/lp', refresh: true })
  const dirty = [{ ...done, data: { ...done.data, thumbnailPending: true, thumbnailRefresh: true } }, node('keep')]
  const cleaned = model.cleanForSave(dirty)
  assert.ok(!('thumbnailPending' in cleaned[0].data) && !('thumbnailRefresh' in cleaned[0].data))
  assert.equal(cleaned[0].data.thumbnail, 'https://cdn/shot.jpg'); assert.equal(cleaned[1], dirty[1])
})

// ------------------------------------------------------- backend: assets
function backend({ role = 'viewer', member = true, active = true, granted = false, override, failOverrides = false, staff = false, authenticated = true, files = [], fetchImpl } = {}) {
  const calls = []; const uploads = []; const lists = []
  const storage = {
    getPublicUrl: path => ({ data: { publicUrl: `https://assets.example/${path}` } }),
    upload: async (...args) => { uploads.push(args); return { error: null } },
    list: async (...args) => { lists.push(args); return { data: files, error: null } },
  }
  const serviceClient = { storage: { from: bucket => { assert.equal(bucket, 'client-logos'); return storage } }, from(table) {
    const call = { table, filters: [] }; calls.push(call)
    const query = { select() { return query }, eq(...args) { call.filters.push(args); return query }, async maybeSingle() {
      return { error: table === 'client_role_overrides' && failOverrides ? { message: 'unavailable' } : null, data: {
        users: { is_active: active }, clients: { id: 'client-a', name: 'Cliente A', logo_url: null }, client_members: member ? { role } : null,
        permissions: { id: 'planner-permission' }, client_role_overrides: override === undefined ? null : { is_granted: override }, role_permissions: granted ? { permission_id: 'planner-permission' } : null,
      }[table] }
    } }; return query
  } }
  const security = {
    applyCors: () => true, allowMethods: () => true,
    requireUserAuth: async (_req, res) => { if (!authenticated) { res.status(401).json({ error: 'Unauthorized' }); return null } return { user: { id: 'user-a' }, serviceClient, globalRole: staff ? 'admin' : 'client' } },
  }
  const assets = load('src/server/integrations/planner-assets.ts', { 'node:crypto': { randomUUID }, '../../../api/_lib/security.js': security })
  const shots = load('src/server/integrations/planner-screenshot.ts', { 'node:crypto': crypto, '../../../api/_lib/security.js': security, './planner-assets.js': assets })
  const response = () => ({ statusCode: 200, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v }, status(code) { this.statusCode = code; return this }, json(value) { this.body = value; return this } })
  async function run(method = 'GET', body) { const res = response(); await assets.runPlannerAssets({ method, query: { client_slug: 'client-a' }, body }, res); return res }
  async function shot(query) { const res = response(); await shots.runPlannerScreenshot({ method: 'GET', query: { client_slug: 'client-a', ...query } }, res, fetchImpl); return res }
  return { ...assets, ...shots, run, shot, calls, uploads, lists }
}
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK1sAAAAASUVORK5CYII='
test('decoder accepts a PNG and rejects SVG, forged MIME and oversize payloads', () => {
  const { decodeLogo } = backend()
  assert.equal(decodeLogo(png).contentType, 'image/png')
  assert.throws(() => decodeLogo('data:image/svg+xml;base64,PHN2Zz4='))
  assert.throws(() => decodeLogo('data:image/png;base64,' + Buffer.from('not an image at all').toString('base64')))
  assert.throws(() => decodeLogo('a'.repeat(2800001)))
})
test('unauthenticated, inactive and nonmember access never reaches storage', async () => {
  for (const [options, status] of [[{ authenticated: false }, 401], [{ active: false }, 403], [{ member: false }, 403]]) {
    const api = backend(options); assert.equal((await api.run()).statusCode, status)
    assert.equal(api.lists.length + api.uploads.length, 0)
  }
})
test('a member with read permission lists only their client directory', async () => {
  const api = backend({ granted: true }); const res = await api.run()
  assert.equal(res.statusCode, 200); assert.equal(res.headers['Cache-Control'], 'private, no-store')
  assert.equal(api.lists[0][0], 'client-a/planner')
  assert.ok(api.calls.find(c => c.table === 'client_members').filters.some(f => f[0] === 'client_id' && f[1] === 'client-a'))
})
test('write is denied by default and explicit revocations beat role grants', async () => {
  for (const options of [{}, { granted: true, override: false }, { granted: true, failOverrides: true }]) {
    const api = backend(options); assert.equal((await api.run('POST', { image: png })).statusCode, 403)
    assert.equal(api.uploads.length, 0)
  }
})
test('authorized upload validates MIME, client prefix and non-overwriting storage', async () => {
  const api = backend({ granted: true, role: 'manager' })
  const res = await api.run('POST', { image: png, name: '../Cliente A' })
  assert.equal(res.statusCode, 201)
  assert.match(api.uploads[0][0], /^client-a\/planner\/[a-f0-9-]+_Cliente A\.png$/)
  assert.deepEqual(api.uploads[0][2], { contentType: 'image/png', upsert: false })
  assert.ok(api.calls.find(c => c.table === 'permissions').filters.some(f => f[0] === 'action' && f[1] === 'write'))
})

// --------------------------------------------------- backend: screenshots
const jpeg = Buffer.concat([Buffer.from([255, 216, 255, 224]), Buffer.alloc(2000, 1)])
function microlink({ shotUrl = 'https://iad.microlink.io/abc.jpeg', apiStatus = 200, imageBody = jpeg, pageStatus = 200, finalUrl } = {}) {
  const requests = []
  return { requests, fetch: async (input) => {
    const url = String(input); requests.push(url)
    if (url.startsWith('https://api.microlink.io/')) return { ok: apiStatus === 200, status: apiStatus, json: async () => apiStatus === 200 ? { status: 'success', statusCode: pageStatus, data: { url: finalUrl ?? new URL(url).searchParams.get('url'), screenshot: { url: shotUrl } } } : { status: 'fail', message: 'quota' } }
    return { ok: true, status: 200, arrayBuffer: async () => imageBody }
  } }
}
test('page URLs must be public http(s): localhost, raw IPs and other schemes are rejected', () => {
  const { normalizePageUrl, screenshotKey } = backend()
  assert.equal(normalizePageUrl('https://www.efeito.digital/lp#x'), 'https://www.efeito.digital/lp')
  for (const bad of ['http://localhost:3000', 'http://127.0.0.1/', 'http://10.0.0.1/admin', 'ftp://a.com', 'javascript:alert(1)', 'http://intranet', 'http://host.internal/', 42, 'a'.repeat(3000)]) assert.equal(normalizePageUrl(bad), null, String(bad))
  assert.equal(screenshotKey('https://a.com/'), screenshotKey('https://a.com/'))
  assert.notEqual(screenshotKey('https://a.com/'), screenshotKey('https://a.com/b'))
})
test('a cached screenshot is served from the client folder without calling the provider', async () => {
  const provider = microlink()
  const api = backend({ granted: true, fetchImpl: provider.fetch, files: [{ name: `${backend().screenshotKey('https://a.com/lp')}.jpg`, updated_at: '2026-09-17T10:00:00Z' }] })
  const res = await api.shot({ url: 'https://a.com/lp' })
  assert.equal(res.statusCode, 200); assert.equal(res.body.cached, true)
  assert.match(res.body.url, /^https:\/\/assets\.example\/client-a\/planner\/shots\/[a-f0-9]{24}\.jpg\?v=2026/)
  assert.equal(api.lists[0][0], 'client-a/planner/shots'); assert.equal(provider.requests.length, 0); assert.equal(api.uploads.length, 0)
})
test('a cache miss captures through Microlink and stores the JPEG under the client prefix', async () => {
  const provider = microlink()
  const api = backend({ granted: true, fetchImpl: provider.fetch })
  const res = await api.shot({ url: 'https://a.com/lp' })
  assert.equal(res.statusCode, 200, JSON.stringify(res.body)); assert.equal(res.body.cached, false)
  assert.match(provider.requests[0], /^https:\/\/api\.microlink\.io\/\?url=https%3A%2F%2Fa\.com%2Flp&screenshot=true/)
  assert.equal(provider.requests[1], 'https://iad.microlink.io/abc.jpeg')
  assert.match(api.uploads[0][0], /^client-a\/planner\/shots\/[a-f0-9]{24}\.jpg$/)
  assert.equal(api.uploads[0][2].contentType, 'image/jpeg'); assert.equal(api.uploads[0][2].upsert, true)
})
test('provider failures, untrusted image hosts and bad images return 502 without touching storage', async () => {
  for (const options of [{ apiStatus: 429 }, { shotUrl: 'https://evil.example/x.jpg' }, { imageBody: Buffer.from('nope') }]) {
    const provider = microlink(options)
    const api = backend({ granted: true, fetchImpl: provider.fetch })
    const res = await api.shot({ url: 'https://a.com/lp' })
    assert.equal(res.statusCode, 502, JSON.stringify(options)); assert.equal(api.uploads.length, 0)
  }
  const api = backend({ granted: true, fetchImpl: microlink().fetch })
  assert.equal((await api.shot({ url: 'http://localhost/' })).statusCode, 400)
})
test('error pages and redirect loops are refused instead of cached as a browser error screen', async () => {
  for (const [options, fragment] of [[{ pageStatus: 404 }, 'HTTP 404'], [{ pageStatus: 503 }, 'HTTP 503'], [{ pageStatus: 301 }, 'loop']]) {
    const api = backend({ granted: true, fetchImpl: microlink(options).fetch })
    const res = await api.shot({ url: 'https://www.a.com/' })
    assert.equal(res.statusCode, 502); assert.match(res.body.error, new RegExp(fragment)); assert.equal(api.uploads.length, 0)
  }
  const followed = backend({ granted: true, fetchImpl: microlink({ pageStatus: 301, finalUrl: 'https://a.com/' }).fetch })
  assert.equal((await followed.shot({ url: 'https://www.a.com/' })).statusCode, 200)
})
test('refreshing a screenshot requires write permission; plain reads only need read', async () => {
  const provider = microlink()
  const reader = backend({ granted: true, fetchImpl: provider.fetch, override: false })
  assert.equal((await reader.shot({ url: 'https://a.com/lp', refresh: '1' })).statusCode, 403)
  assert.equal(reader.uploads.length, 0)
  const writer = backend({ granted: true, fetchImpl: provider.fetch, files: [{ name: 'stale.jpg' }] })
  const res = await writer.shot({ url: 'https://a.com/lp', refresh: '1' })
  assert.equal(res.statusCode, 200); assert.equal(res.body.cached, false); assert.equal(writer.lists.length, 0)
  assert.ok(writer.calls.find(c => c.table === 'permissions').filters.some(f => f[0] === 'action' && f[1] === 'write'))
})

// --------------------------------------------------------- public portal
test('public portal reads the newest snapshots and returns only the token client', async () => {
  const previousUrl = process.env.VITE_SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.VITE_SUPABASE_URL = 'https://supabase.example'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-only'
  const calls = []
  const client = {
    rpc: async (name, args) => {
      calls.push([name, args])
      if (name === 'resolve_portal_token') return { data: { slug: 'momma', name: 'Momma', logo_url: null, industry: null }, error: null }
      if (args.snapshot_kind === 'clickup') return { data: { clients: [
        { slug: 'momma', task_count: 1, last_synced_at: '2026-09-17T14:37:29Z', stats: { done: 0, in_progress: 1, review: 0, upcoming: 0, backlog: 0, urgent: 0 }, all_tasks: [{ id: 'new-task', title: 'Atualização recém-criada', status: 'in_progress', list_name: 'Momma', url: 'https://app.clickup.com/t/new-task' }] },
        { slug: 'other-client', task_count: 99, all_tasks: [] },
      ] }, error: null }
      return { data: { clients: { momma: { blended: { total_spend: 100, total_conversions: 2, total_clicks: 10, total_impressions: 1000 }, platforms: {}, period: { label: 'Últimos 30 dias' }, last_synced_at: '2026-09-17T14:00:00Z' } } }, error: null }
    },
  }
  const api = load('src/server/integrations/public-portal.ts', { '@supabase/supabase-js': { createClient: () => client }, '../../../api/_lib/security.js': { applyCors: () => true, allowMethods: () => true } })
  const res = { statusCode: 200, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v }, status(code) { this.statusCode = code; return this }, json(value) { this.body = value; return this } }
  await api.runPublicPortal({ method: 'GET', query: { token: 'portal-token-with-valid-length-123' } }, res)
  if (previousUrl === undefined) delete process.env.VITE_SUPABASE_URL; else process.env.VITE_SUPABASE_URL = previousUrl
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey
  assert.equal(res.statusCode, 200, JSON.stringify(res.body))
  assert.equal(res.headers['Cache-Control'], 'no-store, no-cache, must-revalidate')
  assert.equal(res.body.client.slug, 'momma')
  assert.deepEqual(res.body.data.tasks.map(task => task.id), ['new-task'])
  assert.equal(res.body.data.tasks[0].title, 'Atualização recém-criada')
  assert.equal(res.body.data.leads, 2)
  assert.deepEqual(calls.map(([name]) => name), ['resolve_portal_token', 'latest_agency_snapshot', 'latest_agency_snapshot'])
})
