import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { clientRenderer } from './client-renderer.mjs';

const id = '3995355b-8601-49cb-84bf-06bea42db23e';
const address = `0x${'ab'.repeat(20)}`;
const p = { id, title: 'Live project', description: 'Verified project description', maxFractions: '10000', contractAddress: address, media: [] };
const resource = data => ({ data, mutate() {} });
const assets = (native, usdt) => [
  { asset: 'REAED', decimals: 18, fundedAtomic: native, claimedTotalAtomic: '0', reserveAtomic: native },
  { asset: 'USDT', decimals: 6, fundedAtomic: usdt, claimedTotalAtomic: '0', reserveAtomic: usdt },
];
function series() {
  const dayAssets = amount => [
    { asset: 'REAED', decimals: 18, revenueAtomic: '0', perShareScaled: '0' },
    { asset: 'USDT', decimals: 6, revenueAtomic: amount, perShareScaled: '0' },
  ];
  return {
    status: 'available', chainId: 15324, source: 'confirmed canonical INFRA indexer', timezone: 'UTC',
    scale: (10n ** 27n).toString(), confirmedBlock: '500', blockHash: `0x${'cd'.repeat(32)}`, asOf: '2026-11-14T10:00:00Z',
    assets: ['REAED', 'USDT'].map(asset => ({ asset, decimals: asset === 'USDT' ? 6 : 18, todayAtomic: asset === 'USDT' ? '2000000' : '0', thisMonthAtomic: asset === 'USDT' ? '2000000' : '0', todayPerShareScaled: '0', monthPerShareScaled: '0', cumulativePerShareScaled: '0' })),
    days: Array.from({ length: 14 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2,'0')}`, assets: dayAssets(i === 13 ? '2000000' : '0') })),
  };
}
function render(extra = {}) {
  const { ProjectOverview } = clientRenderer({
    'next/image': props => { const image = {...props}; delete image.unoptimized; return React.createElement('img', image); },
    './InvestorUI': {
      CopyButton: ({ value }) => React.createElement('button', { 'data-copy-value': value }, 'Copy address'),
      DataState: () => null,
    },
  }).load('src/components/invest/ProjectOverview.tsx');
  const html = renderToStaticMarkup(React.createElement(ProjectOverview, {
    project: resource(p), state: resource({ totalSupply:'11', remainingSupply:'9989' }), revenue: resource({ assets:assets('3600000000000000000','1000000'), history:{status:'available',items:[]} }),
    supplyTotal:'10000', saleLimit:9989n, nativePrice:'90000000000000000000', usdtPrice:'25000000', issuedPercent:'0.11%', ...extra,
  }));
  const document = new JSDOM(html).window.document;
  return { html, document, text:document.body.textContent };
}
const section = (doc, label) => doc.querySelector(`[aria-label="${label}"]`);

test('the supplied inner-page hierarchy uses live prices, contract identity and safe contribution paths', () => {
  const { document, text } = render({ publicView:true, yourShares:'999', claimTotals:{REAED:999n,USDT:999n} });
  assert.deepEqual([...document.querySelectorAll(':scope > body > div > section, :scope > body > div > div > section')].map(s => s.getAttribute('aria-label')), [
    'Project introduction','Project money flow','Share pricing','Core features and reasons to invest','Project share allocation','Revenue so far','How you earn','Project contract on INFRA',
  ]);
  assert.match(section(document,'Share pricing').textContent,/25 USDT per share/);
  assert.match(section(document,'Share pricing').textContent,/90/);
  assert.match(text,/9,989/);
  assert.doesNotMatch(text,/6,989|View as|Whitelisted user|999 shares|999 issued/);
  const contract = section(document,'Project contract on INFRA');
  assert.equal(contract.querySelector('a').href,`https://uat.scan.infraworld.org/address/${address}`);
  assert.equal(contract.querySelector('button').dataset.copyValue,address);
  assert.ok([...document.querySelectorAll('a')].filter(a=>/Sign in|Choose your shares/.test(a.textContent)).every(a=>a.getAttribute('href').includes(encodeURIComponent(id)) || a.getAttribute('href').includes(id)));
});

test('the shared overview exposes personal values only on the authenticated path', () => {
  const { document } = render({ yourShares:'42', ownsShares:true, claimTotals:{REAED:3600000000000000000n,USDT:1000000n} });
  assert.match(section(document,'Project introduction').textContent,/You own 42 shares/);
  assert.match(section(document,'How you earn').textContent, /\$2\.00/);
  assert.equal(section(document,'How you earn').querySelector('a').getAttribute('href'),'/invest/earnings');
  assert.equal(section(document,'Core features and reasons to invest').querySelector('a').getAttribute('href'),'#invest');
});

test('unavailable resources cannot display cached funding, prices, supply or a positive chart', () => {
  const { document, text } = render({ project:resource(p), state:{...resource({totalSupply:'11'}),error:new Error('unavailable')}, revenue:{...resource({assets:assets('999000000000000000000','999000000')}),error:new Error('unavailable')}, saleLimit:null,nativePrice:null,usdtPrice:undefined });
  assert.match(section(document,'Project introduction').textContent,/Availability unverified/);
  assert.doesNotMatch(section(document,'Project money flow').textContent,/\$999|Confirmed on INFRA/);
  assert.match(section(document,'Revenue so far').textContent,/No revenue trend/);
  assert.equal(section(document,'Revenue so far').querySelector('table'),null);
  assert.doesNotMatch(text,/6,989|25 USDT per share/);
});

test('canonical daily revenue renders exact accessible records instead of an illustrative trend', () => {
  const { document } = render({ revenue:resource({ assets:assets('0','2000000'),history:{status:'available',items:[]},series:series() }) });
  const revenue = section(document,'Revenue so far');
  assert.doesNotMatch(revenue.textContent,/No revenue trend/);
  assert.match(revenue.textContent,/Confirmed through block 500/);
  assert.equal(revenue.querySelectorAll('tbody tr').length,14);
  assert.equal(revenue.querySelectorAll('tbody tr').item(13).textContent,'2026-11-14$2.00');
  const chart = revenue.querySelector('[role="img"]');
  assert.equal(chart.children.length,14);
  assert.equal(chart.children[0].querySelector('i').style.height,'0%');
  assert.ok(parseFloat(chart.children[13].querySelector('i').style.height)>0);
});

test('an invalid canonical series never becomes a decorative or zero-valued revenue chart', () => {
  const bad = series(); bad.days[13].assets[1].revenueAtomic='999';
  const { document } = render({ revenue:resource({ assets:assets('0','0'),history:{status:'available',items:[]},series:bad }) });
  assert.match(section(document,'Revenue so far').textContent,/No revenue trend/);
  assert.equal(section(document,'Revenue so far').querySelector('[role="img"]'),null);
});

test('duplicate reward assets cannot silently populate the funded display', () => {
  const rows = assets('3600000000000000000','1000000');
  const { document } = render({ revenue:resource({assets:[...rows,rows[0]],history:{status:'available',items:[]}}) });
  assert.doesNotMatch(section(document,'Project money flow').textContent,/\$2\.00/);
  assert.match(section(document,'Project money flow').textContent,/Revenue funded—/);
});
