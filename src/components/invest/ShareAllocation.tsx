import Link from "next/link";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import {
  assetLabel,
  units,
  type PaymentAsset,
} from "@/lib/platform/money";
import { allocationPercentage, shareAllocationSegments } from "@/lib/platform/share-allocation";

export type PhasedSale = Extract<SalePhasesResponse, { mode: "phased" }>;
const count = (value: string | undefined) =>
  value === undefined ? "—" : units(value, 0);
export function ShareAllocation({
  total,
  issued,
  remaining,
  phased,
  view,
  saleLimit,
  walletLimit,
  asset,
  saleOpen,
  paused,
  noGas,
  phasedLoading,
  selected,
  publicView = false,
}: {
  total?: string;
  issued?: string;
  remaining?: string;
  phased: boolean;
  view?: PhasedSale;
  saleLimit: bigint | null;
  walletLimit: bigint | null;
  asset: PaymentAsset;
  saleOpen?: boolean;
  paused?: boolean;
  noGas: boolean;
  phasedLoading: boolean;
  selected?: string;
  publicView?: boolean;
}) {
  const allocation = shareAllocationSegments({ total, issued, remaining, phased, allocation: view, saleLimit });
  const phase = view?.current;
  const issuedPercent = total && issued ? allocationPercentage(issued, total) : "—";
  const selectedPercent = total && selected ? allocationPercentage(selected, total) : "—";
  return (
    <div className="iv-share-allocation">
      <div className="iv-share-allocation-heading"><h3>Share allocation</h3><span>{count(total)} total shares</span></div>
      {allocation ? <div className="iv-share-allocation-overview">
        <div className="iv-share-allocation-ring">
          <svg viewBox="0 0 120 120" role="img" aria-label={`Share allocation: ${allocation.map(part => `${part.label}, ${count(part.count)} shares, ${part.percentage}`).join("; ")}`}>
            <circle className="iv-share-ring-track" cx="60" cy="60" r="47" fill="none" strokeWidth="15" />
            {allocation.filter(part => part.size > 0).map(part => <circle key={part.key} className={`iv-share-ring-${part.key}`} cx="60" cy="60" r="47" fill="none" strokeWidth="15" pathLength="10000" strokeDasharray={`${part.size} ${10000 - part.size}`} strokeDashoffset={-part.start} transform="rotate(-90 60 60)" />)}
          </svg>
          <div aria-hidden="true"><strong>{count(total)}</strong><span>total shares</span></div>
        </div>
        <dl className="iv-share-allocation-legend">
          {allocation.map(part => <div key={part.key}><dt><i className={`iv-share-key-${part.key}`} aria-hidden="true" />{part.label}</dt><dd><strong>{count(part.count)}</strong><span>{part.percentage}</span></dd></div>)}
        </dl>
      </div> : <div className="iv-share-allocation-empty" role="status"><span className="iv-share-empty-ring" aria-hidden="true" /><p>{phasedLoading ? "Checking share allocation…" : "Share allocation is unavailable. Refresh the project to check again."}</p></div>}
      <div className="iv-share-allocation-notes">
        {phased && allocation && <p><strong>{count(issued)} issued</strong>{issuedPercent !== "—" ? ` · ${issuedPercent} of total` : ""}<span>Included in the phase allocations above.</span></p>}
        {selected && selectedPercent !== "—" && <p className="iv-share-selection" aria-live="polite"><strong>{count(selected)} selected</strong><span>{selectedPercent} of total · included in the sale allocation</span></p>}
      </div>
      <dl className="iv-share-availability" aria-label="Purchase availability">
        <div><dt>On sale now</dt><dd><strong>
          {saleLimit === null
            ? phasedLoading
              ? "Checking…"
              : "Unavailable"
            : `${count(String(saleLimit))} shares`}
        </strong></dd></div>
        <div><dt>{publicView ? "Your eligibility" : "Available to you"}</dt><dd><strong>{publicView ? "Sign in to check" : walletLimit === null ? "Unavailable" : `${count(String(walletLimit))} shares`}</strong></dd></div>
      </dl>
      <div className="iv-share-sale-details">
      {paused ? (
        <p>Purchases are paused.</p>
      ) : saleOpen === false ? (
        <p>The primary sale is closed.</p>
      ) : phased ? (
        phase ? (
          <p>
            {phase.name} · {units(phase.unitPriceAtomic, 6)} USDT per share ·{" "}
            {phase.whitelist
              ? publicView ? "Sign in to check early-access eligibility."
                : view?.walletApproved === true
                ? "Your wallet is approved for early access."
                : view?.walletApproved === false
                  ? "Your wallet is not on this phase’s whitelist."
                  : "Wallet approval could not be verified."
              : "Open to all investors."}
            {!phase.open && " This phase is not accepting purchases."}
            {!publicView && phase.whitelist && view?.walletApproved === false && (
              <>
                {" "}
                <Link className="iv-text-link" href="/invest/support">
                  Ask support about early access →
                </Link>
              </>
            )}
          </p>
        ) : view ? (
          <p>No phase is currently active.</p>
        ) : null
      ) : total ? (
        <p>This project has one public sale with no early-access whitelist.</p>
      ) : null}
      {noGas && saleLimit !== null && saleLimit > 0n && (
        <p>Your wallet needs reAED to pay the network fee.</p>
      )}
      {publicView ? <p>Connect with reID to check your balance and review an investment. No funds move until you approve.</p> : walletLimit !== null ? walletLimit > 0n && (
        <p>Your limit uses your {assetLabel(asset)} balance before network fees. Final costs are checked at review.</p>
      ) : (
        saleLimit !== null &&
        saleLimit > 0n && (
          <p>
            Your buying limit is unavailable until wallet access and balance are
            verified.
          </p>
        )
      )}
      </div>
    </div>
  );
}
