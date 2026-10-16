export type PaymentAsset = "REAED" | "USDT";
export const decimals = (asset: PaymentAsset) => asset === "USDT" ? 6 : 18;
export const assetLabel = (asset: string) => asset === "REAED" ? "reAED" : asset;
export function atomic(value: string, places: number): string {
  if (!new RegExp(`^(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,${places}})?$`).test(value)) throw new Error(`Enter a positive amount with up to ${places} decimals.`);
  const [whole, fraction = ""] = value.split("."); const amount = BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, "0"));
  if (amount <= 0n || amount >= 2n ** 256n) throw new Error("Amount is outside the supported range."); return amount.toString();
}
export function whole(value: string): string {
  if (!/^[1-9][0-9]*$/.test(value) || BigInt(value) > 10n ** 18n) throw new Error("Enter a whole fraction quantity greater than zero."); return value;
}
export function validWhole(value: string): boolean {
  return /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= 10n ** 18n;
}
export function units(value: string | null | undefined, places: number, maxPlaces = places): string {
  if (value == null || !/^[0-9]+$/.test(value)) return "Unavailable";
  const padded = value.padStart(places + 1, "0"); const integer = places ? padded.slice(0, -places) : padded;
  const fraction = places ? padded.slice(-places).slice(0, maxPlaces).replace(/0+$/, "") : "";
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
}
export function percentage(numerator: string, denominator: string): string {
  if (!/^[0-9]+$/.test(numerator) || !/^[0-9]+$/.test(denominator) || BigInt(denominator) === 0n) return "—";
  const bps = BigInt(numerator) * 10000n / BigInt(denominator); return `${bps / 100n}.${(bps % 100n).toString().padStart(2, "0")}%`;
}
export function safeAddress(value: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value) || /^0x0{40}$/i.test(value)) throw new Error("Enter a valid, nonzero INFRA wallet address."); return value;
}
export function safeApproval(url: string | null, origin: string): string | null {
  if (!url) return null; try { const target = new URL(url); return target.protocol === "https:" && target.origin === origin && !target.username && !target.password ? target.href : null; } catch { return null; }
}
export const explorer = (hash: string | null) => hash && /^0x[0-9a-f]{64}$/i.test(hash) ? `https://uat.scan.infraworld.org/tx/${hash}` : null;

export function expiryTimestamp(value: string, nowMilliseconds = Date.now()): number {
  const until = Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isSafeInteger(until) || until <= nowMilliseconds / 1000 || until > nowMilliseconds / 1000 + 365 * 86400) throw new Error("Choose an expiry within the next year.");
  return until;
}
