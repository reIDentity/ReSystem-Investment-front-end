export type AllocationSegment = {
  key: string;
  label: string;
  count: string;
  percentage: string;
  start: number;
  size: number;
};

type PhasedAllocation = {
  totalBlocks: string;
  reservedBlocks: string;
  whitelistBlocks: string;
  publicBlocks: string;
  unallocatedBlocks: string;
};

const whole = (value: string | undefined): bigint | null =>
  typeof value === "string" && /^[0-9]{1,78}$/.test(value)
    ? BigInt(value)
    : null;

/** Display precision only; allocation counts and all partition checks stay exact. */
export function allocationPercentage(value: string, total: string): string {
  const count = whole(value), maximum = whole(total);
  if (count === null || maximum === null || maximum === 0n || count > maximum)
    return "—";
  const basisPoints = count * 10000n / maximum;
  if (count > 0n && basisPoints === 0n) return "<0.01%";
  return `${basisPoints / 100n}.${(basisPoints % 100n).toString().padStart(2, "0")}%`;
}

/** A disjoint, exact partition: issued and reserved blocks are never buyable. */
export function supplyAvailabilitySegments({ total, issued, remaining, reserved, saleLimit }: {
  total?: string;
  issued?: string;
  remaining?: string;
  reserved?: string;
  saleLimit: bigint | null;
}): AllocationSegment[] | null {
  const maximum = whole(total), minted = whole(issued), unsold = whole(remaining), locked = whole(reserved);
  if (maximum === null || maximum === 0n || minted === null || unsold === null || locked === null ||
    minted + unsold + locked !== maximum || saleLimit === null || saleLimit < 0n || saleLimit > unsold) return null;
  const parts: [string, string, bigint][] = [
    ["issued", "Issued blocks", minted],
    ["sale", "Available now", saleLimit],
    ["future", "Not on sale", unsold - saleLimit],
    ["reserved", "Reserved · locked", locked],
  ];
  let cumulative = 0n;
  return parts.map(([key, label, count]) => {
    const start = cumulative * 10000n / maximum;
    cumulative += count;
    const end = cumulative * 10000n / maximum;
    return { key, label, count: String(count), percentage: allocationPercentage(String(count), String(maximum)),
      start: Number(start), size: Number(end - start) };
  });
}

/**
 * A non-overlapping partition of the observed supply. In phased projects the
 * issued shares already belong to the phase allocations, so they are not added
 * as another segment. Aggregate fields remain valid across phase-list pages.
 */
export function shareAllocationSegments({
  total,
  issued,
  remaining,
  phased,
  allocation,
  saleLimit,
}: {
  total?: string;
  issued?: string;
  remaining?: string;
  phased: boolean;
  allocation?: PhasedAllocation;
  saleLimit: bigint | null;
}): AllocationSegment[] | null {
  const maximum = whole(total), minted = whole(issued);
  if (maximum === null || maximum === 0n || (minted !== null && minted > maximum))
    return null;
  let parts: [string, string, bigint][];
  if (phased) {
    if (!allocation || whole(allocation.totalBlocks) !== maximum) return null;
    const reserved = whole(allocation.reservedBlocks), whitelist = whole(allocation.whitelistBlocks),
      publicSale = whole(allocation.publicBlocks), unallocated = whole(allocation.unallocatedBlocks);
    if (reserved === null || whitelist === null || publicSale === null || unallocated === null ||
      reserved + whitelist + publicSale + unallocated !== maximum ||
      (minted !== null && minted > whitelist + publicSale)) return null;
    parts = [
      ["reserved", "Reserved · locked", reserved],
      ["whitelist", "Early-access phases", whitelist],
      ["public", "Public phases", publicSale],
      ["future", "Unallocated · future phases", unallocated],
    ];
  } else {
    const unsold = whole(remaining);
    if (minted === null || unsold === null || minted + unsold !== maximum ||
      saleLimit === null || saleLimit < 0n || saleLimit > unsold) return null;
    parts = [
      ["issued", "Issued shares", minted],
      ["sale", "On sale now", saleLimit],
      ["future", "Not on sale", unsold - saleLimit],
    ];
  }
  let cumulative = 0n;
  return parts.map(([key, label, count]) => {
    const start = cumulative * 10000n / maximum;
    cumulative += count;
    const end = cumulative * 10000n / maximum;
    return { key, label, count: String(count), percentage: allocationPercentage(String(count), String(maximum)),
      start: Number(start), size: Number(end - start) };
  });
}
