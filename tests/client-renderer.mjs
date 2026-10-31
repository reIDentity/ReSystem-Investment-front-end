import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(repository, 'package.json'));
const ts = require('typescript');

// Execute actual client components with real React hooks/DOM. Resource/transport
// mocks are explicit per test; no server module or live connector may be loaded.
export function clientRenderer(mocks = {}, expose = {}, clock = {}) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(repository, relative);
    if (!file.startsWith(path.join(repository, 'src/'))) throw new Error('Client test import outside src');
    if (cache.has(file)) return cache.get(file).exports;
    const localModule = { exports: {} }; cache.set(file, localModule);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    function imports(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.endsWith('.css')) return {};
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(repository, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
        const target = [base, `${base}.tsx`, `${base}.ts`].find(value => fs.existsSync(value) && fs.statSync(value).isFile());
        if (!target) throw new Error(`Unknown client test import: ${name}`);
        return load(path.relative(repository, target));
      }
      if (!['react', 'react-dom', 'react/jsx-runtime', 'swr', 'next/link', 'lucide-react', 'qrcode'].includes(name)) throw new Error(`Unmocked client dependency: ${name}`);
      return require(name);
    }
    const exposed = (expose[relative] || []).map(name => `module.exports.${name}=${name};`).join('\n');
    // Browser modules share an Error constructor; separate VM modules must too,
    // otherwise `error instanceof Error` incorrectly discards real client errors.
    vm.runInNewContext(code + '\n' + exposed, { module: localModule, exports: localModule.exports, require: imports, Error, window: clock.window || globalThis.window, document: globalThis.document, Event: globalThis.window?.Event || globalThis.Event, TextDecoder, FormData: globalThis.FormData, File: globalThis.File, AbortController, AbortSignal, fetch: (...args) => globalThis.fetch(...args), crypto: globalThis.crypto, URL, URLSearchParams, console, Date: clock.Date || Date, setTimeout: clock.setTimeout || setTimeout, clearTimeout: clock.clearTimeout || clearTimeout }, { filename: file });
    return localModule.exports;
  }
  return { load };
}
