import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getInvestorUser } from "@/lib/auth/session";
import { loadDeposits } from "@/lib/deposits";

export async function GET() {
  const user = await getInvestorUser();
  const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
  if (!user) return NextResponse.json({ error: "Sign in with reID to view deposits." }, { status: 401, headers });
  const qr = await QRCode.toDataURL(user.wallet, { width: 200, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0091ff", light: "#ffffff" } });
  try {
    const data = await loadDeposits(user.wallet);
    return NextResponse.json({ ...data, qr }, { headers });
  } catch {
    return NextResponse.json({ wallet: user.wallet, qr, error: "INFRA deposit history is temporarily unavailable. Your wallet address is still valid; please refresh to try again." }, { status: 502, headers });
  }
}
