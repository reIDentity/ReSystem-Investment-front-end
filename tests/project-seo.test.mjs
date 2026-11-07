import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientRenderer } from './client-renderer.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const originalId = '3995355b-8601-49cb-84bf-06bea42db23e';
const replacementId = '6187dbab-0604-43c4-b51e-6b10269d155b';
const genericId = '89abcdef-0123-4567-89ab-cdef01234567';
const pure = clientRenderer();
const { publicProjectPath, publicProjectAliasId, projectIdFromSlug, catalogueProjectPath } = pure.load('src/lib/platform/public-project.ts');
const project = (id = genericId, changes = {}) => ({ id, title: 'Café Renewable Energy', description: 'Published project description.', status: 'PUBLISHED', contractAddress: `0x${'3'.repeat(40)}`, publicationBlock: '100', publicationTxHash: `0x${'4'.repeat(64)}`, maxFractions: '10000', totalValueUsdtAtomic: '10000000', unitPriceUsdtAtomic: '1000', unitPriceReaedAtomic: '3600000000000000', media: [], ...changes });

// Execute the actual server module with a synthetic environment and explicit
// public-only transport. No Next request context, account cookie or live API is used.
function serverModule() {
  const file = new URL('../src/lib/platform/public-project-server.ts', import.meta.url);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file.pathname, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const localModule = { exports: {} };
  const cachePolicies = [];
  const mocks = {
    'server-only': {},
    react: { cache: fn => fn },
    'next/cache': { cacheLife: value => cachePolicies.push(value) },
    './proxy': { proxyConfig: () => ({ base: 'https://api.example.invalid/v1/', origin: 'https://investor.example.invalid' }) },
    './landing-project': pure.load('src/lib/platform/landing-project.ts'),
    './public-project': pure.load('src/lib/platform/public-project.ts'),
  };
  vm.runInNewContext(source, {
    module: localModule, exports: localModule.exports,
    require: name => { assert.ok(Object.hasOwn(mocks, name), `Unmocked server dependency: ${name}`); return mocks[name]; },
    process: { env: {} }, Error, URL, AbortSignal, TextDecoder,
    fetch: (...args) => globalThis.fetch(...args),
  }, { filename: file.pathname });
  return { ...localModule.exports, cachePolicies };
}

function pageModule(resolve) {
  const redirects = [];
  const notFound = () => { throw Object.assign(new Error('Not found'), { status: 404 }); };
  const page = clientRenderer({
    'next/navigation': { notFound, permanentRedirect: path => { redirects.push(path); throw Object.assign(new Error('Permanent redirect'), { status: 308, location: path }); } },
    '@/lib/platform/public-project-server': { getPublicProject: resolve, publicSiteOrigin: () => 'https://investor.example.invalid' },
    '@/components/invest/PublicProject': { PublicProject: ({ initialProject }) => React.createElement('article', null, React.createElement('h1', null, initialProject.title), React.createElement('p', null, initialProject.description)) },
  }).load('src/app/projects/[slug]/page.tsx');
  return { ...page, redirects };
}

test('clean branded aliases bind only their immutable original project, not names or replacements', () => {
  assert.equal(publicProjectPath(originalId, 'INFRA Global'), '/projects/infra-global');
  assert.equal(publicProjectPath(originalId, 'Renamed Global'), '/projects/infra-global');
  assert.equal(publicProjectAliasId('INFRA-GLOBAL'), originalId);
  assert.equal(publicProjectAliasId('not-a-registered-alias'), undefined);
  assert.equal(publicProjectPath(replacementId, 'INFRA Global'), '/projects/infra-global-6187dbab0604');
  assert.equal(publicProjectPath(genericId, 'INFRA Global'), '/projects/infra-global-89abcdef0123');
});

