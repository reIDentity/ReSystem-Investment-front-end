import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { proxyConfig } from '../src/lib/platform/proxy.ts';

const require = createRequire(import.meta.url), ts = require('typescript');
const source = readFileSync(new URL('../src/lib/platform/home-stats.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const empty = { openProducts: null, revenueLast30DaysUsd: null, soldPercent: null, minimumInvestmentUsd: null };
const id = n => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const project = (n, price = '2500000') => ({ id: id(n), status: 'PUBLISHED', unitPriceUsdtAtomic: price });
const chain = changes => ({ chainId: 15324, saleOpen: true, purchasePaused: false, totalSupply: '10', maxFractions: '100', ...changes });
const revenue = (usdt = '0', reaed = '0') => ({ series: { status: 'available', chainId: 15324, assets: [{ asset: 'USDT', decimals: 6, last30DaysAtomic: usdt }, { asset: 'REAED', decimals: 18, last30DaysAtomic: reaed }] } });
const normalize = value => JSON.parse(JSON.stringify(value));
function loader(fetcher, { signals = AbortSignal, env = { PLATFORM_API_BASE: 'https://public.example.invalid/v1', PLATFORM_APP_ORIGIN: 'https://investor.example.invalid' } } = {}) {
  const localModule = { exports: {} }, cacheProfiles = [];
  vm.runInNewContext(code, {
    module: localModule, exports: localModule.exports,
    require(name) {
      if (name === 'server-only') return {};
      if (name === 'next/cache') return { cacheLife: profile => cacheProfiles.push(profile) };
      if (name === './proxy') return { proxyConfig };
      throw Error('Unmocked server dependency');
    },
    process: { env }, fetch: fetcher, AbortSignal: signals, AbortController,
  }, { filename: 'home-stats.ts' });
  return { get: async () => normalize(await localModule.exports.getHomeStats()), cacheProfiles };
}
function fixture(projects, { chains = {}, revenues = {}, fail = '' } = {}) {
  return loader(async (url, init) => {
    assert.deepEqual(Object.keys(init.headers), ['Accept']);
    assert.equal(init.headers.Accept, 'application/json');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    const path = new URL(url).pathname.replace('/v1/', '');
    if (path === fail) return Response.json({}, { status: 503 });
    if (path === 'projects') return Response.json({ items: projects, nextCursor: null });
    const [, projectId, kind] = path.split('/');
    assert.ok(projects.some(p => p.id.toLowerCase() === projectId));
    return Response.json(kind === 'chain' ? chain(chains[projectId]) : revenues[projectId] || revenue());
  });
}

test('sold-out and paused sales do not count as available or lower the minimum; real funded revenue uses fixed exact conversion', async () => {
  const projects = [project(1, '1'), project(2), project(3, '1000000')];
  const stats = fixture(projects, {
    chains: { [id(1)]: { totalSupply: '100' }, [id(3)]: { purchasePaused: true } },
    revenues: { [id(2)]: revenue('3000000', '3600000000000000000') },
  });
  assert.deepEqual(await stats.get(), { openProducts: 1, revenueLast30DaysUsd: 4, soldPercent: 40, minimumInvestmentUsd: 2.5 });
  assert.deepEqual(stats.cacheProfiles, ['minutes']);
  assert.deepEqual(await fixture([project(1)], { chains: { [id(1)]: { totalSupply: '100' } } }).get(), {
    openProducts: 0, revenueLast30DaysUsd: 0, soldPercent: 100, minimumInvestmentUsd: null,
  });
});

test('a verified empty public list has honest zero counts while missing configuration and failed reads remain unavailable', async () => {
  let calls = 0;
  const stats = loader(async () => { calls++; return Response.json({ items: [], nextCursor: null }); });
  assert.deepEqual(await stats.get(), { openProducts: 0, revenueLast30DaysUsd: 0, soldPercent: null, minimumInvestmentUsd: null });
  assert.equal(calls, 1);
  assert.deepEqual(await loader(() => assert.fail('No unconfigured read allowed'), { env: {} }).get(), empty);
  assert.deepEqual(await fixture([project(1)], { fail: 'projects' }).get(), empty);
  assert.deepEqual(await fixture([project(1)], { fail: `projects/${id(1)}/chain` }).get(), empty);
  assert.deepEqual(await fixture([project(1)], { fail: `projects/${id(1)}/revenue` }).get(), {
    openProducts: 1, revenueLast30DaysUsd: null, soldPercent: 10, minimumInvestmentUsd: 2.5,
  });
});

test('zero/malformed prices and impossible or malformed supply never become plausible statistics', async () => {
  for (const price of ['0', '-1', '1.2', '01', '9'.repeat(79)])
    assert.deepEqual(await fixture([project(1, price)]).get(), empty);
  for (const value of [
    { totalSupply: '101' }, { totalSupply: '-1' }, { totalSupply: '1.5' },
    { maxFractions: '0' }, { maxFractions: '01' }, { saleOpen: 'true' },
    { purchasePaused: null }, { chainId: 1 },
  ])
    assert.deepEqual(await fixture([project(1)], { chains: { [id(1)]: value } }).get(), empty);
});

test('duplicate identities, malformed pagination and unpublished rows fail before any detail reads', async () => {
  const first = Array.from({ length: 50 }, (_, n) => project(n + 1));
  for (const body of [
    { items: [project(1), project(1)], nextCursor: null },
    { items: [project(0xabcdef), { ...project(0xabcdef), id: id(0xabcdef).toUpperCase() }], nextCursor: null },
    { items: [project(1)] }, { items: [project(1)], nextCursor: '' },
    { items: [project(1)], nextCursor: 1 }, { items: [], nextCursor: id(1) },
    { items: first, nextCursor: id(999) }, { items: first, nextCursor: 'corrupt' },
    { items: Array.from({ length: 51 }, (_, n) => project(n + 1)), nextCursor: null },
    { items: [{ ...project(1), id: '-'.repeat(36) }], nextCursor: null },
    { items: [{ ...project(1), status: 'DRAFT' }], nextCursor: null },
  ]) {
    let reads = 0;
    const stats = loader(async url => {
      reads++;
      assert.equal(new URL(url).pathname, '/v1/projects');
      return Response.json(body);
    });
    assert.deepEqual(await stats.get(), empty);
    assert.equal(reads, 1);
  }
});

test('repeated identities/cursors across pages reject partial totals rather than inflate counts', async () => {
  const first = Array.from({ length: 50 }, (_, n) => project(n + 1));
  for (const second of [
    { items: [project(1)], nextCursor: null },
    { items: Array.from({ length: 50 }, (_, n) => project(n + 51)), nextCursor: id(50) },
  ]) {
    let pages = 0;
    const stats = loader(async url => {
      pages++;
      const request = new URL(url);
      assert.equal(request.pathname, '/v1/projects');
      if (pages === 1) return Response.json({ items: first, nextCursor: id(50) });
      assert.equal(request.searchParams.get('cursor'), id(50));
      return Response.json(second);
    });
    assert.deepEqual(await stats.get(), empty);
    assert.equal(pages, 2);
  }
});

test('the 500-project published bound completes with at most four projects/eight detail requests active', async () => {
  let listReads = 0, detailReads = 0, active = 0, peak = 0, peakProjects = 0;
  const inFlight = new Map();
  const stats = loader(async (url, init) => {
    const request = new URL(url), path = request.pathname.replace('/v1/', '');
    if (path === 'projects') {
      const page = listReads++;
      assert.equal(request.searchParams.get('cursor'), page ? id(page * 50) : null);
      return Response.json({ items: Array.from({ length: 50 }, (_, n) => project(page * 50 + n + 1)), nextCursor: page === 9 ? null : id((page + 1) * 50) });
    }
    const [, projectId, kind] = path.split('/');
    detailReads++; active++; peak = Math.max(peak, active);
    inFlight.set(projectId, (inFlight.get(projectId) || 0) + 1);
    peakProjects = Math.max(peakProjects, inFlight.size);
    await new Promise(resolve => setTimeout(resolve, 1));
    assert.equal(init.signal.aborted, false);
    active--;
    const remaining = inFlight.get(projectId) - 1;
    if (remaining) inFlight.set(projectId, remaining); else inFlight.delete(projectId);
    return Response.json(kind === 'chain' ? chain() : revenue());
  });
  assert.deepEqual(await stats.get(), { openProducts: 500, revenueLast30DaysUsd: 0, soldPercent: 10, minimumInvestmentUsd: 2.5 });
  assert.equal(listReads, 10);
  assert.equal(detailReads, 1000);
  assert.equal(peak, 8);
  assert.equal(peakProjects, 4);
  assert.equal(active, 0);
});

test('a cursor requiring page eleven stops after ten list reads without fetching any detail', async () => {
  let reads = 0;
  const stats = loader(async url => {
    assert.equal(new URL(url).pathname, '/v1/projects');
    const page = reads++;
    return Response.json({ items: Array.from({ length: 50 }, (_, n) => project(page * 50 + n + 1)), nextCursor: id((page + 1) * 50) });
  });
  assert.deepEqual(await stats.get(), empty);
  assert.equal(reads, 10);
});

test('unavailable revenue cancels unread error streams before workers advance without discarding valid stock figures', async () => {
  let activeBodies = 0, peakBodies = 0, cancelled = 0;
  const stats = loader(async url => {
    const path = new URL(url).pathname;
    if (path === '/v1/projects') return Response.json({ items: Array.from({ length: 50 }, (_, n) => project(n + 1)), nextCursor: null });
    if (path.endsWith('/chain')) return Response.json(chain());
    activeBodies++; peakBodies = Math.max(peakBodies, activeBodies);
    return new Response(new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('Unfinished error response')); },
      cancel() { activeBodies--; cancelled++; },
    }), { status: 503 });
  });
  assert.deepEqual(await stats.get(), { openProducts: 50, revenueLast30DaysUsd: null, soldPercent: 10, minimumInvestmentUsd: 2.5 });
  assert.equal(cancelled, 50);
  assert.equal(activeBodies, 0);
  assert.ok(peakBodies <= 4);
});

