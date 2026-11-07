import { getLandingPublicSnapshot } from "@/lib/platform/landing-server";
import { connection } from "next/server";

export async function GET() {
  await connection();
  try {
    return Response.json(await getLandingPublicSnapshot(), { headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=15" } });
  } catch {
    return Response.json({ error: "Published catalogue is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
