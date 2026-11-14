import Link from "next/link";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import { units } from "@/lib/platform/money";
import { shareAllocationSegments, supplyAvailabilitySegments, type AllocationSegment } from "@/lib/platform/share-allocation";
import styles from "./ProjectAllocationDesign.module.css";

type PhasedSale = Extract<SalePhasesResponse, { mode: "phased" }>;
type Phase = PhasedSale["phases"][number];
type Group = { part: AllocationSegment; phases: Phase[]; sold: bigint | null; locked: boolean; mixed: boolean; checkAccess: boolean };
const whole = (value: string | undefined): value is string => typeof value === "string" && /^[0-9]{1,78}$/.test(value);
const count = (value: string) => units(value, 0);
const validPhase = (phase: Phase) => [phase.blocks, phase.sold, phase.remaining, phase.unitPriceAtomic].every(whole)
  && BigInt(phase.blocks) > 0n && BigInt(phase.sold) + BigInt(phase.remaining) === BigInt(phase.blocks);
const progress = (sold: bigint, total: bigint) => Number(sold * 10000n / total) / 100;
const colors: Record<string, string> = { reserved: "#475467", whitelist: "#087f8c", public: "var(--color-brand,#0091ff)", future: "#98a2b3", issued: "#fdb022", sale: "var(--color-brand,#0091ff)" };

function Lock() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="2" fill="currentColor" /><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

/** 100 proportional cells, including mixed-colour boundary cells for uneven supplies. */
function groupedTiles(groups: Group[], maximum: bigint) {
  let cumulative = 0n;
  const bands = groups.flatMap(group => {
    const start = cumulative;
    cumulative += BigInt(group.part.count);
    const sold = group.sold ?? 0n;
    return [
      ...(sold > 0n ? [{ start, end: start + sold, key: group.part.key, color: "#fdb022" }] : []),
      { start: start + sold, end: cumulative, key: group.part.key, color: colors[group.part.key] },
    ].filter(band => band.end > band.start);
  });
  const tiles = new Map<string, { index: number; fill: string; label: string }[]>();
  for (let index = 0; index < 100; index++) {
    const left = BigInt(index) * maximum, right = left + maximum;
    const overlaps = bands.filter(band => band.start * 100n < right && band.end * 100n > left);
    const key = overlaps[0].key;
    const stops = overlaps.map(band => {
      const start = band.start * 100n > left ? band.start * 100n - left : 0n;
      const end = band.end * 100n < right ? band.end * 100n - left : maximum;
      return `${band.color} ${Number(start * 10000n / maximum) / 100}% ${Number(end * 10000n / maximum) / 100}%`;
    });
    const labels = [...new Set(overlaps.map(band => groups.find(group => group.part.key === band.key)!.part.label))];
    const list = tiles.get(key) ?? [];
    list.push({ index, fill: `linear-gradient(to right, ${stops.join(", ")})`, label: labels.join(" / ") });
    tiles.set(key, list);
  }
  return tiles;
}

