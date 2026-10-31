"use client";
import { useEffect, useRef, useState } from "react";
type Message = { id: string; createdAt: string };
type Page<M extends Message> = {
  messages?: M[];
  nextMessageCursor?: string | null;
};
export function useSupportHistory<M extends Message>(
  scope: string,
  page: Page<M> | undefined,
  read: (cursor: string) => Promise<Page<M>>,
) {
  const anchor = `${scope}:${page?.nextMessageCursor ?? "end"}`;
  const active = useRef<string | null>(anchor);
  useEffect(() => {
    active.current = anchor;
    return () => {
      active.current = null;
    };
  }, [anchor]);
  const pending = useRef(false);
  const [history, setHistory] = useState<{
    anchor: string;
    messages: M[];
    cursor: string | null;
  }>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ anchor: string; text: string }>();
  const current = history?.anchor === anchor ? history : undefined;
  const cursor = current ? current.cursor : page?.nextMessageCursor;
  const messages = Array.from(
    new Map(
      [...(current?.messages || []), ...(page?.messages || [])].map((m) => [
        m.id,
        m,
      ]),
    ).values(),
  ).sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  async function loadOlder() {
    if (!cursor || pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      const older = await read(cursor);
      if (active.current !== anchor) return;
      if (older.nextMessageCursor === cursor)
        throw Error("The history cursor repeated. Refresh the conversation.");
      setHistory({
        anchor,
        messages: [...(older.messages || []), ...(current?.messages || [])],
        cursor: older.nextMessageCursor || null,
      });
    } catch (e) {
      if (active.current === anchor)
        setFailure({
          anchor,
          text:
            e instanceof Error
              ? e.message
              : "Older messages could not be loaded.",
        });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    messages,
    hasOlder: Boolean(cursor),
    loadOlder,
    busy,
    error: failure?.anchor === anchor ? failure.text : null,
  };
}
/** Keep a key for an unchanged draft until its outcome is known. */
export function useSupportRequestKey() {
  const pending = useRef<{ payload: string; key: string } | undefined>(
    undefined,
  );
  return {
    key(payload: unknown) {
      const text = JSON.stringify(payload);
      if (pending.current?.payload !== text)
        pending.current = { payload: text, key: crypto.randomUUID() };
      return pending.current.key;
    },
    clear() {
      pending.current = undefined;
    },
  };
}
