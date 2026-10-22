import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { cashflowFixture } from '../../cashflow-fixtures.mjs';

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const fromRepository = createRequire(path.join(repository, 'package.json'));
const ts = fromRepository('typescript');
const React = fromRepository('react');
const { renderToStaticMarkup } = fromRepository('react-dom/server');
const walletAddress = `0x${'1'.repeat(40)}`;
const assets = (native, usdt) => [
  { asset: 'REAED', decimals: 18, amountAtomic: native },
  { asset: 'USDT', decimals: 6, amountAtomic: usdt },
];
const response = data => ({ data, error: undefined, isLoading: false, isValidating: false });
const unavailable = (code = 'SERVICE_UNAVAILABLE') => Object.assign(new Error('Synthetic fixture service failure'), { status: 503, code });
const holding = () => ({
  projectId: 'fixture-project', title: 'Fixture project — not a live investment',
  contractAddress: `0x${'2'.repeat(40)}`, quantity: '1176',
  ownership: { numerator: '1176', denominator: '10000' },
  revenueParticipation: { numerator: '1176', denominator: '1200' },
  claimable: assets('7164000000000000000', '1090000'), claimed: assets('0', '0'),
  costBasis: null, indicativeYieldBps: null,
});
const portfolio = items => ({ items, nextCursor: null, complete: true, blockHash: `0x${'4'.repeat(64)}`, chainId: 15324, headBlock: '7337161', source: 'LOCAL SYNTHETIC FIXTURE', costBasisStatus: 'unavailable' });
const wallet = (native = '3600000000000000000', usdt = '1000000') => ({
  chainId: 15324, address: walletAddress, wallet: walletAddress, headBlock: '7337161',
  source: 'LOCAL SYNTHETIC FIXTURE', bank: { available: false }, card: { available: false },
  assets: [{ symbol: 'REAED', decimals: 18, balanceAtomic: native, address: null },
    { symbol: 'USDT', decimals: 6, balanceAtomic: usdt, address: `0x${'3'.repeat(40)}` }],
});

export const scenarios = {
  empty: 'Verified empty portfolio and verified zero wallet balances.',
  loading: 'No portfolio/wallet response yet; loading is not a verified zero.',
  'indexing-delay': 'Authoritative portfolio unavailable while the resource remains loading; no invented pending API field.',
  'indexer-error': 'Actual-shaped 503/indexer-not-ready resource failure; current UI uses its existing unavailable state.',
  error: 'Portfolio, wallet and project resource errors without previous data.',
  'stale-error': 'Previous funded data plus refresh errors; stale financial values must not remain claimable.',
  'wallet-stale-error': 'Verified portfolio alongside failed wallet refresh with cached wallet data.',
  'partial-ledger': 'A holding is missing one required reward asset; missing is not zero.',
  populated: 'Synthetic API-shaped holdings/rewards/wallet with unknown invested cost; not a live account.',
  recovered: 'Fresh successful resource values after the error fixture; separate render, not a retry-click test.',
  'previous-holder': 'Zero current shares with previously allocated positive rewards.',
  'tiny-claim': 'One native atomic reward unit remains positive even below one display cent.',
  'known-basis': 'Verified synthetic rational acquisition basis at the same canonical portfolio anchor.',
  'gift-basis': 'Gift provenance makes remaining basis unknown even while rewards are verified.',
  'malformed-basis': 'Basis quantity differs from the verified holding; no cost estimate is displayed.',
  cashflow: 'Verified canonical synthetic gross cash flows, including a negative net after fixed FX.',
  'cashflow-stale': 'Cached financial cash flow with a failed refresh must not be displayed.',
  offline: 'Service disabled and no resource data; no authentication or backend connection.',
};