function controlledDeadline() {
  const controller = new AbortController(), timeouts = [];
  return {
    controller, timeouts,
    signals: {
      any: signals => AbortSignal.any(signals),
      timeout(ms) {
        timeouts.push(ms);
        if (ms === 15000) return controller.signal;
        assert.equal(ms, 8000);
        return new AbortController().signal;
      },
    },
  };
}

test('one overall deadline cancels the active batch and cannot start the remaining published projects', async () => {
  const deadline = controlledDeadline();
  let started = 0, cancelled = 0;
  const stats = loader(async (url, init) => {
    if (new URL(url).pathname === '/v1/projects')
      return Response.json({ items: Array.from({ length: 50 }, (_, n) => project(n + 1)), nextCursor: null });
    started++;
    const pending = new Promise((_, reject) => {
      init.signal.addEventListener('abort', () => { cancelled++; reject(init.signal.reason); }, { once: true });
    });
    if (started === 8) queueMicrotask(() => deadline.controller.abort(new Error('Controlled overall deadline')));
    return pending;
  }, { signals: deadline.signals });
  const start = performance.now();
  assert.deepEqual(await Promise.race([stats.get(), new Promise((_, reject) => { const timer = setTimeout(() => reject(Error('Cancellation did not complete')), 1000); timer.unref(); })]), empty);
  assert.ok(performance.now() - start < 1000);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(started, 8);
  assert.equal(cancelled, 8);
  assert.equal(deadline.timeouts.filter(ms => ms === 15000).length, 1);
});

test('an overall deadline reached during pagination never starts another page or a detail request', async () => {
  const deadline = controlledDeadline();
  let reads = 0;
  const stats = loader(async () => {
    reads++;
    return { ok: true, json: async () => {
      deadline.controller.abort(new Error('Controlled pagination deadline'));
      return { items: Array.from({ length: 50 }, (_, n) => project(n + 1)), nextCursor: id(50) };
    } };
  }, { signals: deadline.signals });
  assert.deepEqual(await stats.get(), empty);
  assert.equal(reads, 1);
});

test('a failed required chain read cancels outstanding peer reads instead of draining the whole queue', async () => {
  let started = 0, cancelled = 0;
  const stats = loader(async (url, init) => {
    const path = new URL(url).pathname;
    if (path === '/v1/projects') return Response.json({ items: Array.from({ length: 50 }, (_, n) => project(n + 1)), nextCursor: null });
    started++;
    if (path === `/v1/projects/${id(1)}/chain`) return Response.json({}, { status: 503 });
    return new Promise((_, reject) => init.signal.addEventListener('abort', () => { cancelled++; reject(init.signal.reason); }, { once: true }));
  });
  assert.deepEqual(await stats.get(), empty);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(started, 8);
  assert.equal(cancelled, 7);
});
