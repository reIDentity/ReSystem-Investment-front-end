/** Session-local GET work only. SWR owns data/freshness; forced reads stay fresh. */
export function createReadAhead(fetcher: (path: string) => Promise<unknown>) {
  let generation = 0, workers = 0;
  const pending = new Map<string, { token: object; promise: Promise<unknown> }>();
  const latest = new Map<string, object>();
  const warming = new Map<string, number>();
  const queue: { path: string; generation: number; cached: () => boolean; publish: (value: unknown) => Promise<unknown> }[] = [];
  function guarded(path: string, started: number) {
    return Promise.resolve().then(() => fetcher(path)).then(value => {
      if (started !== generation) throw new Error("The investor session has ended.");
      return value;
    });
  }
  function read(path: string): Promise<unknown> {
    const prefetched = pending.get(path);
    if (prefetched) { pending.delete(path); return prefetched.promise; }
    // Only the first mounted read joins a prefetch. An explicit subsequent
    // mutate/retry must never join an older pre-mutation request.
    const token = {};
    latest.set(path, token);
    return guarded(path, generation).finally(() => { if (latest.get(path) === token) latest.delete(path); });
  }
  async function drain() {
    workers++;
    try {
      while (queue.length) {
        const item = queue.shift()!;
        const token = {};
        try {
          if (item.generation !== generation || item.cached()) continue;
          latest.set(item.path, token);
          const promise = guarded(item.path, item.generation);
          pending.set(item.path, { token, promise });
          const value = await promise;
          if (item.generation === generation && latest.get(item.path) === token) await item.publish(value);
        } catch { /* Speculation never replaces the screen's actual error state. */ }
        finally {
          if (pending.get(item.path)?.token === token) pending.delete(item.path);
          if (latest.get(item.path) === token) latest.delete(item.path);
          if (warming.get(item.path) === item.generation) warming.delete(item.path);
        }
      }
    } finally { workers--; }
  }
  return {
    read,
    warm(paths: readonly string[], cached: (path: string) => boolean, publish: (path: string, value: unknown) => Promise<unknown>) {
      for (const path of paths.slice(0, 4)) {
        if (warming.size >= 8 || warming.has(path) || cached(path)) continue;
        warming.set(path, generation);
        queue.push({ path, generation, cached: () => cached(path), publish: value => publish(path, value) });
      }
      if (queue.length && workers < 2) void drain();
      if (queue.length && workers < 2) void drain();
    },
    invalidate() { generation++; pending.clear(); latest.clear(); queue.length = 0; warming.clear(); },
  };
}

/** Read-only intent hints. Quotes, approvals and mutations are never speculative. */
export function routeResources(href: string): string[] {
  const project = href.match(/^\/invest\/products\/([a-zA-Z0-9_-]{1,100})$/);
  if (project) return [`projects/${project[1]}`, `projects/${project[1]}/chain`, `projects/${project[1]}/revenue`];
  if (href.startsWith("/invest/activity?")) {
    const filter = new URLSearchParams(href.split("?", 2)[1]).get("filter");
    return [activityPath(1, ["all", "payouts", "buys", "deposits", "withdrawals"].includes(filter || "") ? filter! : "all")];
  }
  switch (href) {
    case "/invest/home": return ["portfolio", "wallet", "projects", "wallet/cashflow"];
    case "/invest/explore": return ["projects", "portfolio"];
    case "/invest/earnings": return ["portfolio"];
    case "/invest/wallet": return ["wallet", "portfolio"];
    case "/invest/activity": return ["activity?page=1&pageSize=10&filter=all"];
    case "/invest/support": return ["support"];
    case "/invest/notifications": return ["notifications", "notification-preferences", "email-notifications"];
    case "/invest/deposit": return ["wallet/deposits"];
    default: return [];
  }
}

export function activityPath(page: number, filter: string, snapshotBlock?: string): string {
  const query = new URLSearchParams({ page: String(page), pageSize: "10", filter });
  if (snapshotBlock) query.set("snapshotBlock", snapshotBlock);
  return `activity?${query}`;
}
