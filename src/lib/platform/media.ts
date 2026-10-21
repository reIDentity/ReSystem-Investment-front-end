/** Public, content-addressed project assets. Never append gateway credentials. */
export function publicIpfsUrl(cid: unknown): string {
  if (typeof cid !== "string" || !/^[a-zA-Z0-9]{32,120}$/.test(cid)) {
    throw new Error("Invalid public IPFS CID");
  }
  return `https://ipfs.filebase.io/ipfs/${cid}`;
}
