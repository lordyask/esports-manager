import type {Metadata,Viewport} from 'next';
import './style.css';
const base=process.env.PAGES_BASE_PATH??'';
export const metadata:Metadata={
 title:'Esports Manager — Beta 1.3',
 description:'Monte seu elenco, distribua os recursos e comande uma equipe de FPS tático. Beta de teste com salvamento local.',
 applicationName:'Esports Manager',
 manifest:`${base}/manifest.webmanifest`,
 icons:{icon:[{url:`${base}/favicon.svg`,type:'image/svg+xml'},{url:`${base}/favicon.ico`,sizes:'32x32',type:'image/x-icon'}],apple:[{url:`${base}/apple-touch-icon.png`,sizes:'180x180',type:'image/png'}]},
 appleWebApp:{capable:true,title:'Esports Manager',statusBarStyle:'black-translucent'},
};
export const viewport:Viewport={themeColor:'#0C1015'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
