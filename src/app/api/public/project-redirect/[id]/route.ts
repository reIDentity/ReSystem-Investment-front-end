import { connection } from "next/server";
import { getPublicProject, publicSiteOrigin } from "@/lib/platform/public-project-server";
import { validProjectId } from "@/lib/platform/public-project";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!validProjectId(id)) return new Response("Project not found", { status: 404 });
  try {
    const found = await getPublicProject(id);
    if (!found) return new Response("Project not found", { status: 404 });
    return new Response(null, { status: 308, headers: { Location: new URL(found.canonical, publicSiteOrigin()).toString(), "Cache-Control": "public, max-age=0, s-maxage=30" } });
  } catch {
    return new Response("Project information is temporarily unavailable. Please try again.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