test('generic slugs normalize Unicode and keep duplicate or renamed titles bound to the same ID', () => {
  const first = project();
  const second = project('01234567-89ab-4567-89ab-cdef01234567');
  assert.equal(publicProjectPath(first.id, first.title), '/projects/cafe-renewable-energy-89abcdef0123');
  assert.equal(publicProjectPath(first.id, '再生可能エネルギー'), '/projects/project-89abcdef0123');
  const firstPath = publicProjectPath(first.id, first.title);
  const secondPath = publicProjectPath(second.id, first.title);
  assert.notEqual(firstPath, secondPath);
  assert.equal(projectIdFromSlug(firstPath.split('/').at(-1), [first, second]), first.id);
  assert.equal(projectIdFromSlug(secondPath.split('/').at(-1), [first, second]), second.id);
  const old = firstPath.split('/').at(-1);
  assert.equal(projectIdFromSlug(old, [{ ...first, title: 'New display name' }]), first.id);
  assert.equal(projectIdFromSlug('invented-name-89abcdef0123', [first]), first.id);
  const long = publicProjectPath(first.id, 'Long title '.repeat(100));
  assert.ok(long.length <= '/projects/'.length + 80 + 1 + 12);
});

test('ambiguous compact prefixes fail closed while full-ID slugs remain distinct', () => {
  const first = project('89abcdef-0123-4000-8000-000000000001');
  const second = project('89abcdef-0123-4000-8000-000000000002');
  assert.equal(projectIdFromSlug('renewables-89abcdef0123', [first, second]), null);
  assert.equal(catalogueProjectPath(first, [first, second]), publicProjectPath(first.id, first.title, 32));
  assert.equal(catalogueProjectPath(second, [first, second]), publicProjectPath(second.id, second.title, 32));
  assert.equal(catalogueProjectPath(project(originalId), [project(originalId), project(replacementId)]), '/projects/infra-global');
  assert.equal(projectIdFromSlug('renewables-ffffffffffff', [first, second]), null);
  assert.equal(projectIdFromSlug(publicProjectPath(first.id, first.title, 32).split('/').at(-1), [first, second]), first.id);
  assert.equal(projectIdFromSlug(publicProjectPath(second.id, second.title, 32).split('/').at(-1), [first, second]), second.id);
});

test('server public transport admits only fixed reads, omits credentials and bounds failures', async () => {
  const api = serverModule();
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ items: [], nextCursor: null }); };
  await api.readPublicApi('projects');
  await api.readPublicApi(`projects/${originalId}`);
  await api.readPublicApi(`projects?cursor=${originalId}`);
  for (const { url, options } of calls) {
    assert.ok(url.startsWith('https://api.example.invalid/v1/projects'));
    assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error');
    assert.equal(options.method ?? 'GET', 'GET');
    assert.deepEqual(Object.keys(options.headers).sort(), ['Accept', 'Origin']);
    assert.equal(options.headers.Cookie, undefined); assert.equal(options.headers.Authorization, undefined);
  }
  for (const path of ['wallet', 'projects/../../wallet', 'projects?cursor=not-a-uuid', `projects/${originalId}/quote`, 'https://evil.invalid/projects']) await assert.rejects(api.readPublicApi(path), error => error.status === 404);
  assert.equal(calls.length, 3);
  globalThis.fetch = async () => new Response('private upstream contents', { status: 503 });
  await assert.rejects(api.readPublicApi('projects'), error => error.status === 503 && !error.message.includes('private'));
  globalThis.fetch = async () => { throw new Error('Internal credential detail'); };
  await assert.rejects(api.readPublicApi('projects'), error => error.status === 502 && !error.message.includes('credential'));
  globalThis.fetch = async () => new Response('x'.repeat(2 * 1024 * 1024 + 1));
  await assert.rejects(api.readPublicApi('projects'), error => error.status === 502);
});

test('server catalogue follows validated pages and rejects incomplete, duplicate or unpublished data', async () => {
  const api = serverModule();
  const rows = Array.from({ length: 50 }, (_, i) => project(`00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`));
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return Response.json(calls.length === 1 ? { items: rows, nextCursor: rows.at(-1).id } : { items: [project()], nextCursor: null }); };
  assert.equal((await api.getPublicCatalogue()).length, 51);
  assert.equal(calls[1], `https://api.example.invalid/v1/projects?cursor=${rows.at(-1).id}`);
  for (const body of [{ items: [project(), project()], nextCursor: null }, { items: [project(genericId, { status: 'DRAFT' })], nextCursor: null }, { items: [project()], nextCursor: genericId }, { items: null, nextCursor: null }]) {
    globalThis.fetch = async () => Response.json(body);
    await assert.rejects(api.getPublicCatalogue(), error => error.status === 502);
  }
});

