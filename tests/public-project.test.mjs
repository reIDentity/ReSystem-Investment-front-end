import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientRenderer } from './client-renderer.mjs';
import { safeInvestorPath } from '../src/lib/auth/security.ts';

const id = '1a0b121f-198f-43ab-af16-681559c61dcd';
const project = () => ({ id, title: 'Public project', description: 'Published description', status: 'PUBLISHED', contractAddress: `0x${'3'.repeat(40)}`, publicationBlock: '100', publicationTxHash: `0x${'4'.repeat(64)}`, maxFractions: '10000', totalValueUsdtAtomic: '10000000', unitPriceUsdtAtomic: '1000', unitPriceReaedAtomic: '3600000000000000', media: [] });
const chain = () => ({ chainId: 15324, source: 'INFRA RPC', headBlock: '200', totalSupply: '54', remainingSupply: '9946', maxFractions: '10000', totalValueUSDT: '10000000', unitPriceUSDT: '1000', saleOpen: true, purchasePaused: false });
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const { readPublicProject, publicSale, projectContributionPath, publicProjectPath } = clientRenderer().load('src/lib/platform/public-project.ts');

test('anonymous project reads are bounded public GETs with no credentials or private endpoints', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json(url.endsWith(id) ? project() : url.endsWith('/chain') ? chain() : url.endsWith('/revenue') ? { assets: [], history: { status: 'available', items: [] } } : { mode: 'legacy' }); };
  for (const section of ['details', 'chain', 'revenue', 'phases']) await readPublicProject(id, section);
  assert.deepEqual(calls.map(c => c.url), [`/api/platform/projects/${id}`, `/api/platform/projects/${id}/chain`, `/api/platform/projects/${id}/revenue`, `/api/platform/projects/${id}/phases?page=1`]);
  for (const { options } of calls) {
    assert.equal(options.credentials, 'omit'); assert.equal(options.method, 'GET');
    assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error');
    assert.deepEqual(Object.keys(options.headers), ['Accept']);
  }
  for (const args of [[id, 'wallet'], [id, 'quote'], ['../../wallet', 'details'], [id, 'phases', 0]]) await assert.rejects(readPublicProject(...args));
  assert.equal(calls.length, 4);
});

test('unpublished/mismatched records and upstream failures never reveal content or raw errors', async () => {
  for (const change of [{ status: 'DRAFT' }, { status: 'ARCHIVED' }, { id: 'wrong-project' }, { publicationTxHash: null }]) {
    globalThis.fetch = async () => Response.json({ ...project(), ...change });
    await assert.rejects(readPublicProject(id), error => error.status === 404);
  }
  globalThis.fetch = async () => new Response('private upstream failure', { status: 503 });
  await assert.rejects(readPublicProject(id), error => error.status === 503 && !error.message.includes('private'));
  globalThis.fetch = async () => { throw new Error('internal secret'); };
  await assert.rejects(readPublicProject(id), error => error.status === 502 && !error.message.includes('secret'));
  globalThis.fetch = async () => new Response('x'.repeat(2 * 1024 * 1024 + 1));
  await assert.rejects(readPublicProject(id), error => error.status === 502);
});

test('public availability uses verified supply and phase capacity without inventing eligibility', () => {
  assert.equal(publicSale(project(), chain()).limit, 9946n);
  assert.equal(publicSale(project(), { ...chain(), purchasePaused: true }).limit, 0n);
  assert.equal(publicSale(project(), { ...chain(), chainId: 1 }).limit, null);
  assert.equal(publicSale(project(), { ...chain(), remainingSupply: '9999' }).supply, undefined);
  assert.equal(publicSale(project(), undefined).limit, null);
  const phased = { ...project(), businessOpportunity: true, reservedBlocks: '3000' };
  const phasedChain = { ...chain(), remainingSupply: '6946' };
  const phases = { mode: 'phased', totalBlocks: '10000', reservedBlocks: '3000', allocatedBlocks: '7000', unallocatedBlocks: '0', whitelistBlocks: '3000', publicBlocks: '4000', current: { id: '1', name: 'Pre-launch', blocks: '3000', sold: '54', remaining: '2946', unitPriceAtomic: '25000000', open: true, whitelist: true }, phases: [], nextPage: null };
  const sale = publicSale(phased, phasedChain, phases);
  assert.equal(sale.limit, 2946n); assert.equal(sale.view.walletApproved, undefined);
  assert.equal(sale.usdtPrice, '25000000'); assert.equal(sale.nativePrice, '90000000000000000000');
  assert.equal(publicSale(phased, phasedChain).limit, null);
  assert.equal(publicSale(phased, phasedChain, { ...phases, totalBlocks: '9999' }).limit, null);
  assert.equal(publicSale(phased, phasedChain, { ...phases, current: { ...phases.current, open: false } }).limit, 0n);
});

