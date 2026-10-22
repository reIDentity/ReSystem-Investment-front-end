"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Box } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { RollingNumber } from "./RollingNumber";
import { useInView } from "@/hooks/motion";

import { useLanding } from "./LandingData";
import { displayMoney, valuation, publicExplorer, type LandingPayment, type LandingProject, type landingTotals } from "@/lib/platform/landing-data";
import type { AssetTotals } from "@/lib/platform/valuation";

type Totals = ReturnType<typeof landingTotals>;
const card = "h-full min-w-0 rounded-[20px] bg-white p-5";
const colors = ["#123e70", "#006ec8", "#0091ff", "#56b6ff", "#a8d9ff", "#6685a3", "#aac0d5", "#e2e8f0"];
function relative(value: AssetTotals | null, max: bigint) { return value && max > 0n ? Number(valuation(value) * 10000n / max) / 100 : 0; }

function PaymentsIn({ feed, count, shown }: { feed: LandingPayment[] | null; count: number | null; shown: boolean }) {
  return (
    <div className={`${card} flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink">Payments in</h3>
        <span className="flex items-center gap-1.5 rounded-full bg-[#eaf5ff] px-2.5 py-1 font-display text-[12px] font-semibold text-[#061b32]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <RollingNumber value={count === null ? "—" : count.toLocaleString("en-US")} ready={shown} /> records
        </span>
      </div>
      <ul className="-mx-2 mt-3 h-[342px] overflow-hidden px-2 [mask-image:linear-gradient(#000_85%,transparent)] lg:h-0 lg:min-h-[342px] lg:flex-1">
        {feed === null ? <li className="py-3 text-[13px] text-muted">Confirmed payment history is unavailable.</li> : feed.length === 0 ? <li className="py-3 text-[13px] text-muted">No confirmed revenue payments yet.</li> : feed.slice(0, 7).map((p, i) => (
          <li
            key={p.id}
            data-flow-from={i === 0 ? "" : undefined}
            className={`border-b transition-colors duration-700 ${i === 0 ? "border-transparent" : "border-line"} `}
          >
            <div
              className={`-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-700 ease-[var(--ease-smooth)] ${
                i === 0 ? "bg-[#e0f1ff]" : "bg-transparent"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f1f1]">
                <Box size={16} className="text-ink-soft" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[13px] font-semibold text-ink">{p.name}</p>
                <p className="font-mono text-[10px] text-muted"><a href={`${publicExplorer}/tx/${p.hash}`} title={p.hash} className="underline-offset-2 hover:underline">{p.hash.slice(0, 8)}…{p.hash.slice(-4)}</a></p>
              </div>
              <div className="text-right">
                <p className="font-display text-[14px] font-bold text-[#061b32]">+{p.display}</p>
                <p className="text-[10px] text-muted">Block {p.block}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <a
        href={`${publicExplorer}/address/0x2dbd7500cc9899c9a5bba6c96f09c086502c5661`}
        className="group mt-3 flex items-center justify-between rounded-xl bg-[#f1f1f1] px-4 py-3 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-[#e0f1ff]"
      >
        View project contracts <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    </div>
  );
}

function ShareholderPool({ live, shown, loading }: { live: Totals; shown: boolean; loading: boolean }) {
  const rows = 8;
  const filled = live.claimedPercent === null ? 0 : Math.floor(live.claimedPercent / 100 * 96);
  const cols = 12;
  return (
    <div className="flex h-full min-w-0 flex-col rounded-[20px] bg-[#071b32] p-5 text-white">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold">Shareholder pool</h3>
        <span className="flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/80">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent [animation-duration:1.4s]" />
          <span className="text-shimmer">{loading ? "Syncing INFRA" : live.reserve ? "INFRA verified" : "Unavailable"}</span>
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-[#eaf5ff] p-4 text-ink">
        <p className="text-[12px] text-[#075a9c]">Unclaimed funded rewards</p>
        <div className="mt-1 flex items-center justify-between">
          <p data-flow-to className="font-display text-[40px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value={displayMoney(live.reserve)} ready={shown} />
          </p>
          <span
            key="reserve"
            className={`rounded-full bg-brand px-2 py-1 font-display text-[11px] font-bold text-white tabular-nums `}
          >
            {live.claimedPercent === null ? "—" : `${live.claimedPercent}% paid`}
          </span>
        </div>
      </div>
      <div className="mt-4 grid flex-1 content-center gap-1.5 rounded-2xl bg-black/25 p-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }).map((_, i) => {
          const active = i < filled;
          return (
            <span
              key={i}
              className={`aspect-square rounded-[3px] transition-[background-color,transform] duration-500 ease-[var(--ease-spring)] `}
              style={{
                background: active ? "#0091ff" : "rgba(255,255,255,0.06)",
                transform: active ? "scale(1)" : "scale(0.86)",
                transitionDelay: "0ms",
              }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" /> Funded rewards claimed
        </span>
        <span className="font-display font-semibold text-white tabular-nums">{live.claimedPercent === null ? "—" : `${live.claimedPercent}%`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700 ease-[var(--ease-spring)]"
          style={{ width: `${shown ? live.claimedPercent ?? 0 : 0}%` }}
        />
      </div>
    </div>
  );
}

function PaidOut({ shown, projects }: { shown: boolean; projects: LandingProject[] | null }) {
  const paidOut = projects ?? [];
  const max = paidOut.reduce((a, p) => p.claimed && valuation(p.claimed) > a ? valuation(p.claimed) : a, 0n);
  return (
    <div className={`${card} flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink">Paid out by product</h3>
        <span className="text-[11px] text-muted">All time</span>
      </div>
      <div className="mt-4 flex flex-1 items-end gap-2">
        {!paidOut.length && <p className="text-[13px] text-muted">Project payouts unavailable.</p>}
        {paidOut.map((b, i) => (
          <div key={b.project.id} className="group flex min-w-0 flex-1 flex-col items-center justify-end">
            <p
              className="mb-1 font-display text-[11px] font-bold text-ink transition-[opacity,transform] duration-700 ease-[var(--ease-smooth)]"
              style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(10px)", transitionDelay: `${300 + i * 90}ms` }}
            >
              {displayMoney(b.claimed)}
            </p>
            <div
              className="w-full origin-bottom rounded-t-lg transition-[height,filter] duration-[1200ms] ease-[var(--ease-spring)] group-hover:brightness-95"
              style={{
                height: shown ? `${relative(b.claimed, max) * 2.3}px` : "0px",
                transitionDelay: `${i * 90}ms`,
                background: i === 0 ? "#0091ff" : "#b8dfff",
              }}
            />
            <p title={b.project.title} className="mt-2 h-7 max-w-full line-clamp-2 text-center text-[9px] leading-tight break-words text-ink-soft sm:text-[10px]">{b.project.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpis({ shown, live }: { shown: boolean; live: Totals }) {
  const values = live.days.map(d => valuation(d.revenue));
  const peak = values.reduce((a, v) => v > a ? v : a, 0n);
  const points = values.map((v, i) => `${values.length > 1 ? i / (values.length - 1) * 90 : 0} ${40 - (peak ? Number(v * 3600n / peak) / 100 : 0)}`).join(" L");
  const kpi = "lift group flex h-full items-center justify-between rounded-[20px] bg-[#eaf5ff] p-5";
  return (
    <>
      <Reveal className="h-full">
        <div className={kpi}>
        <div>
          <p className="text-[12px] text-[#075a9c]/80">Revenue · 30d</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value={displayMoney(live.last30)} ready={shown} />
          </p>
        </div>
        <svg width="90" height="40" viewBox="0 0 90 40" fill="none" aria-hidden>
          <path
            d={points ? `M${points} V40 H0Z` : ""}
            fill="#0091ff"
            fillOpacity="0.2"
            style={{ opacity: shown ? 1 : 0, transition: "opacity 1s ease 0.8s" }}
          />
          <path
            d={points ? `M${points}` : ""}
            stroke="#0074cc"
            strokeWidth="2"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={shown ? 0 : 1}
            style={{ transition: "stroke-dashoffset 1.6s var(--ease-smooth) 0.2s" }}
          />
        </svg>
        </div>
      </Reveal>
      <Reveal delay={70} className="h-full">
        <div className={kpi}>
        <div>
          <p className="text-[12px] text-[#075a9c]/80">Confirmed funding records</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value={live.payments?.length.toString() ?? "—"} ready={shown} />
          </p>
        </div>
        <div className="flex h-9 items-end gap-1" aria-hidden>
          {values.slice(-7).map((value, i) => (
            <span
              key={i}
              className="w-2 origin-bottom rounded-sm bg-brand transition-[height,filter] duration-700 ease-[var(--ease-spring)] group-hover:brightness-90"
              style={{
                height: shown ? `${peak ? Number(value * 10000n / peak) / 100 : 0}%` : "0%",
                opacity: 0.45 + i * 0.08,
                transitionDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
        </div>
      </Reveal>
      <Reveal delay={140} className="h-full">
        <div className={kpi}>
        <div>
          <p className="text-[12px] text-[#075a9c]/80">Minimum fraction · USDT</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">{live.minimum}</p>
        </div>
        <span className="rounded-full bg-brand px-3 py-1 font-display text-[11px] font-bold text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110">
          + gas
        </span>
        </div>
      </Reveal>
      <Reveal delay={210} className="h-full">
        <div className={kpi}>
        <div>
          <p className="text-[12px] text-[#075a9c]/80">Paid to holders</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value={live.claimedPercent === null ? "—" : `${live.claimedPercent}%`} ready={shown} />
          </p>
        </div>
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="-rotate-90">
          <circle cx="20" cy="20" r="14" fill="none" stroke="#0091ff" strokeOpacity="0.15" strokeWidth="6" />
          <circle
            cx="20"
            cy="20"
            r="14"
            fill="none"
            stroke="#0091ff"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={shown ? 1 - (live.claimedPercent ?? 0) / 100 : 1}
            style={{ transition: "stroke-dashoffset 1.6s var(--ease-smooth) 0.3s" }}
          />
        </svg>
        </div>
      </Reveal>
    </>
  );
}

function Breakdown({ shown, projects, live }: { shown: boolean; projects: LandingProject[] | null; live: Totals }) {
  const total = live.funded ? valuation(live.funded) : 0n;
  const breakdown = (projects ?? []).map((p, i) => ({ id: p.project.id, name: p.project.title, value: displayMoney(p.funded), pct: total && p.funded ? Number(valuation(p.funded) * 10000n / total) / 100 : null, color: colors[i % colors.length] }));
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className={`${card} lg:col-span-3`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink">Revenue breakdown</h3>
        <span className="text-[11px] text-muted">Confirmed funding · all time</span>
      </div>
      <div className="mt-4 flex h-[26px] overflow-hidden rounded-md" role="img" aria-label="Revenue share by product">
        {breakdown.map((b, i) => (
          <span
            key={b.name}
            onMouseEnter={() => setHover(b.name)}
            onMouseLeave={() => setHover(null)}
            style={{
              width: shown ? `${b.pct ?? 0}%` : "0%",
              background: b.color,
              transitionDelay: `${i * 90}ms`,
              opacity: hover && hover !== b.name ? 0.35 : 1,
            }}
            className="border-r-2 border-white transition-[width,opacity] duration-[1100ms] ease-[var(--ease-smooth)] last:border-0"
          />
        ))}
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {breakdown.map((b, i) => (
          <li
            key={b.name}
            onMouseEnter={() => setHover(b.name)}
            onMouseLeave={() => setHover(null)}
            className="transition-[opacity,transform] duration-500 ease-[var(--ease-smooth)]"
            style={{
              opacity: shown ? (hover && hover !== b.name ? 0.4 : 1) : 0,
              transform: shown ? "none" : "translateY(10px)",
              transitionDelay: shown && !hover ? `${400 + i * 70}ms` : "0ms",
            }}
          >
            <p className="flex items-center gap-1.5 text-[11px] text-ink-soft">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: b.color }} /> {b.name}
            </p>
            <p className="mt-0.5 font-display text-[13px] font-bold text-ink">
              {b.value} <span className="font-normal text-muted">· {b.pct === null ? "—" : `${b.pct}%`}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Transparent({ payment }: { payment: LandingPayment | null }) {
  return (
    <div
      data-spotlight
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] bg-[#071b32] p-6 text-white"
    >
      <div>
        <p className="font-display text-[11px] font-semibold text-[#7cc8ff]">Transparent by design</p>
        <h3 className="mt-3 font-display text-[28px] leading-[1.1] font-extrabold">See every payment on-chain.</h3>
        <p className="mt-3 font-mono text-[10px] text-white/50">{payment ? `Latest tx ${payment.hash.slice(0, 8)}…${payment.hash.slice(-4)}` : "No verified revenue transaction available"}</p>
      </div>
      <a
        href={payment ? `${publicExplorer}/tx/${payment.hash}` : publicExplorer}
        data-magnetic
        className="btn btn-shine mt-6 flex items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-display text-[14px] font-bold text-white"
      >
        View on INFRA
        <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>
  );
}

export function MoneyFlow() {
  const [ref, shown] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const { projects, totals: live, loading } = useLanding();

  return (
    <section id="money-flow" className="mt-20 scroll-mt-24">
      <Container>
        <Reveal variant="blur">
          <h2 className="text-[34px] font-semibold tracking-tight text-ink sm:text-[38px]">Every dollar in, every dollar out.</h2>
        </Reveal>
        <Reveal variant="blur" delay={80}>
          <p className="mt-3 max-w-[820px] text-[19px] leading-snug text-ink-soft">
            Confirmed project revenue on INFRA is allocated to the fractions held at funding time. Follow actual deposits, unclaimed rewards and holder payouts below. Values combine USDT and reAED at 1 USDT = 3.6 reAED.
          </p>
        </Reveal>

        <div ref={ref} className="money-dashboard relative mt-5 rounded-[24px] bg-[#ececec] p-3 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal variant="left" className="h-full min-w-0">
              <PaymentsIn feed={live.payments} count={live.payments?.length ?? null} shown={shown} />
            </Reveal>
            <Reveal variant="up" delay={120} className="h-full min-w-0">
              <ShareholderPool live={live} shown={shown} loading={loading} />
            </Reveal>
            <Reveal variant="right" delay={240} className="h-full min-w-0">
              <PaidOut shown={shown} projects={projects} />
            </Reveal>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpis shown={shown} live={live} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            <Reveal className="h-full lg:col-span-3">
              <Breakdown shown={shown} projects={projects} live={live} />
            </Reveal>
            <Reveal delay={120} className="h-full">
              <Transparent payment={live.payments?.[0] ?? null} />
            </Reveal>
          </div>

        </div>
      </Container>
    </section>
  );
}
