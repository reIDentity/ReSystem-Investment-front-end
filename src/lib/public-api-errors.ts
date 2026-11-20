/** Only known reason codes and UUID request references are safe to display. */
const REASONS: Record<string, string> = {
  MC_PHASE_SUPPLY: "The phases would add up to more shares than can be sold. Reduce the phase size.",
  MC_PHASE_SOLD: "A phase cannot be made smaller than the shares it has already sold or reserved.",
  MC_ONE_PHASE: "Only one phase can be open at a time. Close the open phase first.",
  MC_NOT_PUBLISHED: "Publish the project on every network before opening a phase.",
  MC_PHASE_CLOSED: "A closed phase cannot be changed.",
  MC_NOT_WHITELIST: "Turn on whitelist for this phase before linking groups.",
  MC_PLATFORM_USDT: "The shared admin wallet does not hold enough USDT on one of the networks. Top it up and try again.",
  MC_NO_SHARES: "No shares have been sold yet, so there is no one to pay revenue to.",
  MC_NO_PROCEEDS: "There are no sale proceeds to withdraw on any network.",
  MC_DRY_RUN: "A network rejected this transaction in a dry run. Check balances, allowances and the sale state, then try again.",
  MC_APPROVE_USDT: "Allow USDT for this project first (step 1), then buy.",
  MC_NO_USDT: "Your wallet does not hold enough USDT on this network.",
  MC_NO_GAS: "Your wallet needs more of this network’s coin to cover the payment and network fee.",
  MC_PENDING: "You already have a purchase waiting on this network. Approve it in reID or wait for it to expire.",
  MC_PHASE_LEFT: "There are not enough shares left in this phase. Choose a smaller quantity.",
  MC_NO_PHASE: "No sale phase is open right now.",
  MC_WHITELIST_ONLY: "This phase is open to approved investors only.",
  MC_NOT_LIVE: "This project is not live on that network yet.",
  MC_NOTHING_TO_CLAIM: "There is no revenue to claim on this network yet.",
  MC_EXPIRED: "This request expired. Start again to get a fresh price.",
  PHASE_CHANGED: "The phase or price changed during checkout. Close this review, check the updated total and confirm it again.",
  PHASE_PRIVATE: "This pre-launch phase is open only to approved investors.",
  PHASE_CLOSED: "This sale phase is not currently open.",
  PHASE_CAPACITY: "Choose a quantity within the blocks remaining in this phase.",

  INSUFFICIENT_GAS:
    "Add enough of the network coin (tBNB, ETH or TRX) to cover the payment and network fee. USDT cannot pay the network fee.",
  SALE_CLOSED:
    "This project’s primary sale is closed. Refresh the project to see its current availability.",
  SUPPLY_CHANGED:
    "There are not enough shares available. Refresh the project and choose a smaller quantity.",
  REVIEW_EXPIRED:
    "This review expired. Check its status, then prepare a fresh review before approving.",
  ALLOWANCE_CHANGED:
    "The allowance must match the current purchase price exactly. Refresh the quote before approving.",
  INDEXER_NOT_READY:
    "Confirmed financial data is temporarily unavailable. Refresh after the indexer catches up.",
  REVIEW_CHANGED:
    "The transaction details changed. Check the existing request, then review fresh values before approving.",
  FEE_CHANGED:
    "The network fee increased. Prepare a fresh review and check the new fee before approving.",
  SUPPORT_CONFLICT:
    "This saved request has different details. Check the conversation before sending another request.",
};
export function publicApiError(body: unknown) {
  if (!body || typeof body !== "object") return {};
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return {};
  const { reason, requestId } = error as {
    reason?: unknown;
    requestId?: unknown;
  };
  return {
    code:
      typeof reason === "string" && Object.hasOwn(REASONS, reason)
        ? reason
        : undefined,
    message:
      typeof reason === "string" && Object.hasOwn(REASONS, reason)
        ? REASONS[reason]
        : undefined,
    reference:
      typeof requestId === "string" &&
      /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(requestId)
        ? requestId
        : undefined,
  };
}
