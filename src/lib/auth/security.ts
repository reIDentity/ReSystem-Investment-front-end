import { createHash, timingSafeEqual } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";

export type InvestorUser = {
  id: string;
  name: string;
  wallet: string;
  kycStatus: "approved" | "pending" | "rejected" | "incomplete" | "not_requested";
};

export const SESSION_COOKIE = "resystem_investor_session";
export const SESSION_SECONDS = 8 * 60 * 60;
const issuer = "resystem-investment";

function sessionKey(secret: string) {
  if (secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return createHash("sha256").update(secret).digest();
}

export function safeInvestorPath(raw: string | null | undefined) {
  if (!raw || !raw.startsWith("/invest/") || raw.length > 512 || /[\\\u0000-\u0020\u007f]/.test(raw)) return "/invest/home";
  try {
    const base = "https://investment.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base || !url.pathname.startsWith("/invest/") || url.pathname.startsWith("/invest//")) return "/invest/home";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/invest/home"; }
}

export function statesMatch(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export function parseInvestorUser(value: unknown): InvestorUser | null {
  if (!value || typeof value !== "object") return null;
  const user = value as Record<string, unknown>;
  if (typeof user.id !== "string" || !user.id || user.id.length > 200 || typeof user.name !== "string" || !user.name || user.name.length > 120 || typeof user.wallet !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(user.wallet)) return null;
  const kycStatus = ["approved", "pending", "rejected"].includes(String(user.kycStatus)) ? user.kycStatus as InvestorUser["kycStatus"] : "incomplete";
  return { id: user.id, name: user.name, wallet: user.wallet, kycStatus };
}

export async function sealSession(user: InvestorUser, secret: string) {
  const identity = parseInvestorUser(user);
  if (!identity) throw new Error("Invalid investor identity");
  return new EncryptJWT({ user: identity }).setProtectedHeader({ alg: "dir", enc: "A256GCM" }).setIssuedAt().setIssuer(issuer).setAudience("investor-app").setSubject(identity.id).setExpirationTime(`${SESSION_SECONDS}s`).encrypt(sessionKey(secret));
}

export async function openSession(token: string | undefined, secret: string | undefined): Promise<InvestorUser | null> {
  if (!token || !secret || token.length > 4096) return null;
  try {
    const { payload } = await jwtDecrypt(token, sessionKey(secret), { issuer, audience: "investor-app", keyManagementAlgorithms: ["dir"], contentEncryptionAlgorithms: ["A256GCM"], maxTokenAge: `${SESSION_SECONDS}s` });
    const user = parseInvestorUser(payload.user);
    return user?.id === payload.sub ? user : null;
  } catch { return null; }
}
