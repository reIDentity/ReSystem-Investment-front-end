import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createHomeRenderer, fromRepository, hashFile, repository, scenarios, sourceHashes } from './render.mjs';

const output = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'resystem-rsi082-home-preview-20261019'));
const { compile } = fromRepository('@tailwindcss/node');
const sourceStyles = ['src/app/globals.css', 'src/app/design.css', 'src/app/fonts/fallbacks.css', 'src/app/invest/investor.css', 'src/components/invest/HomeExplore.css', 'src/components/invest/Explore.css'];
const sourceLayouts = ['src/app/layout.tsx', 'src/app/invest/layout.tsx', 'src/app/fonts/manifest.json'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const emitted = [];
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
if (fs.existsSync(path.join(output, 'manifest.json'))) {
  const existing = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
  if (existing.owner !== 'RSI-082 local static fixture preview') throw new Error('Refusing an output directory owned by something else');
} else if (fs.readdirSync(output).length) throw new Error('Refusing a nonempty unowned output directory');

function write(relative, bytes) {
  const destination = path.join(output, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  fs.writeFileSync(destination, bytes, { mode: 0o600 });
  emitted.push({ path: relative, bytes: Buffer.byteLength(bytes), sha256: digest(bytes) });
}

const before = sourceHashes();
const renderer = createHomeRenderer();
const renders = Object.fromEntries(Object.keys(scenarios).map(name => [name, renderer.render(name)]));
if (JSON.stringify(before) !== JSON.stringify(sourceHashes())) throw new Error('Production source changed during rendering');

// Use the repository's existing compiler and exact current CSS, not copied screen CSS.
const compiler = await compile(sourceStyles.map(file => fs.readFileSync(path.join(repository, file), 'utf8')).join('\n'), { base: path.join(repository, 'src/app'), onDependency() {} });
const fonts = JSON.parse(fs.readFileSync(path.join(repository, 'src/app/fonts/manifest.json'), 'utf8')).fonts;
let fontCSS = '';
const variables = [];
for (const font of fonts) {
  const bytes = fs.readFileSync(path.join(repository, 'src/app/fonts', font.file));
  if (digest(bytes) !== font.sha256 || bytes.length !== font.bytes) throw new Error(`Local font pin mismatch: ${font.file}`);
  const family = `RSI082 ${font.family}`;
  for (const weight of font.weights) fontCSS += `@font-face{font-family:"${family}";src:url("/fonts/${font.file}") format("woff2");font-style:${font.style};font-weight:${weight};font-display:${font.display};${font.variable === '--font-plex' ? 'font-stretch:100%;' : ''}}\n`;
  variables.push(`${font.variable}:"${family}","${font.fallback.family}";`);
  write(`fonts/${font.file}`, bytes);
}
write('preview.css', fontCSS + '\n:root{' + variables.join('') + '}\n' + compiler.build(['sr-only']));

// Copy only image bytes referenced by the actual rendered markup; no public-dir symlink.
const imagePaths = new Set(Object.values(renders).flatMap(html => [...html.matchAll(/(?:src|href)="(\/images\/[^"?]+\.svg)"/g)].map(match => match[1])));
for (const asset of imagePaths) {
  const relative = asset.slice(1);
  if (relative.includes('..')) throw new Error('Invalid rendered image path');
  write(relative, fs.readFileSync(path.join(repository, 'public', relative)));
}
write('preview.js', `document.addEventListener('click',event=>{const target=event.target.closest('a,button');if(target&&!target.hasAttribute('data-fixture-navigation')){event.preventDefault();event.stopImmediatePropagation();}},true);
document.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();},true);
function viewport(){const value={scenario:document.documentElement.dataset.fixture||'index',innerWidth:window.innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,devicePixelRatio:window.devicePixelRatio,rendering:'static SSR fixture; no hydration/API/transaction connector'};window.__RSI082_PREVIEW__=value;const output=document.getElementById('qa-viewport');if(output)output.textContent='Measured DOM viewport '+value.innerWidth+'px; document '+value.scrollWidth+'px';}window.addEventListener('resize',viewport);viewport();\n`);

const head = title => '<!doctype html><html lang="en" data-fixture="' + escape(title) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>LOCAL FIXTURE ONLY — ' + escape(title) + '</title><link rel="stylesheet" href="/preview.css">' + fonts.map(font => '<link rel="preload" href="/fonts/' + font.file + '" as="font" type="font/woff2" crossorigin>').join('') + '</head><body>';
const script = '<script src="/preview.js"></script></body></html>';
for (const [name, markup] of Object.entries(renders)) {
  const banner = '<aside role="note" data-fixture-banner style="padding:6px 12px;background:#0f172a;color:white;font:12px/1.5 system-ui">LOCAL SYNTHETIC FIXTURE · ' + escape(name) + ' · No account/API/transaction connector · Static controls inactive · <a data-fixture-navigation href="/index.html" style="color:white;text-decoration:underline">Scenario index</a><br><output id="qa-viewport">Viewport not measured until browser inspection</output><br>' + escape(scenarios[name]) + '</aside>';
  write(`${name}.html`, head(name) + banner + markup + script);
}
write('index.html', head('RSI-082 fixture index') + '<main style="font:16px/1.5 system-ui;padding:24px;max-width:960px"><h1>RSI-082 local-only Home fixtures</h1><p>Unchanged current production components rendered by real React/Next Link/Image. Synthetic resource hooks only. No auth, API, provider or transaction connection. All product controls are inert; the index links below are the only navigation. Error/recovered pages are separate renders, not proof of a browser retry click.</p><p>For a phone check, use an actual measured 390px browser viewport; no CSS width hack or phone evidence is generated here. Read the DOM viewport output or window.__RSI082_PREVIEW__. The current Home source has no separate indexing-pending API flag: the two indexer fixtures use existing loading and unavailable states.</p><output id="qa-viewport"></output><ul>' + Object.entries(scenarios).map(([name, description]) => '<li><a data-fixture-navigation href="/' + name + '.html">' + name + '</a> — ' + escape(description) + '</li>').join('') + '</ul></main>' + script);
const manifest = {
  owner: 'RSI-082 local static fixture preview', generatedAt: new Date().toISOString(),
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim(),
  sourceFiles: [...before, ...sourceStyles.map(file => ({ file, sha256: hashFile(file) })), ...sourceLayouts.map(file => ({ file, sha256: hashFile(file) }))],
  fontFiles: fonts.map(font => ({ file: font.file, sha256: font.sha256, bytes: font.bytes })),
  files: emitted, scenarios, transport: 'none; connect-src/form-action disabled; no hydration',
  sourceEdits: 0, resourceHooks: 'synthetic only; private provider and transaction modules never loaded',
  realNextLinkAndImage: true, retryClickTested: false, actualApiOrChainAcceptance: false,
  desktopOrPhoneBrowserAcceptance: 'not yet performed; must verify actual DOM viewport',
};
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify({ outputDirectory: output, scenarios: Object.keys(scenarios).length, files: emitted.length, sourceEdits: 0, serverStarted: false, blockedApiCalls: renderer.stats.blockedApiCalls, blockedTransactionCalls: renderer.stats.blockedTransactionCalls }));
