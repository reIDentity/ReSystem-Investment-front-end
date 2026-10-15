"use client";

import Link from "next/link";
import { InvestorLogo } from "./InvestorUI";

export function InvestorSignIn() {
  return <main className="investor-app iv-signin-page"><div className="iv-signin-card">
    <section className="iv-signin-story"><Link className="iv-back-site" href="/">← Back to website</Link><InvestorLogo light /><div className="iv-signin-story-copy"><h1>Own a share of every product you believe in.</h1><p>Buy shares in reSystem products, watch their revenue live on INFRA, and claim your cut whenever you like.</p><div className="iv-signin-stats">{[["12", "Products"], ["$96.4k", "Monthly revenue"], ["6–7%", "Target yield"]].map(([v, l]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div></div></section>
    <section className="iv-signin-form"><div><h2>Sign in</h2><p className="iv-muted">Use your reID to access your investor dashboard.</p><Link className="iv-button iv-primary iv-signin-continue" href="/invest/home">Continue with reID</Link><ol className="iv-signin-steps"><li><span>1</span>Tap Continue with reID and scan the code with the reID app.</li><li><span>2</span>Approve the request on your phone. No password needed.</li></ol><p className="iv-signin-create">No reID yet? Create one in the reID app</p><p className="iv-demo-auth">Demo preview: Continue opens a sample account. Live reID sign-in is not connected.</p><p className="iv-signin-protected">Protected by reID. Desert Tech Cloud Services LLC, Dubai.</p></div></section>
  </div></main>;
}
