# reSystem Investment

Independent Next.js investor frontend and Figma landing page. The admin, backend, indexer and smart contracts have separate repositories under the shared workspace. Start with [START_HERE.md](START_HERE.md), the [approved plan](docs/planning/RE_SYSTEM_IMPLEMENTATION_PLAN.md) and [implementation status](docs/planning/IMPLEMENTATION_STATUS.md).

## Platform mode

The investor app consumes the reviewed NestJS REST/OpenAPI contract through same-origin server routes. It uses actual session-bound wallet balances, published projects, confirmed activity and transaction intents. Empty, partial and unavailable states do not create balances, deposits, holdings or earnings. Bank transfer and card remain blurred and disabled as Coming soon. Support attachments and send-Max remain unavailable until their acceptance checks pass.

Set these **server-only** variables in the correct investor Vercel account and redeploy reviewed `dev` after the FP API is ready:

```dotenv
PLATFORM_API_BASE=https://admin.resystem.org/v1
PLATFORM_APP_ORIGIN=https://re-system-investment-front-end.vercel.app
REID_APP_URL=https://app.reidentity.net
```

The connected Vercel tool account is unrelated to this investor project. Do not deploy or change another account's project. The backend owns reID credentials, token storage, sessions and approval intents in platform mode; no new frontend client secret is required. Do not use `NEXT_PUBLIC_` for these settings or any credential. Preserve the registered callback `https://re-system-investment-front-end.vercel.app/api/auth/reid/callback`.

The BFF allowlists fixed API routes and methods, rejects cross-origin mutations, forwards only platform cookies, strips upstream redirect/cookie scope, never caches authenticated responses and never accepts a browser-selected wallet identity. Generated API snapshots pin version0.1.0 and SHA256 `484aa0635357fea37de78b6c32607c0b680c5c355b5d06fa0216e925204e36c2`.

Connect with reID remains investor sign-in. Existing UAT client `reid_451935944a76413bbcbd2a4283098350` is separate from Fractionaire. Authentication is not wallet approval or on-chain authority. The provider safety patch has been deployed, but backend reID transaction submission remains disabled pending fresh user consent and exact wallet UAT. Do not mark full financial acceptance complete from UI or sign-in tests.

## Local development

1. Use Node22.18+ and `npm ci`.
2. Copy `.env.example` to `.env.local`. For platform mode set `PLATFORM_API_BASE` to the reviewed backend (example `http://127.0.0.1:3005/v1`) and `PLATFORM_APP_ORIGIN=https://localhost:3002`.
3. Keep local HTTPS files at `certificates/localhost.pem` and `certificates/localhost-key.pem`; these and all `.env` secrets are ignored.
4. Run `npm run dev:https` and open `https://localhost:3002`.

Phone authentication requires a registered reachable HTTPS origin. A phone's `localhost` points to the phone; use the deployed canonical site rather than the workstation's Wi-Fi IP for reID sign-in.

When `PLATFORM_API_BASE` is empty, the legacy read-only login remains available with the server-only variables documented in `.env.example`. Its callback performs PKCE S256/state verification, validates the reID wallet and seals an encrypted session while discarding provider tokens. It does not enable the new platform's financial workflows. Keep that legacy configuration separate from platform-mode acceptance.

## Checks and evidence

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:auth
```

The HTTPS integration command requires the local dev server; legacy-only cases skip when platform mode is selected. A real reID consent/approval flow requires the user's browser and wallet. The platform integration passed22tests and typecheck, with prior full lint/build and five anonymous HTTPS boundary checks. The requested homepage correction [0ebcef1](https://github.com/reIDentity/ReSystem-Investment-front-end/commit/0ebcef150c8eeb43a04972178dd98fb72abcc326) restores Figma node20:10105 values, spacing, type and dark panel, removes the extra paragraph, and passed scoped lint/typecheck plus desktop/390px visual checks. The landing design figures are authored presentation values; investor data continues to come from the API.

Store actual development/testnet credentials only in protected runtime injection and the authorized private Notion Development Credentials register. Never commit secrets, session material, private user screenshots or runtime archives. The private Notion project contains the working task board, documents, service inventory and security evidence; source publication is separate from runtime readiness and financial UAT.
