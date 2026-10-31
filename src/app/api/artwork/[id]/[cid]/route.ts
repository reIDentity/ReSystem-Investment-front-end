import { proxyArtwork } from '@/lib/platform/artwork-proxy';
import { proxyConfig } from '@/lib/platform/proxy';
export async function GET(request:Request,context:{params:Promise<{id:string;cid:string}>}) {
  try { const {id,cid}=await context.params; return proxyArtwork(request,id,cid,proxyConfig(process.env).base); }
  catch { return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}}); }
}