test('malformed successful public responses become honest unavailable states', async () => {
  for (const [section, data] of [['revenue', {}], ['revenue', { assets: [] }], ['revenue', { assets: [], history: { status: 'available', items: [null] } }], ['phases', { mode: 'phased' }], ['chain', {}], ['details', { ...project(), media: [null] }]]) {
    globalThis.fetch = async () => Response.json(data);
    await assert.rejects(readPublicProject(id, section), error => error.status === 502);
  }
});

test('contribution links retain the project and purchase anchor through safe reID return paths', () => {
  assert.equal(publicProjectPath(id), `/projects/${id}`);
  const url = new URL(projectContributionPath(id), 'https://investor.invalid');
  assert.equal(url.pathname, '/invest');
  const target = url.searchParams.get('next');
  assert.equal(target, `/invest/products/${id}#invest`);
  assert.equal(safeInvestorPath(target), target);
  assert.equal(safeInvestorPath('https://evil.invalid/'), '/invest/home');
});

function renderPublic({ p = project(), state = chain(), phases, projectError, stateError, phaseError } = {}) {
  const requested = [];
  const mock = (data, error) => ({ data, error, isLoading: false, mutate: async () => {} });
  const { PublicProject } = clientRenderer({
    swr: { __esModule: true, default: key => {
      if (!key) return mock(undefined);
      requested.push(key[0]);
      if (key[0] === 'public-project') return mock(p, projectError);
      if (key[0] === 'public-project-chain') return mock(state, stateError);
      if (key[0] === 'public-project-phases') return mock(phases, phaseError);
      return mock({ assets: [{ asset: 'REAED', decimals: 18, fundedAtomic: '0', claimedTotalAtomic: '0', reserveAtomic: '0' }, { asset: 'USDT', decimals: 6, fundedAtomic: '0', claimedTotalAtomic: '0', reserveAtomic: '0' }], history: { status: 'available', items: [] } });
    } },
    'next/navigation': {},
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
    './PlatformProvider': { usePlatform: () => { throw new Error('Private session accessed by public page'); }, useResource: () => { throw new Error('Private resource requested by public page'); } },
  }).load('src/components/invest/PublicProject.tsx');
  return { html: renderToStaticMarkup(React.createElement(PublicProject, { id })), requested };
}

test('actual public page shares project details and all 50 blocks, with login-only financial actions', () => {
  const { html, requested } = renderPublic();
  assert.match(html, /Published description/); assert.match(html, /0\.0036/); assert.match(html, /9,946/);
  assert.match(html, /No documents published/); assert.match(html, /Project contract on INFRA/i);
  assert.match(html, /No revenue deposits yet/); assert.match(html, /Sign in to view/);
  assert.match(html, /Share allocation/); assert.match(html, /Sign in to check/);
  const grid = html.match(/iv-block-grid-wrap[\s\S]*?<\/div>/)?.[0];
  assert.equal((grid?.match(/<i /g) ?? []).length, 50);
  assert.ok(!/>Review purchase<\/button>/.test(html)); assert.ok(!html.includes('payment-asset')); assert.ok(!html.includes('Your wallet is not'));
  const contribute = html.match(/href="([^"]*)"[^>]*>Contribute<\/a>/)?.[1];
  assert.equal(contribute, projectContributionPath(id));
  assert.deepEqual(requested, ['public-project', 'public-project-chain', 'public-project-revenue']);
});

test('unavailable project drops stale data, and unavailable chain drops sale figures', () => {
  const error = new Error('Project unavailable');
  const missing = renderPublic({ projectError: error });
  assert.ok(!missing.html.includes('Published description')); assert.ok(!missing.html.includes('Contribute</a>'));
  assert.deepEqual(missing.requested, ['public-project']);
  const stale = renderPublic({ stateError: error });
  assert.ok(!stale.html.includes('9,946')); assert.match(stale.html, /Availability unverified/);
});

test('public early-access phases ask for sign-in and never classify an anonymous wallet', () => {
  const p = { ...project(), businessOpportunity: true, reservedBlocks: '3000' };
  const phases = { mode: 'phased', totalBlocks: '10000', reservedBlocks: '3000', allocatedBlocks: '7000', unallocatedBlocks: '0', whitelistBlocks: '3000', publicBlocks: '4000', current: { id: '1', name: 'Pre-launch', blocks: '3000', sold: '54', remaining: '2946', unitPriceAtomic: '25000000', open: true, whitelist: true }, phases: [], nextPage: null };
  const { html, requested } = renderPublic({ p, phases, state: { ...chain(), remainingSupply: '6946' } });
  assert.match(html, /Sign in to check early-access eligibility/); assert.match(html, /2,946 shares/);
  assert.ok(!html.includes('Your wallet is not on')); assert.ok(!html.includes('Wallet approval could not be verified'));
  assert.deepEqual(requested, ['public-project', 'public-project-chain', 'public-project-revenue', 'public-project-phases']);
});
