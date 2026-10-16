"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Box } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { RollingNumber } from "./RollingNumber";
import { useInView, usePrefersReducedMotion } from "@/hooks/motion";

interface Payment {
  id: number;
  name: string;
  hash: string;
  amount: number;
}

const seedPayments: Payment[] = [
  { id: 6, name: "Fractionaire", hash: "0x611c…6871", amount: 218 },
  { id: 5, name: "INFRA reAED", hash: "0xd7cc…f4b7", amount: 249 },
  { id: 4, name: "Fractionaire", hash: "0xe203…f8ef", amount: 166 },
  { id: 3, name: "reID", hash: "0xade2…60d9", amount: 82 },
  { id: 2, name: "INFRA Global", hash: "0x5741…a8bd", amount: 62 },
  { id: 1, name: "reINVEST", hash: "0xdb91…db11", amount: 87 },
];

/** Simulated incoming payments that cycle through the feed. */
const incoming: Omit<Payment, "id">[] = [
  { name: "INFRA reAED", hash: "0x9a3f…12c4", amount: 134 },
  { name: "reID", hash: "0x41be…77d0", amount: 58 },
  { name: "Fractionaire", hash: "0xc08d…e5a1", amount: 203 },
  { name: "CET", hash: "0x73f2…0b9e", amount: 96 },
  { name: "INFRA Global", hash: "0x2e6a…c3f8", amount: 71 },
  { name: "reDOMAIN", hash: "0xf1d9…48aa", amount: 44 },
];

const paidOut = [
  { name: "INFRA reAED", value: 22.4 },
  { name: "Fractionaire", value: 19.9 },
  { name: "reID", value: 12.3 },
  { name: "INFRA Global", value: 11.2 },
  { name: "reINVEST", value: 7.8 },
  { name: "CET", value: 5.5 },
  { name: "reDOMA", value: 5.0 },
];

const breakdown = [
  { name: "INFRA reAED", value: "$22.4k", pct: 23, color: "#123e70" },
  { name: "Fractionaire", value: "$19.9k", pct: 21, color: "#006ec8" },
  { name: "reID", value: "$12.3k", pct: 13, color: "#0091ff" },
  { name: "INFRA Global", value: "$11.2k", pct: 12, color: "#56b6ff" },
  { name: "reINVEST", value: "$7.8k", pct: 8, color: "#a8d9ff" },
  { name: "CET", value: "$5.5k", pct: 6, color: "#6685a3" },
  { name: "reDOMA", value: "$5.0k", pct: 5, color: "#aac0d5" },
  { name: "Others", value: "$12.3k", pct: 13, color: "#e2e8f0" },
];

const poolFills = ["#6685a3", "#a8d9ff", "#0091ff", "#6685a3", "#a8d9ff", "#0091ff", "#6685a3", "#a8d9ff", "#0091ff", "#6685a3", "#a8d9ff", "#0091ff"];

const FEED_MS = 3600;
const BASE_POOL = 96400;
const BASE_COUNT = 1285;

const card = "h-full min-w-0 rounded-[20px] bg-white p-5";
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const AGO = ["now", "4s ago", "12s ago", "46s ago", "2 min ago", "6 min ago", "9 min ago"];
const SEED_MAX_ID = seedPayments[0].id;

interface LiveState {
  feed: Payment[];
  pool: number;
  count: number;
  filled: number;
  lastDelta: number;
  tick: number;
}

function useLiveFeed(active: boolean): LiveState {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<LiveState>({
    feed: seedPayments,
    pool: BASE_POOL,
    count: BASE_COUNT,
    filled: 9,
    lastDelta: 0,
    tick: 0,
  });
  const cursor = useRef(0);

  useEffect(() => {
    if (!active || reduced) return;
    const id = setInterval(() => {
      const next = incoming[cursor.current % incoming.length];
      cursor.current += 1;
      setState((s) => {
        const payment: Payment = { ...next, id: s.feed[0].id + 1 };
        return {
          feed: [payment, ...s.feed].slice(0, 7),
          pool: s.pool + payment.amount,
          count: s.count + 1,
          filled: s.filled >= 12 ? 1 : s.filled + 1,
          lastDelta: payment.amount,
          tick: s.tick + 1,
        };
      });
    }, FEED_MS);
    return () => clearInterval(id);
  }, [active, reduced]);

  return state;
}

