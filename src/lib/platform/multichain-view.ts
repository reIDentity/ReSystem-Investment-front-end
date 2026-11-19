import type { ChainsResponse, ProjectSupplyResponse, SalePhase, SalePhasesResponse } from "./api.generated";
import type { ProjectState } from "./types";

const validAtomic = (v: string | null | undefined): v is string => typeof v === "string" && /^[0-9]+$/.test(v);
const PHASE_STATUS: Record<string, SalePhase["status"]> = { DRAFT: "Draft", ACTIVE: "Active", CLOSED: "Closed" };
type SupplyPhase = ProjectSupplyResponse["phases"][number];
const seconds = (value: string | null) => (value ? String(Math.floor(Date.parse(value) / 1000)) : "0");
export const isOpen = (phase: SupplyPhase, now: number) =>
  phase.status === "ACTIVE" &&
  (!phase.startsAt || Date.parse(phase.startsAt) <= now) &&
  (!phase.endsAt || Date.parse(phase.endsAt) > now) &&
  validAtomic(phase.available) &&
  BigInt(phase.available) > 0n;

export function salePhase(phase: SupplyPhase, now: number): SalePhase {
  return {
    id: String(phase.number),
    revision: "0",
    name: phase.name,
    blocks: phase.blocks,
    sold: phase.sold,
    remaining: phase.available,
    unitPriceAtomic: phase.priceUsdtMicros,
    scheduledPriceAtomic: null,
    scheduledAt: null,
    startsAt: seconds(phase.startsAt),
    endsAt: seconds(phase.endsAt),
    whitelist: phase.whitelist,
    visible: true,
    open: isOpen(phase, now),
    status: PHASE_STATUS[phase.status] ?? "Draft",
    nativeRaised: "0",
    usdtRaised: "0",
  };
}

export function phasedView(supply: ProjectSupplyResponse, now: number): Extract<SalePhasesResponse, { mode: "phased" }> {
  const phases = supply.phases.map((phase) => salePhase(phase, now));
  const sum = (whitelist: boolean) => phases.filter((phase) => phase.whitelist === whitelist).reduce((total, phase) => total + BigInt(phase.blocks), 0n);
  const whitelistBlocks = sum(true), publicBlocks = sum(false);
  const unallocated = BigInt(supply.maxFractions) - BigInt(supply.reservedBlocks) - whitelistBlocks - publicBlocks;
  return {
    mode: "phased",
    phaseCount: phases.length,
    totalBlocks: supply.maxFractions,
    reservedBlocks: supply.reservedBlocks,
    unallocatedBlocks: (unallocated > 0n ? unallocated : 0n).toString(),
    whitelistBlocks: whitelistBlocks.toString(),
    publicBlocks: publicBlocks.toString(),
    current: phases.find((phase) => phase.status === "Active") ?? null,
    phases,
    page: 1,
    nextPage: null,
    block: "",
  };
}

export function multichainState(supply: ProjectSupplyResponse): ProjectState {
  const saleOpen = supply.chains.some((chain) => chain.status === "DEPLOYED" && chain.saleOpen === true);
  return { totalSupply: supply.sold, remainingSupply: supply.available, maxFractions: supply.maxFractions, saleOpen, purchasePaused: false, fundingPaused: false, headBlock: "", source: "multichain" };
}

export function multichainNetworks(supply: ProjectSupplyResponse, chains: ChainsResponse["chains"]) {
  return chains.flatMap((chain) => {
    const deployment = supply.chains.find((item) => item.chainId === chain.chainId && item.status === "DEPLOYED");
    return deployment ? [{ chainId: chain.chainId, name: chain.name, nativeSymbol: chain.nativeSymbol, contract: deployment.contract, explorerUrl: deployment.explorerUrl }] : [];
  });
}

export function multichainSaleLimit(supply: ProjectSupplyResponse, now: number) {
  const current = supply.phases.find((phase) => phase.status === "ACTIVE");
  const open = supply.chains.some((chain) => chain.status === "DEPLOYED" && chain.saleOpen === true);
  return { current, limit: current && open && isOpen(current, now) ? BigInt(current.available) : 0n };
}