test('server resolver preserves exact identity, rejects drafts and distinguishes 404 from service outages', async () => {
  const api = serverModule();
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return Response.json(project(originalId, { title: 'INFRA Global' })); };
  const found = await api.getPublicProject('infra-global');
  assert.equal(found.project.id, originalId); assert.equal(found.canonical, '/projects/infra-global');
  assert.deepEqual(calls, [`https://api.example.invalid/v1/projects/${originalId}`]);
  for (const status of ['DRAFT', 'ARCHIVED']) {
    globalThis.fetch = async () => Response.json(project(originalId, { status }));
    assert.equal(await api.getPublicProject('infra-global'), null);
  }
  globalThis.fetch = async () => new Response('', { status: 404 });
  assert.equal(await api.getPublicProject('infra-global'), null);
  globalThis.fetch = async () => new Response('operator-only detail', { status: 503 });
  await assert.rejects(api.getPublicProject('infra-global'), error => error.status === 503);
  const count = calls.length;
  assert.equal(await api.getPublicProject('../../wallet'), null);
  assert.equal(await api.getPublicProject('unknown-title-without-id'), null);
  assert.equal(calls.length, count);
});

test('legacy UUIDs and renamed readable URLs resolve to the current canonical identity', async () => {
  const api = serverModule();
  const p = project(genericId, { title: 'Renamed clean project' });
  globalThis.fetch = async url => Response.json(url.endsWith('/projects') ? { items: [p], nextCursor: null } : p);
  const uuid = await api.getPublicProject(genericId);
  assert.equal(uuid.project.id, genericId); assert.equal(uuid.canonical, '/projects/renamed-clean-project-89abcdef0123');
  const stale = await api.getPublicProject('previous-title-89abcdef0123');
  assert.equal(stale.project.id, genericId); assert.equal(stale.canonical, uuid.canonical);
});

test('colliding projects receive full-ID canonical URLs, including legacy UUID lookups', async () => {
  const api = serverModule();
  const first = project('89abcdef-0123-4000-8000-000000000001');
  const second = project('89abcdef-0123-4000-8000-000000000002');
  let detailReads = 0;
  globalThis.fetch = async url => {
    if (url.endsWith('/projects')) return Response.json({ items: [first, second], nextCursor: null });
    detailReads++;
    return Response.json(url.endsWith(first.id) ? first : second);
  };
  assert.equal(await api.getPublicProject('cafe-renewable-energy-89abcdef0123'), null);
  assert.equal(detailReads, 0);
  for (const p of [first, second]) {
    const uuid = await api.getPublicProject(p.id);
    assert.equal(uuid.project.id, p.id);
    assert.equal(uuid.canonical, publicProjectPath(p.id, p.title, 32));
    const named = await api.getPublicProject(uuid.canonical.split('/').at(-1));
    assert.equal(named.project.id, p.id); assert.equal(named.canonical, uuid.canonical);
  }
});

test('page requests canonical redirects and supplies private-safe initial project content', async () => {
  const p = project(originalId, { title: 'INFRA Global' });
  const page = pageModule(async () => ({ project: p, canonical: '/projects/infra-global' }));
  await assert.rejects(page.default({ params: Promise.resolve({ slug: originalId }) }), error => error.status === 308 && error.location === '/projects/infra-global');
  await assert.rejects(page.default({ params: Promise.resolve({ slug: 'old-global-name' }) }), error => error.status === 308 && error.location === '/projects/infra-global');
  const content = await page.default({ params: Promise.resolve({ slug: 'infra-global' }) });
  assert.equal(content.props.id, originalId);
  assert.equal(content.props.initialProject, p);
  assert.match(renderToStaticMarkup(content), /INFRA Global/);
  assert.match(renderToStaticMarkup(content), /Published project description/);
});

test('project metadata has exact canonical, descriptions and public artwork; missing projects stay 404', async () => {
  const cid = 'bafy' + 'a'.repeat(50);
  const p = project(originalId, { title: 'INFRA Global', description: '  Real project\n details.  ', media: [{ cid, mimeType: 'image/png', filename: 'Public image.png' }] });
  const page = pageModule(async () => ({ project: p, canonical: '/projects/infra-global' }));
  const metadata = await page.generateMetadata({ params: Promise.resolve({ slug: 'infra-global' }) });
  assert.equal(metadata.title, 'INFRA Global — reSystem Investment');
  assert.equal(metadata.description, 'Real project details.');
  assert.equal(metadata.alternates.canonical, 'https://investor.example.invalid/projects/infra-global');
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.openGraph.images[0].url, `https://investor.example.invalid/api/artwork/${originalId}/${cid}?size=card`);
  assert.equal(metadata.openGraph.images[0].alt, 'INFRA Global');
  const missing = pageModule(async () => null);
  await assert.rejects(missing.default({ params: Promise.resolve({ slug: 'not-published' }) }), error => error.status === 404);
  await assert.rejects(missing.generateMetadata({ params: Promise.resolve({ slug: 'not-published' }) }), error => error.status === 404);
});


