"use client";

import Link from "next/link";
import { useState } from "react";
import { InvestorLogo } from "./InvestorUI";

const errors: Record<string, string> = {
  not_configured: "reID sign-in is being configured. Please try again shortly.",
  expired_request: "This sign-in request has expired. Please connect with reID again.",
  access_denied: "You cancelled the reID request. You can try again whenever you’re ready.",
  no_wallet: "Your reID account has no wallet yet. Create one in reID, then try again.",
  wallet_permission: "Allow wallet access in reID to use your investor account.",
  invalid_profile: "reID could not provide a valid account. Please try again.",
  sign_in_failed: "We couldn’t complete reID sign-in. Please try again.",
};

export function InvestorSignIn({ error, next = "/invest/home" }: { error?: string; next?: string }) {
  const [connecting, setConnecting] = useState(false);
  return <main className="investor-app iv-signin-page"><div className="iv-signin-card">
    <section className="iv-signin-story"><Link className="iv-back-site" href="/">← Back to website</Link><InvestorLogo light /><div className="iv-signin-story-copy"><h1>Own a share of every product you believe in.</h1><p>Explore published projects, own whole fractions on INFRA and claim rewards backed by actual revenue deposits.</p><div className="iv-signin-stats">{[["INFRA", "On-chain ownership"], ["reID", "Wallet approval"], ["Two assets", "reAED and USDT"]].map(([v, l]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div></div></section>
    <section className="iv-signin-form"><div><h2>Sign in</h2><p className="iv-muted">Use your reID to access your investor dashboard.</p>{error && <p className="iv-auth-error" role="alert">{errors[error] || errors.sign_in_failed}</p>}<form action="/api/auth/reid/start" method="get" onSubmit={() => setConnecting(true)}><input type="hidden" name="next" value={next} /><button disabled={connecting} className="iv-button iv-primary iv-signin-continue">{connecting ? "Connecting to reID…" : "Continue with reID"}</button></form><ol className="iv-signin-steps"><li><span>1</span>Continue to the reID UAT app and sign in.</li><li><span>2</span>Approve the requested profile and wallet permissions. Transactions require your separate approval.</li></ol><p className="iv-signin-create">No reID yet? Create one in the reID app</p><p className="iv-demo-auth">Current environment: INFRA testnet/UAT. Financial actions require a configured platform backend and your explicit wallet approval.</p><p className="iv-signin-protected">Protected by reID. Desert Tech Cloud Services LLC, Dubai.</p></div></section>
  </div></main>;
}
