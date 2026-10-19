import type { LiveListing } from "./types";

export type ListingQuote = LiveListing & { quantity: string; amountAtomic: string };
const uint = (value: unknown): value is string => typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value) && BigInt(value) < 2n ** 256n;
const address = (value: unknown): value is string => typeof value === "string" && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value);

/** Use only a fresh quote for the exact immutable listing and requested quantity. */
export function currentListingQuote(value: unknown, listing: LiveListing, quantity: string, now = Date.now()): ListingQuote | undefined {
  if (!value || typeof value !== "object" || !listing || !address(listing.project) || !address(listing.seller) || !["REAED", "USDT"].includes(listing.asset) || !uint(quantity) || BigInt(quantity) === 0n) return;
  const quote = value as Record<string, unknown>;
  if (quote.id !== listing.id || quote.quantity !== quantity || quote.asset !== listing.asset || quote.unitPriceAtomic !== listing.unitPriceAtomic || !address(quote.project) || !address(quote.seller) || quote.project.toLowerCase() !== listing.project.toLowerCase() || quote.seller.toLowerCase() !== listing.seller.toLowerCase() || quote.cancelled !== false) return;
  if (!uint(quote.unitPriceAtomic) || BigInt(quote.unitPriceAtomic) === 0n || !uint(quote.amountAtomic) || !uint(quote.remaining) || !uint(quote.availableQuantity) || !uint(quote.expiry)) return;
  if (BigInt(quote.expiry) * 1000n <= BigInt(Math.floor(now)) || BigInt(quote.availableQuantity) > BigInt(quote.remaining) || BigInt(quantity) > BigInt(quote.availableQuantity) || BigInt(quote.amountAtomic) !== BigInt(quote.unitPriceAtomic) * BigInt(quantity)) return;
  return quote as ListingQuote;
}
