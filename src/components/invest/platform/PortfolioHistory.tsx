"use client";
import type { WalletCashflowResponse } from "@/lib/platform/api.generated";
import { units } from "@/lib/platform/money";
import { readWalletHistory } from "@/lib/platform/cashflow-values";
export function PortfolioHistory({
  data,
}: {
  data: WalletCashflowResponse | undefined;
}) {
  const rows = readWalletHistory(data);
  if (!rows.length)
    return (
      <>
        <div className="iv-home-empty-chart" role="status">
          <div>
            <strong>Your portfolio, over time</strong>
            <p>Confirmed history is not available yet.</p>
          </div>
        </div>
        <p className="iv-home-chart-note">
          History appears after complete canonical indexing.
        </p>
      </>
    );
  const maximum = rows.reduce(
    (m, p) => [m, p.purchases, p.rewards].reduce((a, b) => (a > b ? a : b)),
    1n,
  );
  const line = (field: "purchases" | "rewards") =>
    rows
      .map(
        (p, i) =>
          `${20 + (i * 460) / 11},${180 - Number((p[field] * 15000n) / maximum) / 100}`,
      )
      .join(" ");
  const amount = (n: bigint) =>
    `$${units((n / 18n / 10n ** 12n).toString(), 6)}`;
  return (
    <>
      <div className="iv-home-empty-chart" style={{ position: "relative" }}>
        <svg
          viewBox="0 0 500 215"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
          role="img"
          aria-label="Cumulative confirmed purchase cost and claimed rewards in USDT equivalent; not current market value."
        >
          <path d="M20 180H480" stroke="#dfe5ef" />
          <polyline
            points={line("purchases")}
            fill="none"
            stroke="#0095ff"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={line("rewards")}
            fill="none"
            stroke="#00965e"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <footer
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 4,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#71819b",
          }}
        >
          {[0, 5, 11].map((i) => (
            <span key={i}>{rows[i].month}</span>
          ))}
        </footer>
      </div>
      <p className="iv-home-chart-note">
        Purchase cost {amount(rows[11].purchases)} · Rewards claimed{" "}
        {amount(rows[11].rewards)}. 1 USDT = 3.6 reAED; excludes fees, transfers
        and resale proceeds.
      </p>
      <details>
        <summary className="iv-text-link">Monthly values</summary>
        <table className="iv-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Cumulative purchase cost</th>
              <th>Cumulative rewards claimed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{amount(row.purchases)}</td>
                <td>{amount(row.rewards)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
