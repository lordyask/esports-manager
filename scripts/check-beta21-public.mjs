// Public smoke test in a new, disposable browser context. No existing user data is read.
import assert from 'node:assert/strict';
import {APP_TITLE,BUILD_LABEL} from '../lib/release.ts';
import {enrollEconomy} from './enroll-browser.mjs';
const {chromium}=await import(process.env.NEXUS_PLAYWRIGHT??'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const url=process.env.NEXUS_PUBLIC_URL??'https://lordyask.github.io/esports-manager/';
const browser=await chromium.launch({headless:true,executablePath:process.env.NEXUS_CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);
 await enrollEconomy(page);
 assert.equal(await page.title(),APP_TITLE);assert.ok((await page.locator('.category-data-tools').innerText()).includes(BUILD_LABEL));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 for(const img of await page.locator('.arena-home img, .category-brand img').all())assert.equal(await img.evaluate(i=>i.complete&&i.naturalWidth>0),true);
 const manifest=await page.evaluate(async()=>{const path=document.querySelector('link[rel="manifest"]').getAttribute('href'),r=await fetch(path);return {status:r.status,data:await r.json()};});
 assert.equal(manifest.status,200);assert.equal(manifest.data.name,`NEXUS Esports Manager — ${BUILD_LABEL}`);assert.equal(manifest.data.start_url,'/esports-manager/');
 for(const icon of manifest.data.icons)assert.equal(await page.evaluate(async path=>(await fetch(path)).status,icon.src),200);
 assert.equal(await page.evaluate(async()=>('serviceWorker' in navigator?(await navigator.serviceWorker.getRegistrations()).length:0)),0);
 await page.getByRole('button',{name:'Abrir preferências',exact:true}).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
 await page.screenshot({path:'/tmp/nexus-beta21-public.png',fullPage:true,animations:'disabled'});
 await page.locator('.arena-areas').getByRole('button',{name:/Competição/}).click();
 await page.getByRole('button',{name:/^Preparação Organize/}).click();
 await page.getByRole('region',{name:'Mapa Doca V2'}).waitFor();
 assert.match(await page.getByRole('heading',{name:'Confronto do calendário'}).locator('..').innerText(),/Doca V2/);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({url,status:'passed',checks:[APP_TITLE,'desktop assets','manifest and icons','no service worker','preferences dialog','first-access enrollment','Doca V2 in match preparation']}));
 await context.close();
}finally{await browser.close();}
