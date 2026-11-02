import Link from "next/link";
import type { SalePhasesResponse } from "@/lib/platform/api.generated";
import {
  assetLabel,
  percentage,
  units,
  type PaymentAsset,
} from "@/lib/platform/money";

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
}) {
  const allocation = phased
    ? [
        ["Reserved · locked", view?.reservedBlocks],
        ["Early access · whitelist", view?.whitelistBlocks],
        ["Public phases", view?.publicBlocks],
        ["Unallocated for future phases", view?.unallocatedBlocks],
      ]
    : [
        ["Issued", issued],
        ["Unissued", remaining],
      ];
  const phase = view?.current;
  return (
    <div className="iv-share-allocation">
      <h3>Share allocation</h3>
      <p>{count(total)} total shares</p>
      <dl>
        {allocation.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {count(value)}
              {value !== undefined && total
                ? ` · ${percentage(value, total)}`
                : ""}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        <strong>
          {saleLimit === null
            ? phasedLoading
              ? "Checking sale availability…"
              : "Sale availability unavailable"
            : `${count(String(saleLimit))} shares on sale now`}
        </strong>
      </p>
      {paused ? (
        <p>Purchases are paused.</p>
      ) : saleOpen === false ? (
        <p>The primary sale is closed.</p>
      ) : phased ? (
        phase ? (
          <p>
            {phase.name} · {units(phase.unitPriceAtomic, 6)} USDT per share ·{" "}
            {count(phase.remaining)} remaining in this phase.{" "}
            {phase.whitelist
              ? view?.walletApproved === true
                ? "Your wallet is approved for early access."
                : view?.walletApproved === false
                  ? "Your wallet is not on this phase’s whitelist."
                  : "Wallet approval could not be verified."
              : "Open to all investors."}
            {!phase.open && " This phase is not accepting purchases."}
            {phase.whitelist && view?.walletApproved === false && (
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
      {walletLimit !== null ? (
        <p>
          <strong>{count(String(walletLimit))} shares available to you</strong>
          {walletLimit > 0n &&
            ` with your ${assetLabel(asset)} balance before network fees. Final costs are checked at review.`}
        </p>
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
  );
}