function PaymentsIn({ feed, count, shown }: { feed: Payment[]; count: number; shown: boolean }) {
  return (
    <div className={`${card} flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink">Payments in</h3>
        <span className="flex items-center gap-1.5 rounded-full bg-[#eaf5ff] px-2.5 py-1 font-display text-[12px] font-semibold text-[#061b32]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <RollingNumber value={count.toLocaleString("en-US")} ready={shown} /> today
        </span>
      </div>
      <ul className="-mx-2 mt-3 h-[342px] overflow-hidden px-2 [mask-image:linear-gradient(#000_85%,transparent)] lg:h-0 lg:min-h-[342px] lg:flex-1">
        {feed.map((p, i) => (
          <li
            key={p.id}
            className={`border-b transition-colors duration-700 ${i === 0 ? "border-transparent" : "border-line"} ${
              p.id > SEED_MAX_ID ? "row-in" : ""
            }`}
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
                <p className="font-mono text-[10px] text-muted">{p.hash}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-[14px] font-bold text-[#061b32]">+${p.amount}</p>
                <p className="text-[10px] text-muted">{AGO[i]}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <a
        href="#"
        className="group mt-3 flex items-center justify-between rounded-xl bg-[#f1f1f1] px-4 py-3 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-[#e0f1ff]"
      >
        View all payments <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    </div>
  );
}

function ShareholderPool({ live, shown }: { live: LiveState; shown: boolean }) {
  const rows = 8;
  const cols = 12;
  return (
    <div className="flex h-full min-w-0 flex-col rounded-[20px] bg-[#071b32] p-5 text-white">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold">Shareholder pool</h3>
        <span className="flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/80">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent [animation-duration:1.4s]" />
          <span className="text-shimmer">Syncing INFRA</span>
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-[#eaf5ff] p-4 text-ink">
        <p className="text-[12px] text-[#075a9c]">Pool · 100% to holders</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="font-display text-[40px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value={money(live.pool)} ready={shown} />
          </p>
          <span
            key={live.tick}
            className={`rounded-full bg-brand px-2 py-1 font-display text-[11px] font-bold text-white tabular-nums ${live.tick ? "badge-pop" : ""}`}
          >
            +${live.lastDelta}
          </span>
        </div>
      </div>
      <div className="mt-4 grid flex-1 content-center gap-1.5 rounded-2xl bg-black/25 p-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }).map((_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const last = row === rows - 1;
          const filled = last && col < live.filled;
          const current = last && col === live.filled - 1;
          // Rows above fill in as a diagonal wave the first time the card scrolls into view.
          const wave = shown ? 0 : -1;
          return (
            <span
              key={i}
              className={`aspect-square rounded-[3px] transition-[background-color,transform] duration-500 ease-[var(--ease-spring)] ${current && live.tick ? "cell-live" : ""}`}
              style={{
                background: filled ? poolFills[col] : "rgba(255,255,255,0.06)",
                transform: filled ? "scale(1)" : "scale(0.86)",
                transitionDelay: wave === 0 && last ? `${col * 60}ms` : "0ms",
              }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" /> Filling next row
        </span>
        <span className="font-display font-semibold text-white tabular-nums">{live.filled} / 12</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700 ease-[var(--ease-spring)]"
          style={{ width: `${shown ? (live.filled / 12) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function PaidOut({ shown }: { shown: boolean }) {
  const max = paidOut[0].value;
  return (
    <div className={`${card} flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink">Paid out by product</h3>
        <span className="text-[11px] text-muted">Last 30 days</span>
      </div>
      <div className="mt-4 flex flex-1 items-end gap-2">
        {paidOut.map((b, i) => (
          <div key={b.name} className="group flex min-w-0 flex-1 flex-col items-center justify-end">
            <p
              className="mb-1 font-display text-[11px] font-bold text-ink transition-[opacity,transform] duration-700 ease-[var(--ease-smooth)]"
              style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(10px)", transitionDelay: `${300 + i * 90}ms` }}
            >
              ${b.value}k
            </p>
            <div
              className="w-full origin-bottom rounded-t-lg transition-[height,filter] duration-[1200ms] ease-[var(--ease-spring)] group-hover:brightness-95"
              style={{
                height: shown ? `${Math.max((b.value / max) * 230, 24)}px` : "0px",
                transitionDelay: `${i * 90}ms`,
                background: i === 0 ? "#0091ff" : "#b8dfff",
              }}
            />
            <p className="mt-2 h-7 max-w-full text-center text-[9px] leading-tight break-words text-ink-soft sm:text-[10px]">{b.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpis({ shown, pool }: { shown: boolean; pool: number }) {
  const kpi = "lift group flex h-full items-center justify-between rounded-[20px] bg-[#eaf5ff] p-5";
  return (
    <>
      <Reveal className="h-full">
        <div className={kpi}>
        <div>
          <p className="text-[12px] text-[#075a9c]/80">Revenue · 30d</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value={money(pool)} ready={shown} />
          </p>
        </div>
        <svg width="90" height="40" viewBox="0 0 90 40" fill="none" aria-hidden>
          <path
            d="M0 34 L18 26 L32 30 L50 18 L66 22 L90 4 V40 H0Z"
            fill="#0091ff"
            fillOpacity="0.2"
            style={{ opacity: shown ? 1 : 0, transition: "opacity 1s ease 0.8s" }}
          />
          <path
            d="M0 34 L18 26 L32 30 L50 18 L66 22 L90 4"
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
          <p className="text-[12px] text-[#075a9c]/80">Rows paid out</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value="38" ready={shown} />
          </p>
        </div>
        <div className="flex h-9 items-end gap-1" aria-hidden>
          {[40, 55, 35, 70, 50, 85, 100].map((h, i) => (
            <span
              key={i}
              className="w-2 origin-bottom rounded-sm bg-brand transition-[height,filter] duration-700 ease-[var(--ease-spring)] group-hover:brightness-90"
              style={{
                height: shown ? `${h}%` : "0%",
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
          <p className="text-[12px] text-[#075a9c]/80">Deductions</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">$0</p>
        </div>
        <span className="rounded-full bg-brand px-3 py-1 font-display text-[11px] font-bold text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110">
          No fees
        </span>
        </div>
      </Reveal>
      <Reveal delay={210} className="h-full">
        <div className={kpi}>
        <div>
          <p className="text-[12px] text-[#075a9c]/80">Paid to holders</p>
          <p className="mt-1 font-display text-[28px] leading-none font-extrabold text-[#061b32]">
            <RollingNumber value="100%" ready={shown} />
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
            strokeDashoffset={shown ? 0 : 1}
            style={{ transition: "stroke-dashoffset 1.6s var(--ease-smooth) 0.3s" }}
          />
        </svg>
        </div>
      </Reveal>
    </>
  );
}

function Breakdown({ shown }: { shown: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className={`${card} lg:col-span-3`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink">Revenue breakdown</h3>
        <span className="text-[11px] text-muted">Updates with every payment</span>
      </div>
      <div className="mt-4 flex h-[26px] overflow-hidden rounded-md" role="img" aria-label="Revenue share by product">
        {breakdown.map((b, i) => (
          <span
            key={b.name}
            onMouseEnter={() => setHover(b.name)}
            onMouseLeave={() => setHover(null)}
            style={{
              width: shown ? `${b.pct}%` : "0%",
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
              {b.value} <span className="font-normal text-muted">· {b.pct}%</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Transparent() {
  return (
    <div
      data-spotlight
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] bg-[#071b32] p-6 text-white"
    >
      <div>
        <p className="font-display text-[11px] font-semibold text-[#7cc8ff]">Transparent by design</p>
        <h3 className="mt-3 font-display text-[28px] leading-[1.1] font-extrabold">See every payment on-chain.</h3>
        <p className="mt-3 font-mono text-[10px] text-white/50">Latest tx 0x611c…6871</p>
      </div>
      <a
        href="#"
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
  const live = useLiveFeed(shown);

  return (
    <section id="money-flow" className="mt-20 scroll-mt-24">
      <Container>
        <Reveal variant="blur">
          <h2 className="text-[34px] font-semibold tracking-tight text-ink sm:text-[38px]">Every dollar in, every dollar out.</h2>
        </Reveal>
        <Reveal variant="blur" delay={80}>
          <p className="mt-3 max-w-[820px] text-[19px] leading-snug text-ink-soft">
            This illustration shows the revenue-allocation model. Authorized operators deposit actual revenue on INFRA, and each funded allocation is
            split by blocks held. Nothing is taken out on the way.
          </p>
        </Reveal>

        <div ref={ref} className="money-dashboard mt-5 rounded-[24px] bg-[#ececec] p-3 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal variant="left" className="h-full min-w-0">
              <PaymentsIn feed={live.feed} count={live.count} shown={shown} />
            </Reveal>
            <Reveal variant="up" delay={120} className="h-full min-w-0">
              <ShareholderPool live={live} shown={shown} />
            </Reveal>
            <Reveal variant="right" delay={240} className="h-full min-w-0">
              <PaidOut shown={shown} />
            </Reveal>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpis shown={shown} pool={live.pool} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            <Reveal className="h-full lg:col-span-3">
              <Breakdown shown={shown} />
            </Reveal>
            <Reveal delay={120} className="h-full">
              <Transparent />
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
