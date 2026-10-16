export const INFRA_CHAIN_ID = 15324;
export const INFRA_EXPLORER = "https://uat.scan.infraworld.org";
export const INFRA_USDT = "0x576bb1a9fcb1115c3df5f66ac8d12245fd7dadcf";

export type DepositAsset = "reAED" | "USDT";
export type Deposit = {
  id: string;
  hash: string;
  asset: DepositAsset;
  amount: string;
  from: string;
  timestamp: string;
  blockNumber: number;
};
export type DepositData = {
  wallet: string;
  chainId: number;
  indexedBlock: number | null;
  deposits: Deposit[];
  warnings: string[];
  updatedAt: string;
};
export type DepositResponse = DepositData & { qr: string };

type Row = Record<string, unknown>;
function record(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}
function address(value: unknown) {
  return String(record(value).hash ?? "").toLowerCase();
}

/** Decimal strings preserve token precision, including amounts below a cent. */
export function formatUnits(value: string, decimals: number) {
  if (!/^\d+$/.test(value) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error("Invalid token amount");
  const units = BigInt(value).toString().padStart(decimals + 1, "0");
  if (!decimals) return units;
  const fraction = units.slice(-decimals).replace(/0+$/, "");
  return `${units.slice(0, -decimals)}${fraction ? `.${fraction}` : ""}`;
}

export function normalizeDeposits(wallet: string, native: unknown[], tokens: unknown[], internal: unknown[]): Deposit[] {
  const target = wallet.toLowerCase();
  const deposits: Deposit[] = [];
  function add(row: Row, asset: DepositAsset, hash: unknown, rawValue: unknown, decimals: number, id: string) {
    const from = address(row.from);
    const blockNumber = Number(row.block_number);
    const timestamp = String(row.timestamp ?? "");
    if (address(row.to) !== target || from === target || !/^0x[0-9a-f]{40}$/.test(from) || typeof hash !== "string" || !/^0x[0-9a-f]{64}$/i.test(hash) || typeof rawValue !== "string" || !/^\d+$/.test(rawValue) || BigInt(rawValue) === BigInt(0) || row.block_number === null || row.block_number === undefined || !Number.isSafeInteger(blockNumber) || blockNumber < 0 || !Number.isFinite(Date.parse(timestamp))) return;
    deposits.push({ id, hash, asset, amount: formatUnits(rawValue, decimals), from, timestamp, blockNumber });
  }
  for (const value of native) {
    const row = record(value);
    if (row.status !== "ok" || row.result !== "success") continue;
    add(row, "reAED", row.hash, row.value, 18, `native:${row.hash}`);
  }
  const nativeHashes = new Set(deposits.map(item => item.hash.toLowerCase()));
  for (const value of internal) {
    const row = record(value);
    if (row.success !== true || row.error || (Number(row.index) === 0 && nativeHashes.has(String(row.transaction_hash).toLowerCase()))) continue;
    add(row, "reAED", row.transaction_hash, row.value, 18, `internal:${row.transaction_hash}:${row.index}`);
  }
  for (const value of tokens) {
    const row = record(value);
    const token = record(row.token);
    // Match the actual INFRA USDT contract, never an arbitrary token's symbol.
    if (String(token.address).toLowerCase() !== INFRA_USDT || token.type !== "ERC-20" || Number(token.decimals) !== 6 || row.status === "error") continue;
    add(row, "USDT", row.transaction_hash, record(row.total).value, 6, `usdt:${row.transaction_hash}:${row.log_index}`);
  }
  return [...new Map(deposits.map(item => [item.id, item])).values()].sort((a, b) => b.blockNumber - a.blockNumber || Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 8);
}

/** Only the server route calls this; it supplies the verified session wallet. */
export async function loadDeposits(wallet: string, fetcher: typeof fetch = fetch): Promise<DepositData> {
  if (!/^0x[0-9a-f]{40}$/i.test(wallet)) throw new Error("Invalid wallet");
  const root = `${INFRA_EXPLORER}/api/v2`;
  const sources = [
    `${root}/addresses/${wallet}/transactions?filter=to`,
    `${root}/addresses/${wallet}/token-transfers?filter=to&type=ERC-20&token=${INFRA_USDT}`,
    `${root}/addresses/${wallet}/internal-transactions?filter=to`,
    `${root}/stats`,
  ];
  const results = await Promise.allSettled(sources.map(async url => {
    const response = await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Explorer unavailable");
    const body = record(await response.json());
    if (url !== sources[3] && !Array.isArray(body.items)) throw new Error("Invalid explorer response");
    return body;
  }));
  if (results.slice(0, 3).every(result => result.status === "rejected")) throw new Error("Deposit history is unavailable. Please try again.");
  const data = results.map(result => result.status === "fulfilled" ? result.value : null);
  const warnings: string[] = [];
  if (!data[0]) warnings.push("reAED transfer history could not be loaded.");
  if (!data[1]) warnings.push("USDT transfer history could not be loaded.");
  if (!data[2]) warnings.push("Contract-to-wallet transfer history could not be loaded.");
  const block = Number(data[3]?.total_blocks);
  return {
    wallet, chainId: INFRA_CHAIN_ID,
    indexedBlock: data[3] && Number.isSafeInteger(block) && block > 0 ? block : null,
    deposits: normalizeDeposits(wallet, data[0]?.items as unknown[] ?? [], data[1]?.items as unknown[] ?? [], data[2]?.items as unknown[] ?? []),
    warnings, updatedAt: new Date().toISOString(),
  };
}
