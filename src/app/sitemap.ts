import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublicCatalogue, publicSiteOrigin } from "@/lib/platform/public-project-server";
import { catalogueProjectPath } from "@/lib/platform/public-project";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const projects = await getPublicCatalogue(), origin = publicSiteOrigin();
  return [{ url: `${origin}/` }, ...projects.map(project => ({ url: new URL(catalogueProjectPath(project, projects), origin).toString(), ...(project.updatedAt && Number.isFinite(Date.parse(project.updatedAt)) ? { lastModified: project.updatedAt } : {}) }))];
}
