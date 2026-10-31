/** Only known reason codes and UUID request references are safe to display. */
const REASONS: Record<string, string> = {
  INSUFFICIENT_GAS:
    "Add enough reAED to cover the payment and network fee. USDT cannot pay the network fee.",
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
