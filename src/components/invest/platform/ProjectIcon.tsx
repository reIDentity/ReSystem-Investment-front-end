"use client";
import Image from "next/image";
import { useState } from "react";
import type { Project } from "@/lib/platform/types";
import { projectArtworkUrl } from "@/lib/platform/media";
import { useResource } from "../PlatformProvider";
import { Initials } from "../InvestorUI";

/** Use the actual public artwork; never substitute another project's image. */
export function ProjectIcon({ id, title, media }: { id: string; title: string; media?: Project["media"] }) {
  const project = useResource<Project>(media === undefined ? `projects/${encodeURIComponent(id)}` : null);
  const image = (media ?? (project.error ? undefined : project.data?.media))?.find(item => item.mimeType.startsWith("image/") && /^[a-zA-Z0-9]{32,120}$/.test(item.cid));
  const [failed, setFailed] = useState<string | null>(null);
  if (!image || image.cid === failed) return <Initials name={title.slice(0, 2).toUpperCase()} />;
  return <span className="iv-initials iv-project-icon"><Image key={image.cid} src={projectArtworkUrl(id, image.cid, "icon")} width={36} height={36} unoptimized alt="" onError={() => setFailed(image.cid)} /></span>;
}
