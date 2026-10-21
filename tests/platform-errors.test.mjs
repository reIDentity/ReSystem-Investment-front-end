import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { clientRenderer } from './client-renderer.mjs';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const { platformErrorMessage } = clientRenderer().load('src/lib/platform/errors.ts');
const reason = 'Insufficient native balance including gas reserve';
const deployedError = { error: { code: 'HTTP_400', message: { message: reason, error: 'Bad Request', statusCode: 400 } }, statusCode: 400 };

test('the deployed nested rejection reaches the real HTTP client with a deposit instruction', async () => {
  globalThis.fetch = async () => Response.json(deployedError, { status: 400 });
  const { api, PlatformError } = clientRenderer().load('src/lib/platform/client.ts');
  await assert.rejects(api('wallet'), error => {
    assert.ok(error instanceof PlatformError);
    assert.equal(error.status, 400);
    assert.match(error.message, /Not enough reAED.*payment and the network fee.*Add reAED.*INFRA/);
    assert.match(error.message, /USDT cannot pay the network fee/);
    assert.doesNotMatch(error.message, /Refresh and try again|HTTP_400|Bad Request/);
    return true;
  });
});

test('flat BFF and Nest error shapes have the same safe, actionable meaning', () => {
  const expected = platformErrorMessage(deployedError, 400);
  assert.equal(platformErrorMessage({ error: { message: reason } }, 400), expected);
  assert.equal(platformErrorMessage({ message: reason }, 400), expected);
  assert.match(platformErrorMessage({ error: { message: { message: 'The primary sale is not open for purchases.' } } }, 400), /sale is closed/);
  assert.match(platformErrorMessage({ error: { message: 'INFRA fee quote unavailable or inconsistent; prepare again after verification' } }, 503), /network fee could not be verified/);
  assert.match(platformErrorMessage({ error: { message: 'Network fee quote increased; prepare and review a new intent' } }, 400), /fresh one before approving/);
});

test('validation arrays identify the field without echoing submitted data', () => {
  for (const body of [{ message: ['quantity must be a string'] }, { error: { message: { message: ['quantity must be a string'] } } }]) {
    assert.match(platformErrorMessage(body, 400), /whole fraction quantity/);
  }
  assert.equal(platformErrorMessage({ message: ['privateField contains a private submitted value'] }, 400), 'Some details are invalid. Check the form and try again.');
});

test('unknown diagnostics, HTML, malformed envelopes and server failures never leak to users', () => {
  const secretDiagnostic = 'Prisma failure /private/service/path auth_token=synthetic-private-value <script>alert(1)</script>';
  for (const status of [400, 403, 404, 409, 429, 500, 503]) {
    for (const body of [null, {}, { error: { message: secretDiagnostic } }, { error: { message: { message: secretDiagnostic } } }, { message: [secretDiagnostic] }]) {
      const message = platformErrorMessage(body, status);
      assert.ok(message.length > 10);
      assert.doesNotMatch(message, /Prisma|private|auth_token|script|synthetic/);
    }
  }
  assert.match(platformErrorMessage(deployedError, 401), /session expired.*reID/);
});
