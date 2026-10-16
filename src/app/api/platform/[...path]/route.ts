import { proxyConfig, proxyPlatform } from "@/lib/platform/proxy";
async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  let config; try { config = proxyConfig(process.env); } catch { return Response.json({ error: { message: "The platform backend is not configured. Your funds have not changed." } }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
  return proxyPlatform(request, (await context.params).path, config);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