/** Confirmed availability and purpose allocations are separate, exact partitions. */
export function ProjectAllocation({ total, issued, remaining, phased, view, saleLimit, loading = false, publicView = false, contributionHref }: {
  total?: string;
  issued?: string;
  remaining?: string;
  phased: boolean;
  view?: PhasedSale;
  saleLimit: bigint | null;
  loading?: boolean;
  publicView?: boolean;
  contributionHref?: string;
}) {
  const availability = supplyAvailabilitySegments({ total, issued, remaining, reserved: phased ? view?.reservedBlocks : "0", saleLimit });
  const allocation = phased ? shareAllocationSegments({ total, issued, remaining, phased, allocation: view, saleLimit }) : null;
  const observations = view ? [view.current, ...(Array.isArray(view.phases) ? view.phases : [])].filter((phase): phase is Phase => !!phase)
    .filter((phase, index, all) => all.findIndex(item => item.id === phase.id) === index) : [];
  const visiblePhases = observations.filter(validPhase);
  const phaseTotalsConsistent = !phased || (!!availability && !!allocation && [true, false].every(whitelist => {
    const bucket = allocation.find(part => part.key === (whitelist ? "whitelist" : "public"));
    return visiblePhases.filter(phase => phase.whitelist === whitelist).reduce((sum, phase) => sum + BigInt(phase.blocks), 0n) <= BigInt(bucket!.count);
  }) && visiblePhases.reduce((sum, phase) => sum + BigInt(phase.sold), 0n) <= BigInt(issued ?? "0"));
  if (!availability || (phased && !allocation) || !phaseTotalsConsistent) return <div className={styles.empty} role="status">
    {loading ? "Checking block allocation…" : "Block allocation is unavailable. Refresh the project to check again."}
  </div>;

  const parts = (phased ? allocation! : availability).filter(part => BigInt(part.count) > 0n);
  const groups: Group[] = parts.map(part => {
    const phases = visiblePhases.filter(phase => part.key === (phase.whitelist ? "whitelist" : "public"));
    const observedBlocks = phases.reduce((sum, phase) => sum + BigInt(phase.blocks), 0n);
    const observedSold = phases.reduce((sum, phase) => sum + BigInt(phase.sold), 0n);
    const complete = observedBlocks === BigInt(part.count) && observedSold <= BigInt(issued!);
    const active = phases.find(phase => phase.id === view?.current?.id && phase.open && phase.status === "Active" && saleLimit! > 0n);
    const mixed = !!active && BigInt(active.blocks) < BigInt(part.count);
    const checkAccess = part.key === "whitelist" && publicView;
    return { part, phases, sold: phased && ["whitelist", "public"].includes(part.key) && complete ? observedSold : null,
      mixed, checkAccess,
      locked: part.key === "reserved" || part.key === "future" || (phased && !active) || mixed || (part.key === "whitelist" && (publicView || view?.walletApproved !== true)) };
  });
  const tiles = groupedTiles(groups, BigInt(total!));
  const safeHref = contributionHref && !/[\\\u0000-\u0020]/.test(contributionHref) && (/^\/(?!\/)/.test(contributionHref) || contributionHref.startsWith("#")) ? contributionHref : undefined;

  const phaseAccess = (phase: Phase) => {
    const active = phase.id === view?.current?.id && phase.open && phase.status === "Active" && saleLimit! > 0n && BigInt(phase.remaining) > 0n;
    if (!active) return { title: phase.status === "Paused" ? "Phase paused" : phase.status === "Closed" ? "Phase closed" : "Not open for purchases", note: "These blocks cannot currently be purchased.", canBuy: false };
    if (publicView) return { title: "Connect to check your access", note: phase.whitelist ? "Only approved wallets can buy in this early-access phase." : "Connect with reID to review your investment.", canBuy: true };
    if (phase.whitelist && view?.walletApproved !== true) return { title: view?.walletApproved === false ? "Your wallet is not whitelisted" : "Wallet access unverified", note: view?.walletApproved === false ? "Only approved wallets can buy in this phase. Contact support about early access." : "Refresh the project to check your early-access eligibility.", canBuy: false };
    return { title: phase.whitelist ? "Your wallet is approved" : "Open to all investors", note: "Choose your quantity and review the exact cost before approving.", canBuy: true };
  };

  return <section className={styles.allocation} aria-label="Project block allocation">
    <header className={styles.heading}><div><span className={styles.eyebrow}>Share allocation</span><h2>{count(total!)} total blocks</h2><p>See how blocks are allocated and what is available to buy now.</p></div>
      <span className={styles.summaryBadge}>{count(saleLimit!.toString())} on sale now</span>
    </header>

    <div className={styles.purposeBar} role="img" aria-label={(phased ? allocation! : availability).map(part => `${part.label}: ${count(part.count)} blocks, ${part.percentage}`).join("; ")}>
      {groups.map(({ part, sold, locked }) => <div key={part.key} className={`${styles.segment} ${locked ? styles.hatched : ""}`} style={{ flexGrow: part.size, backgroundColor: colors[part.key] }}>
        {sold !== null && sold > 0n && <i className={styles.soldOverlay} style={{ width: `${progress(sold, BigInt(part.count))}%` }} />}
        <span style={part.key === "issued" ? { color: "#344054", textShadow: "none" } : undefined}>{locked && <Lock />}{part.label} · {count(part.count)}</span>
      </div>)}
    </div>

    {phased && <dl className={styles.purposeLegend} aria-label="Allocation by purpose">{allocation!.map(part => <div key={part.key}><dt><i style={{ backgroundColor: colors[part.key] }} />{part.label}</dt><dd>{count(part.count)} <span>{part.percentage}</span></dd></div>)}</dl>}

    <div className={styles.body}>
      <div className={styles.gridWrap}>
        <div className={styles.groupedGrid} aria-hidden="true">{groups.map(group => <div className={styles.tileGroup} key={group.part.key} data-allocation-group={group.part.key}>
          <div className={styles.groupHeading}><i style={{ backgroundColor: colors[group.part.key] }} /><b>{group.part.label}</b><span>{count(group.part.count)}</span>{group.locked && <small><Lock />{group.checkAccess ? "Sign in to check" : group.mixed ? "Includes locked phases" : "Locked"}</small>}</div>
          {(tiles.get(group.part.key)?.length ?? 0) > 0 ? <div className={styles.tiles}>{tiles.get(group.part.key)!.map(tile => <i key={tile.index} data-allocation-tile title={`1% of total supply · ${tile.label}`} className={`${styles.tile} ${group.locked ? styles.hatched : ""}`} style={{ backgroundImage: `${group.locked ? "repeating-linear-gradient(135deg,rgba(255,255,255,.16) 0 3px,transparent 3px 7px)," : ""}${tile.fill}` }} />)}</div> : <p className={styles.tinyAllocation}>Less than one tile. See the exact allocation count above.</p>}
        </div>)}</div>
        <p className={styles.tileCaption}>100 tiles · 1% of the total per tile. Boundary tiles may contain multiple colours.</p>
        <div className={styles.colorKey}><span><i style={{ backgroundColor: "#fdb022" }} />Issued / known sold</span><span><Lock />Locked allocation</span></div>
        <p className={styles.tileCaption}>A proportional overview, not a map of individual token IDs. Sold colours appear only where the phase breakdown is known. A group may include locked phases; check the phase cards for what is open.</p>
      </div>

      <div className={styles.cards} aria-label={phased ? "Visible sale phases" : "Public sale allocation"}>
        {groups.map(group => <article key={group.part.key} className={`${styles.card} ${group.part.key === "reserved" ? styles.reserveCard : group.part.key === "whitelist" ? styles.whitelistCard : group.part.key === "public" ? styles.publicCard : ""}`} style={{ borderColor: group.part.key === "whitelist" ? "#b3e4ff" : undefined }}>
          <div className={styles.cardHeading}><i style={{ backgroundColor: colors[group.part.key] }} /><h3>{group.part.label}</h3><span>{group.part.percentage}</span></div>
          <p className={styles.cardCount}><strong>{count(group.part.count)}</strong><span>blocks allocated</span></p>
          {group.part.key === "reserved" ? <div className={styles.lockCallout}><Lock /><div><b>Reserved and unissued</b><p>Locked outside the sale allocation. These blocks are not available to purchase.</p></div></div>
            : phased && ["whitelist", "public"].includes(group.part.key) ? <>
              {group.phases.map(phase => {
                const access = phaseAccess(phase);
                return <div className={styles.phase} key={phase.id}>
                  <div className={styles.phaseHeading}><h4>{phase.name}</h4><span>{phase.whitelist ? "Whitelist only" : "Public access"}</span></div>
                  <p className={styles.phaseRemaining}><strong>{count(phase.remaining)}</strong><span>of {count(phase.blocks)} left · {units(phase.unitPriceAtomic, 6)} USDT per block</span></p>
                  <div className={styles.progress} role="img" aria-label={`${phase.name}: ${count(phase.sold)} of ${count(phase.blocks)} blocks sold`}><i style={{ width: `${progress(BigInt(phase.sold), BigInt(phase.blocks))}%`, backgroundColor: colors[group.part.key] }} /></div>
                  <div className={styles.phaseFooter}><span>{count(phase.sold)} sold</span><span>{phase.status}</span></div>
                  {access.canBuy ? <><p className={styles.accessNote}>{access.title}</p>{safeHref && <Link className={styles.contribute} href={safeHref}>{publicView ? "Connect with reID" : "Choose your blocks"} <span aria-hidden="true">→</span></Link>}</>
                    : <div className={styles.lockCallout} data-access-state="locked"><Lock /><div><b>{access.title}</b><p>{access.note}</p></div></div>}
                </div>;
              })}
              {!group.phases.length && <div className={styles.lockCallout}><Lock /><div><b>Not open for purchases</b><p>This allocation has no current open phase.</p></div></div>}
              {group.sold === null && <p className={styles.unpublished}>The complete sold, remaining and pricing breakdown for this allocation is not published in this summary.</p>}
            </>
              : group.part.key === "future" ? <div className={styles.lockCallout}><Lock /><div><b>{phased ? "For future phases" : "Not accepting purchases"}</b><p>{phased ? "Unallocated blocks are not currently part of a sale phase." : "These unsold blocks are not on sale now."}</p></div></div>
                : group.part.key === "sale" ? <><p className={styles.accessNote}>Open public sale. Your wallet balance and final costs are checked at review.</p>{safeHref && <Link className={styles.contribute} href={safeHref}>{publicView ? "Connect with reID" : "Choose your blocks"} <span aria-hidden="true">→</span></Link>}</>
                  : <p className={styles.accessNote}>Already issued to holders. Included in the total supply.</p>}
        </article>)}
      </div>
    </div>

    <dl className={styles.availability} aria-label="Block availability">{availability.map(part => <div key={part.key}><dt>{part.label}</dt><dd><strong>{count(part.count)}</strong><span>{part.percentage}</span></dd></div>)}</dl>
    {phased ? <div className={styles.notes}><p>Issued blocks are included in their phase allocations. Only “Available now” blocks are on sale.</p>{view!.nextPage != null && <p>More visible phases are available. This summary shows the current phase and the first page.</p>}{observations.length !== visiblePhases.length && <p>Some phase details are unavailable. Refresh to verify the latest information.</p>}</div>
      : <p className={styles.notes}>This project has one public sale. No reserved or separate phase allocations are configured.</p>}
  </section>;
}
