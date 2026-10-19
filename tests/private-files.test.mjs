import test from 'node:test';
import assert from 'node:assert/strict';
import { readPrivateAttachments, validatePrivateImage } from '../src/lib/platform/support-attachments.ts';
import { readSendQuote, inputAtomic } from '../src/lib/platform/send-quote.ts';
import { proxyConfig, proxyPlatform } from '../src/lib/platform/proxy.ts';

const record = (id = 'file1') => ({ id, ticketId: 'ticket1', messageId: 'message1', filename: 'synthetic.webp', mimeType: 'image/webp', sizeBytes: 10, sha256: 'a'.repeat(64), createdAt: new Date().toISOString(), deletedAt: null });
test('private image validation rejects unsupported/empty/oversized inputs; bounded metadata pagination retains removed records without hiding partial history', async () => {
  validatePrivateImage({ type: 'image/png', size: 3 * 1024 * 1024 });
  for (const file of [{ type: 'image/svg+xml', size: 1 }, { type: 'application/pdf', size: 10 }, { type: 'image/jpeg', size: 0 }, { type: 'image/png', size: 3 * 1024 * 1024 + 1 }]) assert.throws(() => validatePrivateImage(file));
  const paths = [];
  const files = await readPrivateAttachments('ticket1', async path => { paths.push(path); return path.includes('cursor=') ? { items: [{ ...record('file2'), filename: null, deletedAt: new Date().toISOString() }], nextCursor: null } : { items: [record()], nextCursor: 'cursor+2' }; });
  assert.equal(files.length, 2); assert.equal(files[1].filename, null); assert.match(paths[1], /cursor=cursor%2B2/);
  await assert.rejects(readPrivateAttachments('ticket1', async () => ({ items: [{ ...record(), ticketId: 'someone-else' }], nextCursor: null })));
  await assert.rejects(readPrivateAttachments('ticket1', async () => ({ items: [record()], nextCursor: 'repeat' })));
  let page = 0; await assert.rejects(readPrivateAttachments('ticket1', async () => ({ items: [record(`file${++page}`)], nextCursor: String(page) })), /limit/); assert.equal(page, 4);
});
const config = proxyConfig({ PLATFORM_API_BASE: 'http://127.0.0.1:3005/v1', PLATFORM_APP_ORIGIN: 'https://investor.example.invalid' });
const segments = ['support', 'ticket1', 'attachments', 'file1', 'content'];
test('private content crosses BFF only as bounded authenticated WebP attachment with no-store; hostile types and redirects fail closed', async () => {
  const request = new Request(`${config.origin}/api/platform/${segments.join('/')}`, { headers: { Cookie: 'resystem_session=private-session' } });
  let forwarded;
  const response = await proxyPlatform(request, segments, config, async (_url, init) => { forwarded = init; return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="private-name"' } }); });
  assert.equal(response.status, 200); assert.equal(response.headers.get('Content-Type'), 'image/webp'); assert.match(response.headers.get('Content-Disposition'), /^attachment;/); assert.ok(!response.headers.get('Content-Disposition').includes('private-name')); assert.match(response.headers.get('Cache-Control'), /private.*no-store/); assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff'); assert.equal(forwarded.headers.get('Cookie'), 'resystem_session=private-session');
  for (const reply of [new Response('<script>private</script>', { headers: { 'Content-Type': 'text/html' } }), new Response(null, { status: 302, headers: { Location: 'https://app.reidentity.net/private' } }), new Response(new Uint8Array(3 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'image/webp' } })]) assert.equal((await proxyPlatform(request, segments, config, async () => reply)).status, 502);
});
test('only the exact private upload accepts bounded multipart and unsafe Origin/CSRF cannot reach it', async () => {
  const path = ['support', 'ticket1', 'messages', 'message1', 'attachments']; let calls = 0;
  const fetcher = async (_url, init) => { calls++; assert.match(init.headers.get('content-type'), /multipart/); assert.equal(init.headers.get('idempotency-key'), 'synthetic-upload-key'); return Response.json({ id: 'file1' }, { status: 201 }); };
  const make = (origin, csrf = true) => new Request(`${config.origin}/api/platform/${path.join('/')}`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'multipart/form-data; boundary=synthetic', 'Idempotency-Key': 'synthetic-upload-key', ...(csrf ? { 'X-CSRF-Token': 'synthetic' } : {}) }, body: 'synthetic bounded multipart' });
  assert.equal((await proxyPlatform(make('https://evil.invalid'), path, config, fetcher)).status, 403);
  assert.equal((await proxyPlatform(make(config.origin, false), path, config, fetcher)).status, 403); assert.equal(calls, 0);
  assert.equal((await proxyPlatform(make(config.origin), path, config, fetcher)).status, 201); assert.equal(calls, 1);
  const bounded = bytes => new Request(`${config.origin}/api/platform/${path.join('/')}`, { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'multipart/form-data; boundary=synthetic', 'Idempotency-Key': 'synthetic-upload-key', 'X-CSRF-Token': 'synthetic' }, body: new Uint8Array(bytes) });
  assert.equal((await proxyPlatform(bounded(4 * 1024 * 1024), path, config, fetcher)).status, 201);
  const acceptedCalls = calls;
  assert.equal((await proxyPlatform(bounded(4 * 1024 * 1024 + 1), path, config, fetcher)).status, 413); assert.equal(calls, acceptedCalls);
  const denied = await proxyPlatform(make(config.origin), ['support', 'ticket1', 'messages'], config, fetcher); assert.equal(denied.status, 415); assert.equal(calls, acceptedCalls);
});
test('safe Max keeps huge atomic precision, exact gas reserve and the selected wallet/recipient/asset; malformed or expired quotes cannot become amounts', () => {
  const now = Date.parse('2026-10-19T12:00:00Z'), wallet = `0x${'1'.repeat(40)}`, recipient = `0x${'2'.repeat(40)}`;
  const native = '90071992547409931234567890', fee = '3000000000000000000';
  const quote = { chainId: 15324, wallet, recipient, asset: 'REAED', decimals: 18, maximumAtomic: (BigInt(native) - BigInt(fee)).toString(), nativeBalanceAtomic: native, tokenBalanceAtomic: null, estimatedFeeWei: fee, gasEstimate: '21000', canSend: true, quotedAt: new Date(now).toISOString(), expiresAt: new Date(now + 60000).toISOString(), source: 'INFRA pending RPC and verified UAT fee source' };
  assert.equal(inputAtomic(readSendQuote(quote, wallet, recipient, 'REAED', now).maximumAtomic, 18), '90071989.54740993123456789');
  const token = { ...quote, asset: 'USDT', decimals: 6, maximumAtomic: '9007199254740993123456', tokenBalanceAtomic: '9007199254740993123456' };
  assert.equal(inputAtomic(readSendQuote(token, wallet, recipient, 'USDT', now).maximumAtomic, 6), '9007199254740993.123456');
  for (const change of [{ chainId: 1 }, { wallet: recipient }, { recipient: wallet }, { asset: 'USDT' }, { decimals: 6 }, { maximumAtomic: native }, { estimatedFeeWei: '0' }, { expiresAt: new Date(now).toISOString() }, { maximumAtomic: '1.2' }]) assert.throws(() => readSendQuote({ ...quote, ...change }, wallet, recipient, 'REAED', now));
  assert.throws(() => readSendQuote({ ...quote, canSend: false, maximumAtomic: '0', gasEstimate: null }, wallet, recipient, 'REAED', now), /reserve/);
});