test('actual public component server-renders initial project details before hydration without private reads', () => {
  const p = project(originalId, { title: 'INFRA Global' });
  globalThis.fetch = async () => { throw new Error('Render must not issue a browser-side request on the server'); };
  const { PublicProject } = clientRenderer({
    'next/navigation': {},
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
    './PlatformProvider': { usePlatform: () => { throw new Error('Private session read during public SSR'); }, useResource: () => { throw new Error('Private resource read during public SSR'); } },
  }).load('src/components/invest/PublicProject.tsx');
  const html = renderToStaticMarkup(React.createElement(PublicProject, { id: p.id, initialProject: p }));
  assert.match(html, /<h1>INFRA Global<\/h1>/);
  assert.match(html, /Published project description/);
  assert.match(html, /0\.0036/);
  assert.match(html, /0x3333333333333333333333333333333333333333/);
  assert.match(html, /Connect with reID to invest/);
  assert.ok(!/>Review purchase<\/button>/.test(html));
});

// Route handlers use native Response globals not present in the browser-component
// harness. Evaluate the unchanged handler with only its two imports mocked.
function redirectRoute(resolve) {
  const file = new URL('../src/app/api/public/project-redirect/[id]/route.ts', import.meta.url);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file.pathname, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const localModule = { exports: {} };
  const mocks = {
    'next/server': { connection: async () => {} },
    '@/lib/platform/public-project-server': { getPublicProject: resolve, publicSiteOrigin: () => 'https://investor.example.invalid' },
    '@/lib/platform/public-project': pure.load('src/lib/platform/public-project.ts'),
  };
  vm.runInNewContext(source, {
    module: localModule, exports: localModule.exports, Error, URL, Response,
    require: name => { assert.ok(Object.hasOwn(mocks, name), `Unmocked route dependency: ${name}`); return mocks[name]; },
  }, { filename: file.pathname });
  return localModule.exports;
}

test('legacy redirect handler emits real HTTP 308 to the approved public origin, ignoring request Host', async () => {
  let seen;
  const { GET } = redirectRoute(async id => { seen = id; return { project: project(originalId), canonical: '/projects/infra-global' }; });
  const request = new Request(`https://attacker.example.invalid/projects/${originalId}`, { headers: { Host: 'attacker.example.invalid', 'X-Forwarded-Host': 'attacker.example.invalid' } });
  const response = await GET(request, { params: Promise.resolve({ id: originalId }) });
  assert.equal(seen, originalId);
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('Location'), 'https://investor.example.invalid/projects/infra-global');
  assert.equal(await response.text(), '');
  assert.match(response.headers.get('Cache-Control'), /s-maxage=30/);
});

test('legacy redirect handler returns honest 404 for invalid or unpublished project IDs', async () => {
  let calls = 0;
  const { GET } = redirectRoute(async () => { calls++; return null; });
  const invalid = await GET(new Request('https://investor.example.invalid'), { params: Promise.resolve({ id: '../../wallet' }) });
  assert.equal(invalid.status, 404); assert.equal(invalid.headers.get('Location'), null); assert.equal(calls, 0);
  const unpublished = await GET(new Request('https://investor.example.invalid'), { params: Promise.resolve({ id: originalId }) });
  assert.equal(unpublished.status, 404); assert.equal(unpublished.headers.get('Location'), null); assert.equal(calls, 1);
  assert.match(await unpublished.text(), /Project not found/);
});

test('legacy redirect handler preserves service outage semantics without caching or exposing internal errors', async () => {
  const { GET } = redirectRoute(async () => { throw new Error('Private upstream credential detail'); });
  const response = await GET(new Request('https://investor.example.invalid'), { params: Promise.resolve({ id: originalId }) });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Location'), null);
  const body = await response.text();
  assert.match(body, /temporarily unavailable/); assert.ok(!body.includes('credential'));
});
