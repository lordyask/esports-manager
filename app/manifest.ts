import type {MetadataRoute} from 'next';
import {BUILD_LABEL} from '../lib/release';
export const dynamic='force-static';
export default function manifest():MetadataRoute.Manifest{
 const base=process.env.PAGES_BASE_PATH??'';
 return {
  id:`${base}/`,name:`NEXUS Esports Manager — ${BUILD_LABEL}`,short_name:'NEXUS',lang:'pt-BR',
  description:'Monte seu elenco e comande sua equipe de FPS tático.',
  start_url:`${base}/`,scope:`${base}/`,display:'standalone',
  background_color:'#0B0B0D',theme_color:'#0B0B0D',
  icons:[{src:`${base}/brand/icon-192.png`,sizes:'192x192',type:'image/png',purpose:'any'},
   {src:`${base}/brand/icon-512.png`,sizes:'512x512',type:'image/png',purpose:'any'},
   {src:`${base}/brand/icon-maskable-512.png`,sizes:'512x512',type:'image/png',purpose:'maskable'}],
 };
}
