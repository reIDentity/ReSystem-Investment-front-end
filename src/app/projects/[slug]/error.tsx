"use client";
export default function ProjectError({ reset }: { reset: () => void }) {
  return <main className="investor-app iv-auth-loading"><div><h1>Project information is temporarily unavailable</h1><p>Please try again shortly.</p><button className="iv-button iv-primary" onClick={reset}>Try again</button></div></main>;
}
