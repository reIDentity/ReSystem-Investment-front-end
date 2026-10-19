import type { SupportAttachmentResponse } from "./api.generated";
export type PrivateAttachment = SupportAttachmentResponse;
export type PendingAttachment = { file: File; key: string; messageId?: string };
const safeId = (id: unknown): id is string => typeof id === "string" && /^[a-zA-Z0-9_-]{1,150}$/.test(id);
export function privateAttachmentPath(ticketId: string, admin = false) {
  if (!safeId(ticketId)) throw new Error("The support conversation could not be verified.");
  return `${admin ? "/admin/" : ""}support/${ticketId}`;
}
export function validatePrivateImage(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPEG or WebP image. Other file types are not supported.");
  if (!file.size || file.size > 3 * 1024 * 1024) throw new Error("Choose an image no larger than 3 MiB.");
}
export function messageId(value: unknown): string {
  const id = value && typeof value === "object" ? (value as { id?: unknown }).id : undefined;
  if (!safeId(id)) throw new Error("The saved reply could not be verified. Refresh this conversation before trying again.");
  return id;
}
export async function readPrivateAttachments(ticketId: string, read: <T>(path: string) => Promise<T>, admin = false): Promise<PrivateAttachment[]> {
  const base = `${privateAttachmentPath(ticketId, admin)}/attachments`;
  const records: PrivateAttachment[] = []; const seen = new Set<string>(); let cursor: string | null = null;
  for (let page = 0; page < 4; page++) {
    const result: { items: PrivateAttachment[]; nextCursor: string | null } = await read(base + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""));
    if (!result || !Array.isArray(result.items) || result.items.length > 50 || (result.nextCursor !== null && (typeof result.nextCursor !== "string" || !result.nextCursor || result.nextCursor.length > 4096))) throw new Error("The private attachment list could not be verified.");
    for (const record of result.items) {
      if (!record || !safeId(record.id) || !safeId(record.messageId) || record.ticketId !== ticketId || seen.has(record.id) || record.mimeType !== "image/webp" || !Number.isSafeInteger(record.sizeBytes) || record.sizeBytes < 1 || record.sizeBytes > 3 * 1024 * 1024 || !/^[a-f0-9]{64}$/i.test(record.sha256) || (record.filename !== null && (typeof record.filename !== "string" || record.filename.length > 255)) || !Number.isFinite(Date.parse(record.createdAt)) || (record.deletedAt !== null && !Number.isFinite(Date.parse(record.deletedAt)))) throw new Error("The private attachment list could not be verified.");
      seen.add(record.id); records.push(record);
    }
    if (result.nextCursor === null) return records;
    if (result.nextCursor === cursor) throw new Error("The private attachment list could not be verified.");
    cursor = result.nextCursor;
  }
  throw new Error("The private attachment history exceeds the supported limit. Refresh or contact support.");
}
