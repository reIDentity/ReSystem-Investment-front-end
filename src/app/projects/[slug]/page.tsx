import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicProject } from "@/components/invest/PublicProject";
import { getPublicProject, publicSiteOrigin } from "@/lib/platform/public-project-server";
import { projectArtworkUrl } from "@/lib/platform/media";

type Props = { params: Promise<{ slug: string }> };
// Resolve redirects before streaming, including the legacy UUID URL's HTTP 308.
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getPublicProject((await params).slug);
  if (!found) notFound();
  const { project, canonical } = found;
  const url = new URL(canonical, publicSiteOrigin()).toString();
  const title = `${project.title} — reSystem Investment`;
  const description = project.description.replace(/\s+/g, " ").trim().slice(0, 160);
  const image = project.media?.find(m => m.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(m.cid));
  return { title, description, alternates: { canonical: url }, openGraph: { type: "website", title, description, url, ...(image ? { images: [{ url: new URL(projectArtworkUrl(project.id, image.cid), publicSiteOrigin()).toString(), alt: project.title }] } : {}) }, twitter: { card: image ? "summary_large_image" : "summary", title, description } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const found = await getPublicProject(slug);
  if (!found) notFound();
  if (`/projects/${slug}` !== found.canonical) permanentRedirect(found.canonical);
  return <PublicProject key={found.project.id} id={found.project.id} initialProject={found.project} />;
}
