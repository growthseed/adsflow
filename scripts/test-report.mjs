import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

// Execute isolated TS modules with explicit dependency doubles; never call live APIs.
function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((id) => {
    assert.ok(id in dependencies, `Unexpected dependency: ${id}`)
    return dependencies[id]
  }, module, module.exports)
  return module.exports
}

const { dateKey, weekDays, filterReportTasks, isOverdue, summarizeMedia } = loadModule('src/features/reports/reportModel.ts')
const reference = new Date(2026, 8, 15, 12)
const filters = { status: 'all', assignee: 'all', window: 'all', search: '' }
const task = (id, due_date, status = 'in_progress', assignees = []) => ({ id, due_date, status, assignees, title: `Task ${id}`, list_name: 'Campanhas' })
const tasks = [task('late', '2026-09-10'), task('today', '2026-09-15', 'review', [{ id: 'ana' }]), task('sunday', '2026-09-20'), task('next', '2026-09-21'), task('undated', null), task('done', '2026-09-01', 'done')]

test('week starts Monday, includes Sunday and crosses month/year boundaries', () => {
  assert.equal(dateKey(reference), '2026-09-15')
  assert.deepEqual(weekDays(new Date(2026, 8, 20)).map(x => x.date), ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'])
  assert.equal(weekDays(new Date(2027, 0, 1))[0].date, '2026-12-28')
})
test('overdue excludes completed tasks and deadlines today', () => {
  assert.equal(isOverdue(tasks[1], dateKey(reference)), false)
  assert.equal(isOverdue(tasks[5], dateKey(reference)), false)
  assert.deepEqual(filterReportTasks(tasks, { ...filters, window: 'overdue' }, reference).map(x => x.id), ['late'])
})
test('filters intersect and search includes list name', () => {
  assert.deepEqual(filterReportTasks(tasks, { ...filters, window: 'week' }, reference).map(x => x.id), ['today', 'sunday'])
  assert.deepEqual(filterReportTasks(tasks, { ...filters, window: 'week', assignee: 'ana', status: 'review', search: 'CAMPANHAS' }, reference).map(x => x.id), ['today'])
  assert.equal(filterReportTasks(tasks, { ...filters, assignee: 'unassigned' }, reference).some(x => x.id === 'today'), false)
  assert.deepEqual(filterReportTasks(tasks, { ...filters, window: 'undated' }, reference).map(x => x.id), ['undated'])
})
test('sorting prioritizes overdue without mutating the source', () => {
  const input = [...tasks].reverse()
  const order = input.map(x => x.id)
  assert.equal(filterReportTasks(input, filters, reference)[0].id, 'late')
  assert.deepEqual(input.map(x => x.id), order)
  assert.deepEqual(filterReportTasks([], filters, reference), [])
})
const account = (platform, spend, conversions, clicks, impressions) => ({
  platform, connected: true, summary: { spend, conversions, clicks, impressions }, campaigns: [],
  daily: [{ date: '2026-09-15', spend, conversions }],
})
const performance = { platforms: { meta_ads: account('meta_ads', 100, 5, 10, 1000), google_ads: account('google_ads', 200, 5, 30, 1000) } }
test('media totals use weighted ratios and merge daily dates', () => {
  const result = summarizeMedia(performance, 'all')
  assert.equal(result.spend, 300)
  assert.equal(result.cpa, 30)
  assert.equal(result.ctr, 2)
  assert.deepEqual(result.daily, [{ date: '2026-09-15', spend: 300, conversions: 10 }])
  assert.equal(summarizeMedia(performance, 'meta_ads').spend, 100)
})
test('unavailable media and zero denominators are not invented metrics', () => {
  assert.equal(summarizeMedia(null, 'all').cpa, null)
  assert.equal(summarizeMedia(null, 'all').ctr, null)
  assert.equal(summarizeMedia({ platforms: { meta_ads: { ...performance.platforms.meta_ads, connected: false } } }, 'all').accounts.length, 0)
})

function clientService(responses) {
  const calls = []
  const supabase = { from(table) {
    const call = { table, filters: [] }; calls.push(call)
    const query = {
      select(value) { call.select = value; return query },
      eq(...args) { call.filters.push(['eq', ...args]); return query },
      in(...args) { call.filters.push(['in', ...args]); return query },
      order() { return query },
      then(resolve, reject) { return Promise.resolve(responses.shift()).then(resolve, reject) },
    }
    return query
  } }
  return { calls, service: loadModule('src/services/clientsService.ts', { '@/lib/supabase': { default: supabase } }).clientsService }
}
test('agency catalogue uses only the caller membership role, not another person role', async () => {
  const { calls, service } = clientService([{ data: [{ id: 'dale' }, { id: 'momma' }] }, { data: [{ client_id: 'dale', role: 'manager' }] }, { data: [{ client_id: 'dale' }, { client_id: 'dale' }] }])
  const result = await service.list('staff-id', { includeAllActive: true })
  assert.ok(calls[0].filters.some(x => x[1] === 'status' && x[2] === 'active'))
  assert.ok(calls[1].filters.some(x => x[1] === 'user_id' && x[2] === 'staff-id'))
  assert.deepEqual(result.map(x => x.my_role), ['manager', 'admin'])
  assert.deepEqual(result.map(x => x.member_count), [2, 0])
})
test('empty catalogue does not issue an empty IN query', async () => {
  const { calls, service } = clientService([{ data: [] }])
  assert.deepEqual(await service.list('staff-id', { includeAllActive: true }), [])
  assert.equal(calls.length, 1)
})
test('regular users are limited to their client ids', async () => {
  const { calls, service } = clientService([{ data: [{ client_id: 'dale', role: 'viewer' }] }, { data: [{ id: 'dale' }] }, { data: [] }])
  assert.equal((await service.list('user-id'))[0].my_role, 'viewer')
  assert.ok(calls[1].filters.some(x => x[0] === 'in' && x[1] === 'id' && x[2].join() === 'dale'))
})

async function syncRequest({ method = 'POST', role = 'admin', active = true, cron = false, authenticated = true } = {}) {
  let fetched = false
  const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this }, end() {} }
  const profileQuery = { select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: { is_active: active } }) }
  const handler = loadModule('api/sync/clickup.ts', {
    '../../src/server/sync/config.js': { setCommonHeaders() {}, requireCronAuth: (_req, response) => { if (!cron) response.status(401).json({ error: 'Unauthorized' }); return cron }, insertSnapshot: async () => ({ ok: true, id: 'snapshot' }) },
    '../../src/server/sync/clickupFetcher.js': { fetchClickUpSnapshot: async () => { fetched = true; return { clients: [], aggregate: {} } } },
    '../_lib/security.js': { requireUserAuth: async (_req, response) => { if (!authenticated) { response.status(401).json({}); return null }; return { globalRole: role, user: { id: 'staff' }, serviceClient: { from: () => profileQuery } } } },
  }).default
  await handler({ method, headers: {} }, res)
  return { fetched, status: res.statusCode }
}
test('active agency admin can manually sync', async () => assert.deepEqual(await syncRequest(), { fetched: true, status: 200 }))
test('regular and inactive users cannot sync the agency', async () => {
  assert.deepEqual(await syncRequest({ role: 'user' }), { fetched: false, status: 403 })
  assert.deepEqual(await syncRequest({ active: false }), { fetched: false, status: 403 })
  assert.deepEqual(await syncRequest({ authenticated: false }), { fetched: false, status: 401 })
})
test('cron GET stays protected and unsupported methods fail', async () => {
  assert.deepEqual(await syncRequest({ method: 'GET' }), { fetched: false, status: 401 })
  assert.deepEqual(await syncRequest({ method: 'GET', cron: true }), { fetched: true, status: 200 })
  assert.deepEqual(await syncRequest({ method: 'DELETE' }), { fetched: false, status: 405 })
})
