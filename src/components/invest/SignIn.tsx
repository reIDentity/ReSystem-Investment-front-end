"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ReidDeviceSignIn } from "./ReidDeviceSignIn";
import { deviceRequest, validDeviceSignIn, type DeviceSignIn } from "@/lib/reid/device";
import { InvestorLogo } from "./InvestorUI";
import "./SignIn.css";

const errors: Record<string, string> = {
  not_configured: "reID sign-in is being configured. Please try again shortly.",
  expired_request: "This sign-in request has expired. Please connect with reID again.",
  access_denied: "You cancelled the reID request. You can try again whenever you’re ready.",
  no_wallet: "Your reID account has no wallet yet. Create one in reID, then try again.",
  wallet_permission: "Allow wallet access in reID to use your investor account.",
  invalid_profile: "reID could not provide a valid account. Please try again.",
  sign_in_failed: "We couldn’t complete reID sign-in. Please try again.",
};

export function InvestorSignIn({ error, next = "/invest/home", mobileConnect = false, linkOrigin = "https://app.reidentity.net" }: { error?: string; next?: string; mobileConnect?: boolean; linkOrigin?: string }) {
  const [connecting, setConnecting] = useState(false);
  const starting = useRef(false);
  const [device, setDevice] = useState<{ authorization: DeviceSignIn; csrfToken: string } | null>(null);
  const [deviceError, setDeviceError] = useState("");
  async function connect(event: FormEvent<HTMLFormElement>) {
    if (!mobileConnect || window.matchMedia?.("(pointer: coarse)").matches) { setConnecting(true); return; }
    event.preventDefault(); if (starting.current) return;
    starting.current = true;
    setConnecting(true); setDeviceError("");
    try {
      const session = await deviceRequest<{ csrfToken: string }>("GET", "auth/session");
      if (typeof session.csrfToken !== "string" || !session.csrfToken) throw new Error("Refresh this page before signing in.");
      const authorization = await deviceRequest<DeviceSignIn>("POST", "auth/reid/device", session.csrfToken);
      if (!validDeviceSignIn(authorization, linkOrigin)) throw new Error("The mobile sign-in code could not be verified. Please try again.");
      setDevice({ authorization, csrfToken: session.csrfToken });
    } catch (problem) { setDeviceError(problem instanceof Error ? problem.message : "Mobile sign-in is unavailable. Please try again."); }
    finally { starting.current = false; setConnecting(false); }
  }
  return <main className="investor-app iv-signin-page iv-auth-screen"><div className="iv-signin-card">
    <section className="iv-signin-story"><Link className="iv-back-site" href="/">← Back to website</Link><InvestorLogo light /><div className="iv-signin-story-copy"><h1>Own a share of every product you believe in.</h1><p>Buy shares in published projects, follow their revenue on INFRA, and claim your earnings.</p><div className="iv-signin-stats">{["Products", "Monthly revenue", "Target yield"].map(label => <div key={label}><strong aria-label={`${label} unavailable`}>—</strong><span>{label}</span></div>)}</div></div></section>
    <section className="iv-signin-form"><div><h2>Sign in</h2><p className="iv-muted">Use your reID to access your investor dashboard.</p>{error || deviceError ? <p className="iv-auth-error" role="alert">{deviceError || errors[error!] || errors.sign_in_failed}</p> : null}<form action="/api/auth/reid/start" method="get" onSubmit={event => void connect(event)}><input type="hidden" name="next" value={next} /><button disabled={connecting} className="iv-button iv-primary iv-signin-continue">{connecting ? "Connecting to reID…" : "Continue with reID"}</button></form><ol className="iv-signin-steps"><li><span>1</span>Continue with reID to open the mobile app or scan your sign-in code.</li><li><span>2</span>Review and approve profile and wallet access in the reID mobile app.</li></ol><p className="iv-signin-create">No reID yet? Create one in the reID mobile app</p><p className="iv-signin-protected">Protected by reID. Desert Tech Cloud Services LLC, Dubai.</p></div></section>
  </div>{device ? <ReidDeviceSignIn {...device} next={next} onClose={() => setDevice(null)} /> : null}</main>;
}
