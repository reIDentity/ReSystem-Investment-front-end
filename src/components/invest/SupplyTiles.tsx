const validAtomic = (value: string | null | undefined): value is string => typeof value === "string" && /^[0-9]+$/.test(value);

/** A proportional overview, never a map of individually reserved token IDs. */
export function SupplyTiles({ issued, maximum, selected = "0", reserved = "0", onSale, cells = 50, className = "", emphasizeAvailable = false }: { issued?: string; maximum?: string; selected?: string; reserved?: string; onSale?: string; cells?: 50 | 100; className?: string; emphasizeAvailable?: boolean }) {
  const known = validAtomic(issued) && validAtomic(maximum) && BigInt(maximum) > 0n && BigInt(issued) <= BigInt(maximum);
  const total = known ? BigInt(maximum) : 1n, minted = known ? BigInt(issued) : 0n;
  const locked = known && validAtomic(reserved) ? BigInt(reserved) : 0n;
  const available = onSale === undefined ? total - minted - locked : validAtomic(onSale) ? BigInt(onSale) : 0n;
  const consistent = known && available >= 0n && minted + available + locked <= total;
  const chosen = consistent && validAtomic(selected) && BigInt(selected) <= available ? BigInt(selected) : 0n;
  const colors = emphasizeAvailable ? { issued: "#13a56b", sale: "#0091ff", reserved: "#7c8da5" } : { issued: "var(--supply-issued,#d7dde7)", sale: "var(--supply-sale,#fff)", reserved: "var(--supply-reserved,#8998ad)" };
  const fill = (value: bigint) => { const clamped = value < 0n ? 0n : value > total ? total : value; const bps = clamped * 10000n / total; return `${bps / 100n}.${(bps % 100n).toString().padStart(2, "0")}%`; };
  return <div className={`iv-pd-supply-tiles ${className}`} aria-hidden="true">{Array.from({ length: cells }, (_, index) => {
    const start = BigInt(index) * total, issuedFill = fill(minted * BigInt(cells) - start), selectedFill = fill((minted + chosen) * BigInt(cells) - start);
    const availableFill = fill((minted + available) * BigInt(cells) - start), reserveStart = fill((total - locked) * BigInt(cells) - start);
    return <i key={index} style={consistent ? { background: `linear-gradient(to right,${colors.issued} 0% ${issuedFill},#0091ff ${issuedFill} ${selectedFill},${colors.sale} ${selectedFill} ${availableFill},var(--supply-future,#e7edf5) ${availableFill} ${reserveStart},${colors.reserved} ${reserveStart} 100%)` } : undefined} />;
  })}</div>;
}
