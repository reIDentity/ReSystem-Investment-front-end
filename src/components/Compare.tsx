import type { CSSProperties } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

const rows = [
  ["Where returns come from", "Actual project revenue deposits", "Dividends or a future exit", "Price changes"],
  ["What you can see", "On-chain funding and claims", "Quarterly or yearly reports", "Price chart"],
  ["Minimum ticket", "$2,000", "Usually $25,000+", "Any"],
  ["Getting money out", "Any time, no lock period", "Often locked for years", "Any time, at market price"],
  ["Income while you hold", "Yes, claim whenever you like", "Sometimes", "Rarely"],
  ["Identity and custody", "reID, shares in your own wallet", "Paper certificates or registry", "Exchange or own wallet"],
];

export function Compare() {
  return (
    <section id="advantages" className="mt-20 scroll-mt-24">
      <Container>
        <Reveal>
        <div className="comparison-panel rounded-[20px] border border-line bg-white p-4 sm:p-5">
          <h2 className="font-display text-[34px] font-extrabold tracking-tight text-ink">What you can expect</h2>
          <p className="comparison-description mt-2 text-[17px] text-ink-soft">
            How a reSystem product share compares with the usual ways of backing a business.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-[26%] bg-[#f4f4f5] p-4" />
                  <th className="w-[26%] rounded-t-2xl bg-lime-soft p-4 font-display text-[13px] font-bold text-ink">
                    reSystem product share
                  </th>
                  <th className="w-[24%] bg-[#f4f4f5] p-4 font-display text-[13px] font-semibold text-ink-soft">
                    Private company equity
                  </th>
                  <th className="bg-[#f4f4f5] p-4 font-display text-[13px] font-semibold text-ink-soft">Crypto token</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b, c], i) => (
                  <tr
                    key={label}
                    data-cascade
                    style={{ "--i": i } as CSSProperties}
                    className="group border-b border-line transition-colors duration-500 last:border-0 hover:bg-[#fafafa]"
                  >
                    <th scope="row" className="px-4 py-4 font-display text-[14px] font-bold text-ink">
                      {label}
                    </th>
                    <td className="bg-lime-wash px-4 py-4 font-display text-[14px] font-medium text-ink transition-colors duration-500 group-hover:bg-brand/20">{a}</td>
                    <td className="px-4 py-4 font-display text-[14px] text-ink-soft">{b}</td>
                    <td className="px-4 py-4 font-display text-[14px] text-ink-soft">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}
