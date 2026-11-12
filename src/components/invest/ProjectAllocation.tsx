import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import { units } from "@/lib/platform/money";
import { shareAllocationSegments, supplyAvailabilitySegments } from "@/lib/platform/share-allocation";
import { SupplyTiles } from "./SupplyTiles";

type PhasedSale = Extract<SalePhasesResponse, { mode: "phased" }>;
type Phase = PhasedSale["phases"][number];
const whole = (value: string | undefined): value is string => typeof value === "string" && /^[0-9]{1,78}$/.test(value);
const count = (value: string) => units(value, 0);
const validPhase = (phase: Phase) => [phase.blocks, phase.sold, phase.remaining, phase.unitPriceAtomic].every(whole)
  && BigInt(phase.blocks) > 0n && BigInt(phase.sold) + BigInt(phase.remaining) === BigInt(phase.blocks);
const phaseProgress = (phase: Phase) => Number(BigInt(phase.sold) * 10000n / BigInt(phase.blocks));

/** Confirmed availability is separate from the purpose of each phase's allocation. */
export function ProjectAllocation({ total, issued, remaining, phased, view, saleLimit, loading = false }: {
  total?: string;
  issued?: string;
  remaining?: string;
  phased: boolean;
  view?: PhasedSale;
  saleLimit: bigint | null;
  loading?: boolean;
}) {
  const availability = supplyAvailabilitySegments({ total, issued, remaining, reserved: phased ? view?.reservedBlocks : "0", saleLimit });
  const allocation = phased ? shareAllocationSegments({ total, issued, remaining, phased, allocation: view, saleLimit }) : null;
  const visiblePhases = view ? [view.current, ...(Array.isArray(view.phases) ? view.phases : [])].filter((phase): phase is Phase => !!phase)
    .filter((phase, index, all) => all.findIndex(item => item.id === phase.id) === index).filter(validPhase) : [];
  if (!availability || (phased && !allocation)) return <div className="iv-project-allocation-empty" role="status">
    {loading ? "Checking block allocation…" : "Block allocation is unavailable. Refresh the project to check again."}
  </div>;
  return <div className="iv-project-allocation">
    <p className="iv-project-allocation-total"><strong>{count(total!)} total blocks</strong></p>
    <div className="iv-allocation-content">
      <div className="iv-project-allocation-graphic">
        <SupplyTiles issued={issued} maximum={total} reserved={phased ? view!.reservedBlocks : "0"} onSale={saleLimit!.toString()} cells={100} emphasizeAvailable className="iv-pd-allocation-tiles" />
        <p>Each tile represents 1% of all blocks. A tile can contain more than one colour.</p>
      </div>
      <dl className="iv-allocation-status-legend" aria-label="Block availability">
        {availability.map(part => <div key={part.key}>
          <dt><i className={`iv-share-key-${part.key}`} aria-hidden="true" />{part.label}</dt>
          <dd><strong>{count(part.count)}</strong><span>{part.percentage}</span></dd>
        </div>)}
      </dl>
    </div>
    {phased ? <>
      <section className="iv-project-allocation-purpose">
        <h3>Allocation by purpose</h3>
        <div className="iv-project-allocation-bar" role="img" aria-label={allocation!.map(part => `${part.label}: ${count(part.count)} blocks, ${part.percentage}`).join("; ")}>
          {allocation!.filter(part => part.size > 0).map(part => <span key={part.key} className={`iv-share-key-${part.key}`} style={{ width: `${part.size / 100}%` }} />)}
        </div>
        <dl className="iv-allocation-status-legend" aria-label="Allocation by purpose">
          {allocation!.map(part => <div key={part.key}><dt><i className={`iv-share-key-${part.key}`} aria-hidden="true" />{part.label}</dt><dd><strong>{count(part.count)}</strong><span>{part.percentage}</span></dd></div>)}
        </dl>
        <p>Issued blocks are included in these allocations. Only the blocks shown as available now can be purchased.</p>
      </section>
      <section className="iv-project-allocation-phases" aria-label="Visible sale phases">
        <h3>Current and visible phases</h3>
        {visiblePhases.length ? visiblePhases.map(phase => <article key={phase.id}>
          <div><h4>{phase.name}</h4><span>{phase.id === view!.current?.id ? saleLimit! > 0n ? "Current phase · open" : "Current phase · not accepting purchases" : phase.status === "Paused" ? "Paused" : "Upcoming phase"}</span></div>
          <p>{phase.whitelist ? "Whitelisted investors only" : "Public access"} · {units(phase.unitPriceAtomic, 6)} USDT per block</p>
          <progress max={10000} value={phaseProgress(phase)} aria-label={`${phase.name}: ${count(phase.sold)} of ${count(phase.blocks)} blocks sold`} />
          <p><strong>{count(phase.sold)} sold</strong><span>{count(phase.remaining)} remaining of {count(phase.blocks)}</span></p>
        </article>) : <p>No visible sale phase is available.</p>}
        {view!.nextPage != null && <p>More visible phases are available. This summary shows the current phase and the first page.</p>}
        <p>Reserved blocks are locked. Future allocations are not currently available for purchase.</p>
      </section>
    </> : <p className="iv-project-allocation-note">This project has one public sale. No reserved or separate phase allocations are configured.</p>}
  </div>;
}
