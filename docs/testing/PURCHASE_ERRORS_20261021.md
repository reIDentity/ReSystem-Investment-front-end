# Purchase preparation and investor errors — 21 October 2026

## Live diagnosis

The owner reported a failed preparation of10whole fractions in the newly published reID project, paying native reAED. The browser's real POST `/api/platform/transactions` returned400before any durable intent or provider approval request was created. Its public error reason was **Insufficient native balance including gas reserve**. The project was Published/Open and its10-fraction quote was0.036reAED; the checked INFRA fixed network fee was3reAED. The connected wallet lacked the combined payment and fee. USDT holdings cannot cover the native network fee.

Independent FP checks show API/worker healthy and the ongoing reID request gate still enabled. No restart, gate change, funding, signature or broadcast is part of this fix. No personal balances, credentials, cookies or authentication factors are included in this document. The exact observed browser error was:

```json
{"error":{"code":"HTTP_400","message":{"message":"Insufficient native balance including gas reserve","error":"Bad Request","statusCode":400}},"statusCode":400}
```

## Defect and correction

The frontend read only a string at `error.message`. Nest's HTTP exception envelope places the real reason at `error.message.message`, so valid business rejections became a generic retry prompt. The client now supports the deployed nested envelope, flat BFF errors and bounded validation arrays. Only vetted public reasons map to actionable copy; arbitrary RPC/provider/database text, submitted values, paths, HTML and other unknown diagnostics are never echoed. Authentication expiry still clears private state; unavailable services do not falsely sign users out.

Insufficient gas/payment now reads: “Not enough reAED to cover this payment and the network fee. Add reAED to your wallet on INFRA, then prepare the transaction again. USDT cannot pay the network fee.” Other known messages explain sale/listing availability, quantity, token allowance, expired reviews, changed quotes/fees, session verification and conflicts. Unknown responses use safe status-specific instructions. Future server business reasons need explicit reviewed copy before display.

The preparation dialog retains the original layout/classes/button placement and exact command. Its unconditional “Reuse this review to retry safely” suffix is removed; recovery instructions now depend on the actual reason. Failed preparation keeps the same idempotency key, never opens a provider approval link and never submits a transaction automatically. No contract, API payload or schema change is required; this is a frontend compatibility correction.

## Verification

112tests passed, including the actual HTTP client reading the deployed400envelope and the actual React review displaying the deposit instruction. The regression retries the same10-fraction command with the same idempotency key and asserts no submit/approval path. Additional cases cover flat/nested errors, validation arrays, expiry, availability,401/403/404/409/413/429/server responses and private-diagnostic suppression. The browser test harness now shares the Error constructor between VM modules, as browser modules do, so instanceof checks do not discard genuine client errors in tests.

Lint, TypeScript and production build pass. Source publication, CI and deployed browser acceptance are recorded separately after rollout. A successful purchase still requires sufficient native funds and the investor's own exact reID approval; no purchase completion is claimed by these negative/error tests.
