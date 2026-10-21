/** Public error copy only. Never render arbitrary RPC, provider or database text. */
const MESSAGES: Record<string, string> = {
  "Insufficient native balance including gas reserve": "Not enough reAED to cover this payment and the network fee. Add reAED to your wallet on INFRA, then prepare the transaction again. USDT cannot pay the network fee.",
  "Transaction simulation failed; balances, approval, authority or quote changed": "This transaction did not pass the blockchain checks. Refresh your balances and quote, check any required token allowance, then prepare it again.",
  "Network fee quote exceeds configured application limit": "The network fee is above the application's limit. Please try again when the fee is lower.",
  "INFRA fee quote unavailable or inconsistent; prepare again after verification": "The current INFRA network fee could not be verified. Please try again shortly.",
  "INFRA RPC unavailable or wrong network": "The INFRA network could not be verified. Please try again shortly.",
  "INFRA read unavailable": "INFRA data is temporarily unavailable. Refresh before preparing your transaction.",
  "That quantity is not available; it exceeds the unsold primary supply.": "There are not enough unsold fractions for this quantity. Refresh the project and choose a smaller quantity.",
  "The primary sale is not open for purchases.": "This project's primary sale is closed. You can buy when the sale reopens.",
  "This listing is not available for that quantity; it may have expired, been cancelled or been filled.": "This listing no longer has the quantity you selected. Refresh the marketplace and choose an available listing.",
  "This listing is no longer available.": "This listing is no longer available. Refresh the marketplace and choose another listing.",
  "Unlimited USDT approvals are not supported": "Approve only the exact USDT amount needed for this purchase.",
  "Approval must equal the current exact quote": "The USDT approval no longer matches the current price. Refresh the quote and approve the exact amount shown.",
  "Payment asset required": "Choose reAED or USDT before preparing your transaction.",
  "Connect a verified signing wallet": "Reconnect with reID to verify your wallet before preparing a transaction.",
  "Original signing wallet required": "Reconnect the wallet used to prepare this transaction. Do not approve it from another wallet.",
  "Confirmed registered project required": "This project is not currently available for this action. Refresh the project before trying again.",
  "Intent expired": "This review has expired. Close it and prepare a fresh review before requesting approval.",
  "Intent expired; prepare a new intent": "This review has expired. Close it and prepare a fresh review before requesting approval.",
  "Transaction changed; prepare and review a new intent": "The transaction details changed. Close this review and prepare a fresh one; check the new values before approving.",
  "Network fee quote increased; prepare and review a new intent": "The network fee increased. Close this review and prepare a fresh one before approving the new fee.",
  "Idempotency key already belongs to another command": "This review belongs to a different action. Check Activity before closing it and preparing another review.",
  "Idempotency conflict": "This review conflicts with an existing request. Check Activity before preparing another review.",
  "Transaction intent not found": "This transaction review is unavailable. Check Activity for the original request.",
  "Request origin rejected.": "This page could not be verified. Reopen the investor app from its official address and try again.",
  "Origin rejected": "This page could not be verified. Reopen the investor app from its official address and try again.",
  "Refresh your session before making a change.": "Your session could not be verified. Refresh the page and try again.",
  "CSRF token required": "Your session could not be verified. Refresh the page and try again.",
  "Session CSRF token rejected": "Your session could not be verified. Refresh the page and try again.",
  "Enter a valid email address": "Enter a valid email address and try again.",
  "Enter an email address to verify": "Enter your email address before requesting a confirmation email.",
  "Invalid or expired confirmation link": "This confirmation link is invalid or expired. Request a new email from Notifications.",
  "One image is required, at most 3 MiB": "Choose one image no larger than 3 MiB and try again.",
};

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** Supports BFF strings, the deployed nested Nest exception, and Nest validation arrays. */
export function platformErrorMessage(body: unknown, status: number): string {
  if (status === 401) return "Your session expired. Connect with reID again.";
  const envelope = object(body);
  const error = object(envelope?.error);
  const message = error?.message ?? envelope?.message;
  const detail = object(message)?.message ?? message;
  // Match only known public reasons. A response must never become a raw diagnostic viewer.
  if (typeof detail === "string" && Object.hasOwn(MESSAGES, detail)) return MESSAGES[detail];
  if (status === 400 && Array.isArray(detail) && detail.length > 0 && detail.length <= 20 && detail.every(value => typeof value === "string")) {
    const fields: Record<string, string> = { quantity: "a whole fraction quantity greater than zero", asset: "reAED or USDT", recipient: "a valid INFRA recipient address", amountAtomic: "a valid amount", projectId: "an available project", expiry: "a future expiry time" };
    for (const [field, label] of Object.entries(fields)) if (detail.some(value => value.startsWith(`${field} `))) return `Choose ${label}, then try again.`;
    return "Some details are invalid. Check the form and try again.";
  }
  if (status === 403) return "You do not have permission to complete this action. Reconnect with reID if your account or wallet has changed.";
  if (status === 404) return "This item is no longer available. Refresh the page before trying again.";
  if (status === 409) return "This request conflicts with an existing action. Refresh its status in Activity before preparing another request.";
  if (status === 413) return "The selected file is too large. Choose a smaller file and try again.";
  if (status === 429) return "Too many requests. Wait a moment before trying again.";
  if (status >= 500) return "The platform service is temporarily unavailable. Please retry shortly.";
  return "The request was not accepted. Check the details and try again. If it keeps failing, contact Support.";
}