export function fixture(name) {
  if (!Object.hasOwn(scenarios, name)) throw new Error(`Unknown local scenario: ${name}`);
  const resources = {
    portfolio: response(portfolio([holding()])), wallet: response(wallet()), 'wallet/cashflow': response(undefined),
    projects: response({ items: [], nextCursor: null }),
    notifications: response({ items: [], nextCursor: null }),
  };
  if (name === 'empty') { resources.portfolio.data = portfolio([]); resources.wallet.data = wallet('0', '0'); }
  if (name === 'loading' || name === 'indexing-delay') {
    for (const endpoint of ['portfolio', 'wallet', 'projects']) resources[endpoint] = { data: undefined, error: undefined, isLoading: true, isValidating: true };
  }
  if (name === 'error' || name === 'indexer-error' || name === 'stale-error') {
    for (const endpoint of ['portfolio', 'wallet', 'projects']) resources[endpoint] = {
      data: name === 'stale-error' ? resources[endpoint].data : undefined,
      error: unavailable(name === 'indexer-error' ? 'INDEXER_NOT_READY' : 'SERVICE_UNAVAILABLE'), isLoading: false, isValidating: false,
    };
  }
  if (name === 'wallet-stale-error') resources.wallet.error = unavailable();
  if (name === 'partial-ledger') { resources.portfolio.data.items[0].claimable.pop(); resources.portfolio.data.items[0].claimed.pop(); }
  if (name === 'previous-holder') {
    const h = resources.portfolio.data.items[0]; h.quantity = '0'; h.ownership.numerator = '0'; h.revenueParticipation.numerator = '0';
  }
  if (name === 'tiny-claim') resources.portfolio.data.items[0].claimable = assets('1', '0');
  if (['known-basis', 'gift-basis', 'malformed-basis'].includes(name)) {
    const h = resources.portfolio.data.items[0];
    resources.portfolio.data.cashActivity = { status: 'known', reason: null, spent: assets('3600000000000000000', '2000000'), marketplaceProceedsReceived: assets('0', '0') };
    h.costBasis = { status: name === 'gift-basis' ? 'unknown' : 'known', method: 'weighted_average', reason: name === 'gift-basis' ? 'gift_or_other_payer' : null, quantity: name === 'malformed-basis' ? '1175' : h.quantity, remaining: name === 'gift-basis' ? null : [{ asset: 'REAED', decimals: 18, numerator: '3600000000000000000', denominator: '3' }, { asset: 'USDT', decimals: 6, numerator: '2000000', denominator: '3' }], acquisitionOutlay: assets('3600000000000000000', '2000000') };
  }
  if (name === 'cashflow' || name === 'cashflow-stale') { resources['wallet/cashflow'] = response(cashflowFixture()); if (name === 'cashflow-stale') resources['wallet/cashflow'].error = unavailable(); }
  if (name === 'offline') for (const endpoint of ['portfolio', 'wallet', 'projects']) resources[endpoint] = response(undefined);
  return { name, live: name !== 'offline', resources };
}

const sourcePaths = [
  'src/components/invest/HomeExplore.tsx', 'src/components/invest/InvestorUI.tsx', 'src/components/invest/platform/ProjectIcon.tsx',
  'src/components/Logo.tsx', 'src/lib/platform/read-ahead.ts', 'src/lib/platform/money.ts', 'src/lib/platform/media.ts',
  'src/lib/platform/portfolio-values.ts', 'src/lib/platform/valuation.ts', 'src/lib/platform/cashflow-values.ts',
];
export function hashFile(relative) { return createHash('sha256').update(fs.readFileSync(path.join(repository, relative))).digest('hex'); }
export function sourceHashes() { return sourcePaths.map(file => ({ file, sha256: hashFile(file) })); }

export function createHomeRenderer() {
  let current;
  const stats = { resourceReads: [], blockedApiCalls: 0, blockedTransactionCalls: 0 };
  const cache = new Map();
  const provider = {
    usePlatform: () => ({ user: { id: 'local-fixture-only', name: 'Fixture Preview', wallet: walletAddress, kycStatus: 'not_requested' }, live: current.live, notice: '', notify() {}, session: null, approvalOrigin: '' }),
    useResource: endpoint => {
      if (endpoint === null) return {data:undefined,error:undefined,isLoading:false};
      if (endpoint.startsWith('projects/')) return {data:current.resources.projects?.data?.items.find(project=>project.id===endpoint.slice(9)),error:undefined,isLoading:false};
      stats.resourceReads.push(endpoint);
      if (!Object.hasOwn(current.resources, endpoint)) throw new Error(`Unexpected fixture resource: ${endpoint}`);
      return { ...current.resources[endpoint], mutate: async () => { throw new Error('Static fixture preview has no retry transport'); } };
    },
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const relative = path.relative(repository, file);
    if (!sourcePaths.includes(relative)) throw new Error(`Unapproved local preview import: ${relative}`);
    const localModule = { exports: {} }; cache.set(file, localModule);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    function importModule(name) {
      if (name.endsWith('PlatformProvider')) return provider;
      if (name === 'next/navigation') return { usePathname: () => '/invest/home', useRouter: () => ({ replace() { throw new Error('No fixture navigation connector'); }, refresh() { throw new Error('No fixture navigation connector'); } }) };
      if (name === '@/lib/platform/client') return { api() { stats.blockedApiCalls++; throw new Error('No fixture API connector'); } };
      if (name === './platform/Transaction') return { TransactionReview() { stats.blockedTransactionCalls++; throw new Error('No fixture transaction connector'); } };
      if (name.endsWith('.css')) return {};
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(repository, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
        const target = [base, `${base}.tsx`, `${base}.ts`].find(candidate => fs.existsSync(candidate));
        if (!target) throw new Error(`Unknown fixture import: ${name}`);
        return load(target);
      }
      if (!['react', 'react/jsx-runtime', 'next/image', 'next/link'].includes(name)) throw new Error(`External preview dependency denied: ${name}`);
      return fromRepository(name);
    }
    vm.runInNewContext(code, { module: localModule, exports: localModule.exports, require: importModule, console }, { filename: file });
    return localModule.exports;
  }
  const { InvestorHome } = load(path.join(repository, sourcePaths[0]));
  return {
    render(name) { current = fixture(name); return renderToStaticMarkup(React.createElement(InvestorHome)); },
    stats,
    loadedSourcePaths: () => [...cache.keys()].map(file => path.relative(repository, file)),
  };
}
