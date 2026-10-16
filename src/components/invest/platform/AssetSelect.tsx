"use client";
import type { PaymentAsset } from "@/lib/platform/money";
export function AssetSelect({ asset, setAsset, id }: { asset: PaymentAsset; setAsset: (asset: PaymentAsset) => void; id: string }) {
  return <><label className="iv-form-label" htmlFor={id}>Payment asset</label><select className="iv-input" id={id} value={asset} onChange={e => setAsset(e.target.value as PaymentAsset)}><option value="REAED">Native reAED</option><option value="USDT">Verified USDT</option></select></>;
}
