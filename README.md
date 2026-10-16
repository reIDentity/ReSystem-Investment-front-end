# reSystem Investment

Next.js website and investor app. **Connect with reID** is the only sign-in method. Authentication uses `fpreid-connect-sdk` 0.3.0, matching Fractionaire.

## Local development

1. Install dependencies with `npm ci` (Node 22.18+).
2. Copy `.env.example` to `.env.local` and supply the dedicated reID client credentials and a random `SESSION_SECRET` of at least 32 characters.
3. Supply a localhost HTTPS certificate and private key in `certificates/localhost.pem` and `certificates/localhost-key.pem`. This folder and `.env.local` are gitignored. The configured machine already has its development certificates.
4. Run `npm run dev:https` and open **https://localhost:3002/invest**.

The local callback is **https://localhost:3002/api/auth/reid/callback**. Sign-in must start on the same host as the callback. Opening the local site over a Wi-Fi IP redirects sign-in to localhost; use the deployed HTTPS site to test authentication from a phone.

## UAT authentication

- API: `https://uat-wallet.reidentity.net`
- Consent and login: `https://app.reidentity.net`
- Client: `reid_451935944a76413bbcbd2a4283098350`
- Name: **reSystem Investment UAT**
- Client owner: `resystem-investment-ops`
- Scopes: `profile`, `wallet:read`, `kyc:read`

Registered and activated on 16 October 2026 through the UAT backend's authenticated client registration and approval APIs. This is a separate confidential client; the Fractionaire clients were not changed. Its secret is stored only in `.env.local`, never in browser code or this repository.

Sign-in uses PKCE S256 and a random state in short-lived HttpOnly, Secure, SameSite=Lax cookies. The callback exchanges the code on the server and creates an encrypted eight-hour session containing the user's ID, display name, wallet address and verification status. reID access and refresh tokens are discarded after sign-in; no private-key export or transaction permission is requested. Investor routes validate the session on the server. Sign-out clears this app's session, while the user's reID session stays in reID.

**Investment data remains a demo:** sample holdings, balances, deposits, withdrawals and purchases are labelled as simulations. They do not read balances from or send transactions to the authenticated reID wallet.

## Vercel deployment

Deployment URL: **https://re-system-investment-front-end.vercel.app**.

Both localhost and **https://re-system-investment-front-end.vercel.app/api/auth/reid/callback** are registered on the UAT client. In Vercel Project Settings → Environment Variables, import the local `.env.vercel.local` file into the environment serving this domain, then redeploy `dev` after saving the variables. The import file is gitignored and contains:

| Variable | Value |
| --- | --- |
| `REID_CLIENT_ID` | `reid_451935944a76413bbcbd2a4283098350` |
| `REID_CLIENT_SECRET` | Dedicated UAT client secret; copy from the private import file |
| `REID_REDIRECT_URI` | `https://re-system-investment-front-end.vercel.app/api/auth/reid/callback` |
| `REID_BASE_URL` | `https://uat-wallet.reidentity.net` |
| `REID_APP_URL` | `https://app.reidentity.net` |
| `SESSION_SECRET` | Separate deployment session secret; copy from the private import file |

All six variables are server-side. Do not add `NEXT_PUBLIC_` prefixes. Mark the client secret and session secret as sensitive/secret. New values apply after a redeploy. Preview URLs use the configured canonical domain for sign-in; register separate callbacks and clients before supporting independent preview authentication. Do not commit `.env.local`, `.env.vercel.local` or certificate keys.

## Checks

```sh
npm test          # Encryption, expiry, state, redirect and identity validation
npm run lint
npm run build
npm run test:auth # HTTPS dev server must be running; uses local fixture sessions
```

Integration checks exercise route protection, real PKCE redirects, cancellation and logout. A real reID sign-in requires a UAT user to log in and approve consent in their browser.
