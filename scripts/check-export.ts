import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const base=process.env.PAGES_BASE_PATH??'',html=readFileSync('out/index.html','utf8');
for(const name of ['favicon.svg','favicon.ico','apple-touch-icon.png','manifest.webmanifest','brand/logo-horizontal.svg']){
 if(!html.includes(`${base}/${name}`)||!existsSync(join('out',name)))throw new Error(`Missing export asset/reference: ${name}`);
}
const manifest=JSON.parse(readFileSync('out/manifest.webmanifest','utf8'));if(manifest.start_url!==base+'/'||manifest.scope!==base+'/')throw new Error('Manifest path mismatch');
for(const icon of manifest.icons){if(!icon.src.startsWith(base+'/')||!existsSync(join('out',icon.src.slice(base.length))))throw new Error('Missing icon');}
const walk=(p:string):string[]=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name)]);
const js=walk('out/_next/static').filter(n=>n.endsWith('.js'));if(!js.some(n=>readFileSync(n,'utf8').includes('onmessage')&&readFileSync(n,'utf8').includes('postMessage')))throw new Error('Worker bundle not found');
console.log(`Export assets, manifest and worker checked for ${base||'/'}; ${js.length} JS bundles.`);
