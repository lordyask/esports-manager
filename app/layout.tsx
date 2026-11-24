import './doca-v2.css';
import type {Metadata,Viewport} from 'next';
import {APP_TITLE} from '../lib/release';
import localFont from 'next/font/local';
import './style.css';
import './nexus.css';
import './tactical-premium.css';
import './category-menu.css';
import './command-home.css';
import './arena-home.css';
import './first-access.css';
const exo=localFont({src:[{path:'./fonts/exo-2-400.ttf',weight:'400'},{path:'./fonts/exo-2-500.ttf',weight:'500'},{path:'./fonts/exo-2-600.ttf',weight:'600'},{path:'./fonts/exo-2-700.ttf',weight:'700'}],variable:'--font-exo',display:'swap'});
const orbitron=localFont({src:[{path:'./fonts/orbitron-500.ttf',weight:'500'},{path:'./fonts/orbitron-600.ttf',weight:'600'},{path:'./fonts/orbitron-700.ttf',weight:'700'}],variable:'--font-orbitron',display:'swap'});
const base=process.env.PAGES_BASE_PATH??'';
export const metadata:Metadata={
 title:APP_TITLE,
 description:'Monte seu elenco, distribua os recursos e comande uma equipe de FPS tático. Beta de teste com salvamento local.',
 applicationName:'NEXUS',
 manifest:`${base}/manifest.webmanifest`,
 icons:{icon:[{url:`${base}/favicon.svg`,type:'image/svg+xml'},{url:`${base}/favicon.ico`,sizes:'32x32',type:'image/x-icon'}],apple:[{url:`${base}/apple-touch-icon.png`,sizes:'180x180',type:'image/png'}]},
 appleWebApp:{capable:true,title:'NEXUS',statusBarStyle:'black-translucent'},
};
export const viewport:Viewport={themeColor:'#0B0B0D'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" className={`${exo.variable} ${orbitron.variable}`}><body>{children}</body></html>;}
