// Public smoke test in a new, disposable browser context. No existing user data is read.
import assert from 'node:assert/strict';
import {PLAYERS} from '../lib/game.ts';
const {chromium}=await import(process.env.NEXUS_PLAYWRIGHT??'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const url=process.env.NEXUS_PUBLIC_URL??'https://lordyask.github.io/esports-manager/';
const browser=await chromium.launch({headless:true,executablePath:process.env.NEXUS_CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);
 await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
 assert.ok((await page.title()).includes('Beta 2.1'));assert.ok((await page.locator('.category-data-tools').innerText()).includes('Beta 2.1'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 for(const img of await page.locator('.arena-home img, .category-brand img').all())assert.equal(await img.evaluate(i=>i.complete&&i.naturalWidth>0),true);
 const manifest=await page.evaluate(async()=>{const path=document.querySelector('link[rel="manifest"]').getAttribute('href'),r=await fetch(path);return {status:r.status,data:await r.json()};});
 assert.equal(manifest.status,200);assert.ok(manifest.data.name.includes('Beta 2.1'));assert.equal(manifest.data.start_url,'/esports-manager/');
 for(const icon of manifest.data.icons)assert.equal(await page.evaluate(async path=>(await fetch(path)).status,icon.src),200);
 assert.equal(await page.evaluate(async()=>('serviceWorker' in navigator?(await navigator.serviceWorker.getRegistrations()).length:0)),0);
 await page.getByRole('button',{name:'Abrir preferências',exact:true}).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
 await page.screenshot({path:'/tmp/nexus-beta21-public.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Montar meu elenco',exact:true}).click();
 for(const id of ['J12','J09','J02','J05','J24']){
  const player=PLAYERS.find(p=>p.id===id);assert.ok(player);
  await page.locator('.player-card').filter({has:page.getByRole('heading',{name:player.name,exact:true})}).getByRole('button',{name:/Selecionar jogador/}).click();
 }
 await page.getByRole('button',{name:'Preparar meu time',exact:true}).click();
 await page.getByRole('region',{name:'Mapa Doca V2'}).waitFor();
 const options=await page.locator('label').filter({has:page.getByText('Cenário',{exact:true})}).locator('select option').evaluateAll(nodes=>nodes.map(n=>n.value));assert.deepEqual(options,['doca-v2']);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({url,status:'passed',checks:['Beta 2.1 title and central','desktop assets','manifest and icons','no service worker','preferences dialog','roster navigation','Doca V2 as only active map']}));
 await context.close();
}finally{await browser.close();}
