"use client";
import { useEffect, useState } from "react";

/** QR generation stays local: approval URLs are never sent to an image service. */
export function ReidApprovalQr({ url }: { url: string }) {
  const [qr, setQr] = useState<{ url: string; data: string } | null>(null);
  useEffect(() => {
    let current = true;
    void import("qrcode").then(({ toDataURL }) => toDataURL(url, { width: 240, margin: 2, errorCorrectionLevel: "M" })).then(data => {
      if (current) setQr({ url, data });
    }).catch(() => { if (current) setQr(null); });
    return () => { current = false; };
  }, [url]);
  return <div className="iv-reid-mobile-qr"><p>On a computer, scan this code using the scanner inside the reID mobile app, then review and approve the transaction.</p>{qr?.url === url ?
    // eslint-disable-next-line @next/next/no-img-element -- locally generated QR, never remote media
    <img src={qr.data} width={200} height={200} alt="Scan to review this exact transaction in the reID mobile app" /> : <p role="status">Preparing mobile approval code…</p>}</div>;
}
