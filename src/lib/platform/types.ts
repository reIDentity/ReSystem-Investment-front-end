import type { ProjectResponse, PortfolioHolding, PortfolioResponse, RevenueSeries } from "./api.generated";
import type { PaymentAsset } from "./money";
export type HistoryCoverage = { status: "complete" | "partial" | "pending"; sources: { source: string; complete: boolean; updatedAt: string | null; hasNextPage: boolean }[] };
export type Page<T> = { items: T[]; nextCursor: string | null; provenance?: { source?: string; indexedBlock?: string; confirmed_block?: string; updatedAt?: string; updated_at?: string; historyCoverage?: HistoryCoverage } };
export type Holding = PortfolioHolding;
export type Portfolio = PortfolioResponse;
export type Project = ProjectResponse & { media?: { cid: string; mimeType: string; filename: string }[]; revisions?: { version: number; metadataUri: string; createdAt: string }[] };
export type Quote = { projectId?: string; listingId?: string; quantity: string; asset: PaymentAsset; amountAtomic: string; decimals: number; chainId: 15324 };
export type ProjectState = { totalSupply: string; remainingSupply: string; maxFractions: string; saleOpen: boolean; purchasePaused: boolean; fundingPaused: boolean; headBlock: string; source: string };
export type ChainActivity = { chain_id: number; tx_hash: string; activity_index: string; block_number: string; timestamp: string; type: string; event_name: string | null; asset: string | null; amount_atomic: string | null; args?: Record<string, string | string[] | number | boolean>; direction: "incoming" | "outgoing" | null; status: string; explorerUrl: string };
export type Projection<T extends Record<string, unknown> = Record<string, unknown>> = { entity_id: string; block_number: string; data: T };
export type ListingData = { listingId: string; seller: string; project: string; asset: string; quantity: string; unitPrice: string; remaining: string; expiry: string; cancelled: boolean; availableQuantity?: string };
export type RevenueData = { project: string; asset: 0 | 1 | "0" | "1" | "REAED" | "USDT"; amount: string; issuedSupply: string; fundingReference: string; reportReference: string; txHash: string };

export type RewardView = { series?: RevenueSeries; assets: { asset: PaymentAsset; decimals: number; fundedAtomic: string; claimedTotalAtomic: string; reserveAtomic: string; claimableAtomic?: string; claimedAtomic?: string }[]; history: { status: "available" | "unavailable"; items: { tx_hash: string; block_number: string; args_json: RevenueData }[] | null } };
export type LiveListing = { id: string; seller: string; project: string; asset: PaymentAsset; unitPriceAtomic: string; remaining: string; availableQuantity: string; expiry: string; cancelled: boolean; source: string };
