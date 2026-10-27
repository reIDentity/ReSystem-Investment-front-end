/** Preserve the approved reID mobile link host rather than changing app branding. */
export function reidLinkOrigin(value?: string): string {
  const url = new URL(value || "https://app.reidentity.net");
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error("Invalid reID link host");
  return url.origin;
}
