import test from "node:test";
import assert from "node:assert/strict";
import { EncryptJWT } from "jose";
import { createHash } from "node:crypto";
import { openSession, parseInvestorUser, safeInvestorPath, sealSession, statesMatch } from "../src/lib/auth/security.ts";

const secret = "test-session-secret-used-only-in-tests-123456";
const user = { id: "investor-1", name: "Test Investor", wallet: "0x1234567890123456789012345678901234567890", kycStatus: "approved" };

test("session encrypts identity, rejects tampering and the wrong key", async () => {
  const token = await sealSession(user, secret);
  assert.deepEqual(await openSession(token, secret), user);
  assert.equal(token.includes(user.name), false);
  assert.equal(await openSession(`${token.slice(0, -10)}invalidtag`, secret), null);
  assert.equal(await openSession(token, `${secret}wrong`), null);
  assert.equal(await openSession(undefined, secret), null);
  assert.equal(await openSession(token, undefined), null);
  await assert.rejects(sealSession(user, "too-short"));
});

test("expired sessions and sessions with a different audience are refused", async () => {
  const key = createHash("sha256").update(secret).digest();
  for (const [audience, expiry] of [["investor-app", "-1s"], ["another-app", "1h"]]) {
    const token = await new EncryptJWT({ user }).setProtectedHeader({ alg: "dir", enc: "A256GCM" }).setIssuedAt().setSubject(user.id).setIssuer("resystem-investment").setAudience(audience).setExpirationTime(expiry).encrypt(key);
    assert.equal(await openSession(token, secret), null);
  }
});

test("post-login redirect stays inside the investor app", () => {
  assert.equal(safeInvestorPath("/invest/products/fractionaire?tab=shares#invest"), "/invest/products/fractionaire?tab=shares#invest");
  for (const path of [undefined, "https://evil.example", "//evil.example", "/invest/../../api/auth/reid/start", "/invest/\\evil.example", "/invest/\nattack", "/invest", "/api/auth/reid/start", "/invest/" + "x".repeat(513)]) {
    assert.equal(safeInvestorPath(path), "/invest/home");
  }
});

test("OAuth state must match exactly", () => {
  assert.equal(statesMatch("state-123", "state-123"), true);
  assert.equal(statesMatch("wrong-123", "state-123"), false);
  assert.equal(statesMatch("", ""), false);
  assert.equal(statesMatch("state", "state-123"), false);
});

test("identity requires a user and a valid wallet; unknown KYC stays unverified", () => {
  assert.equal(parseInvestorUser({ ...user, wallet: "invalid" }), null);
  assert.equal(parseInvestorUser({ ...user, id: "" }), null);
  assert.equal(parseInvestorUser({ ...user, kycStatus: "unknown" }).kycStatus, "incomplete");
});
