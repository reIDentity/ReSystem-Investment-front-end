/** Public images only: no session cookies, authorization headers or arbitrary URL input. */
export async function proxyArtwork(
  request: Request,
  id: string,
  cid: string,
  base: string,
  fetcher: typeof fetch = fetch,
) {
  const fail = (status: number) =>
    new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  const size = new URL(request.url).searchParams.get("size") || "icon";
  if (
    !/^[a-zA-Z0-9_-]{1,64}$/.test(id) ||
    !/^[a-zA-Z0-9]{32,120}$/.test(cid) ||
    !["icon", "card"].includes(size)
  )
    return fail(400);
  const headers: Record<string, string> = { Accept: "image/webp" };
  const etag = request.headers.get("if-none-match");
  if (etag && /^"[a-f0-9]{64}"$/.test(etag)) headers["If-None-Match"] = etag;
  try {
    const upstream = await fetcher(
      `${base}projects/${id}/artwork/${cid}?size=${size}`,
      {
        headers,
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );
    const outgoing = new Headers({
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
    });
    const tag = upstream.headers.get("etag");
    if (tag && /^"[a-f0-9]{64}"$/.test(tag)) outgoing.set("ETag", tag);
    if (upstream.status === 304)
      return new Response(null, { status: 304, headers: outgoing });
    if (
      !upstream.ok ||
      upstream.headers.get("content-type")?.split(";")[0] !== "image/webp" ||
      !upstream.body
    ) {
      await upstream.body?.cancel();
      return fail(upstream.status === 404 ? 404 : 503);
    }
    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > 512 * 1024) {
        await reader.cancel();
        return fail(502);
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return new Response(bytes, { headers: outgoing });
  } catch {
    return fail(503);
  }
}
