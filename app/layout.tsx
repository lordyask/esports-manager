import type {Metadata} from 'next';
import './style.css';
export const metadata:Metadata={title:'Esports Manager — Beta 1.0',description:'Monte seu elenco, distribua os recursos e comande uma equipe de FPS tático. Beta de teste com salvamento local.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
