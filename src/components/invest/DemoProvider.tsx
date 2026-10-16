"use client";

import { createContext, useContext, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { InvestorUser } from "@/lib/auth/security";

export type Transaction = {
  id: string; kind: "Payouts" | "Buys" | "Deposits" | "Withdrawals";
  title: string; product: string; date: string; reference: string;
  status: "Completed" | "Processing"; amount: number;
};
export type Holding = { id: string; shares: number; invested: number; claimable: number };
export type SupportMessage = { author: "You" | "Support"; text: string; date: string };
export type SupportTicket = { id: string; category: string; title: string; resolved: boolean; messages: SupportMessage[] };
const initialTickets: SupportTicket[] = [
  { id: "T-1042", category: "Payments", title: "Withdrawal to INFRA wallet still processing", resolved: false, messages: [
    { author: "You", text: "Hi, I withdrew $120 to my INFRA wallet on 8 Oct and it still shows processing. Can you check?", date: "08 Oct, 16:12" },
    { author: "Support", text: "Hi Manoj, thanks for reaching out. Your withdrawal was held for a routine reID check, which is now cleared. It will confirm on INFRA within the next few blocks.", date: "09 Oct, 10:03" },
  ] },
  { id: "T-1017", category: "Shares", title: "How are Fractionaire earnings calculated?", resolved: true, messages: [
    { author: "You", text: "How are Fractionaire earnings calculated?", date: "01 Oct, 12:00" },
    { author: "Support", text: "All revenue in the Fractionaire wallet goes to the shareholder pool. Your cut is the pool multiplied by your shares, divided by all shares sold.", date: "01 Oct, 12:05" },
  ] },
];
const initialHoldings: Holding[] = [
  { id: "infra-reaed", shares: 40, invested: 4000, claimable: 6.3 },
  { id: "fractionaire", shares: 25, invested: 2500, claimable: 4.3588 },
  { id: "reid", shares: 20, invested: 2000, claimable: 3.13 },
];
export const initialTransactions: Transaction[] = [
  { id: "withdraw-1", kind: "Withdrawals", title: "Withdrawal to INFRA wallet", product: "Wallet", date: "08 Oct 2026", reference: "0x91c4…e02b", status: "Processing", amount: -120 },
  { id: "claim-1", kind: "Payouts", title: "Earnings claimed", product: "INFRA reAED", date: "01 Oct 2026", reference: "0x4bd2…a71e", status: "Completed", amount: 43.2 },
  { id: "claim-2", kind: "Payouts", title: "Earnings claimed", product: "Fractionaire", date: "01 Oct 2026", reference: "0x1fe8…09c3", status: "Completed", amount: 29.1 },
  { id: "claim-3", kind: "Payouts", title: "Earnings claimed", product: "reID", date: "01 Oct 2026", reference: "0x7aa0…3d41", status: "Completed", amount: 16.7 },
  { id: "deposit-1", kind: "Deposits", title: "Deposit by bank transfer", product: "Wallet", date: "20 Sep 2026", reference: "RS-MK-2214", status: "Completed", amount: 5000 },
  { id: "buy-1", kind: "Buys", title: "Bought 20 shares", product: "reID", date: "14 Sep 2026", reference: "0xc207…b88f", status: "Completed", amount: -2000 },
  { id: "buy-2", kind: "Buys", title: "Bought 25 shares", product: "Fractionaire", date: "02 Jun 2026", reference: "0x5e93…41fa", status: "Completed", amount: -2500 },
  { id: "buy-3", kind: "Buys", title: "Bought 40 shares", product: "INFRA reAED", date: "28 May 2026", reference: "0x8b11…c60d", status: "Completed", amount: -4000 },
];

type DemoState = {
  user: InvestorUser;
  holdings: Holding[]; balances: Record<"reAED" | "USDT", number>; transactions: Transaction[];
  selectedProduct: string; selectProduct: (id: string) => void;
  notice: string; notify: (message: string) => void;
  tickets: SupportTicket[]; setTickets: Dispatch<SetStateAction<SupportTicket[]>>;
  claim: (id?: string) => void;
  deposit: (amount: number, asset: "reAED" | "USDT", method: string) => void;
  buy: (id: string, name: string, quantity: number, asset: "reAED" | "USDT") => boolean;
  withdraw: (amount: number, source: string, destination: string) => boolean;
};
const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children, user }: { children: ReactNode; user: InvestorUser }) {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [balances, setBalances] = useState({ reAED: 19097, USDT: 2450 });
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedProduct, selectProduct] = useState("fractionaire");
  const [notice, notify] = useState("");
  const [tickets, setTickets] = useState(initialTickets);
  const sequence = useRef(0);
  function record(kind: Transaction["kind"], title: string, product: string, amount: number) {
    const id = `demo-${Date.now().toString(36)}-${++sequence.current}`;
    setTransactions(old => [{ id, kind, title, product, amount, date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()), reference: `DEMO-${id.slice(-8)}`, status: "Completed" }, ...old]);
  }
  function claim(id?: string) {
    const amount = holdings.filter(h => !id || h.id === id).reduce((sum, h) => sum + h.claimable, 0);
    if (amount <= 0) return notify("No demo earnings available to claim.");
    setHoldings(old => old.map(h => !id || h.id === id ? { ...h, claimable: 0 } : h));
    setBalances(old => ({ ...old, reAED: old.reAED + amount * 3.6725 }));
    record("Payouts", "Earnings claimed", id ? id === "fractionaire" ? "Fractionaire" : id === "reid" ? "reID" : "INFRA reAED" : "All products", amount);
    notify(`Demo claim complete: $${amount.toFixed(2)} added to your preview wallet.`);
  }
  function deposit(amount: number, asset: "reAED" | "USDT", method: string) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBalances(old => ({ ...old, [asset]: old[asset] + amount }));
    record("Deposits", `Deposit by ${method}`, "Wallet", asset === "reAED" ? amount / 3.6725 : amount);
    notify(`Demo deposit complete. ${amount.toLocaleString()} ${asset} added to the preview.`);
  }
  function buy(id: string, name: string, quantity: number, asset: "reAED" | "USDT") {
    const amount = quantity * (asset === "reAED" ? 0.5 : 0.5 / 3.6725);
    const alreadyBought = transactions.filter(t => t.kind === "Buys" && t.product === name && t.title.includes("blocks")).reduce((sum, t) => sum + Number(t.title.match(/\d+/)?.[0] ?? 0), 0);
    if (!Number.isInteger(quantity) || quantity < 10 || quantity % 10 !== 0 || quantity > 90 - alreadyBought || balances[asset] < amount) return false;
    setBalances(old => ({ ...old, [asset]: old[asset] - amount }));
    setHoldings(old => old.some(h => h.id === id) ? old.map(h => h.id === id ? { ...h, shares: h.shares + quantity, invested: h.invested + quantity * 0.5 / 3.6725 } : h) : [...old, { id, shares: quantity, invested: quantity * 0.5 / 3.6725, claimable: 0 }]);
    record("Buys", `Bought ${quantity} blocks`, name, -quantity * 0.5 / 3.6725);
    notify(`Demo purchase complete: ${quantity} ${name} blocks added to your holdings.`);
    return true;
  }
  function withdraw(amount: number, source: string, destination: string) {
    if (!Number.isFinite(amount) || amount <= 0 || !destination.trim()) return false;
    if (source === "Sell shares") {
      const value = holdings.reduce((sum, h) => sum + h.invested, 0);
      if (amount > value || !Number.isInteger(amount / 100)) return false;
      let remaining = amount;
      setHoldings(holdings.map(h => {
        const sale = Math.min(remaining, Math.floor(h.invested / 100) * 100);
        remaining -= sale;
        return { ...h, shares: Math.max(0, h.shares - sale / 100), invested: h.invested - sale };
      }));
    } else {
      const asset = source === "USDT balance" ? "USDT" : "reAED";
      const units = asset === "reAED" ? amount * 3.6725 : amount;
      if (units > balances[asset]) return false;
      setBalances(old => ({ ...old, [asset]: old[asset] - units }));
    }
    record("Withdrawals", source === "Sell shares" ? "Shares sold and withdrawn" : "Withdrawal to INFRA wallet", "Wallet", -amount);
    notify("Demo withdrawal complete. No funds were transferred.");
    return true;
  }
  return <DemoContext.Provider value={{ user, holdings, balances, transactions, selectedProduct, selectProduct, notice, notify, tickets, setTickets, claim, deposit, buy, withdraw }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("Investor screens require DemoProvider");
  return value;
}
