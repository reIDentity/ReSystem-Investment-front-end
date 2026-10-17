/** Public project media uses the same gateway already used by the admin app. */
export function publicIpfsUrl(cid: unknown): string {
  if (typeof cid !== "string" || !/^[a-zA-Z0-9]{32,120}$/.test(cid)) {
    throw new Error("Invalid public IPFS CID");
  }
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
