// Run against the local Pages export, in disposable Chromium profiles.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {defaultDraft,freshWorkspace,suggestAssignments,encodeSave} from '../lib/game.ts';
import {startCircuitCareer,startCareerMatch,advanceCareer} from '../lib/career.ts';
const {chromium}=await import(process.env.NEXUS_PLAYWRIGHT??'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=resolve('out'),prefix='/esports-manager/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(prefix))throw Error();
  const path=resolve(root,url.pathname.slice(prefix.length)||'index.html');if(!path.startsWith(root+'/'))throw Error();
  const body=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream'}).end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+prefix;
const browser=await chromium.launch({headless:true,executablePath:process.env.NEXUS_CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const out=process.env.NEXUS_QA_OUTPUT;
if(out)await mkdir(out,{recursive:true});
const errors=[];
function button(p,name){return p.getByRole('button',{name,exact:true});}
const card=(p,name)=>p.locator('.fa-catalog article').filter({has:p.getByRole('heading',{name,exact:true})});
const start=p=>p.getByRole('button',{name:/^Iniciar carreira/}).click();
async function stored(page){return page.evaluate(()=>new Promise((ok,fail)=>{
 const db=indexedDB.open('esports-manager-beta-1.1');db.onsuccess=()=>{
  const r=db.result.transaction('workspace').objectStore('workspace').get('active');
  r.onsuccess=()=>{db.result.close();ok(r.result?.text?JSON.parse(r.result.text).data:null);};r.onerror=()=>fail(r.error);
 };db.onerror=()=>fail(db.error);
}));}
async function snap(page,name){
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 if(out)await page.screenshot({path:out+'/'+name+'.png',animations:'disabled'});
}
async function saved(p){await p.getByText('● Salvo no dispositivo',{exact:true}).waitFor();}
async function sheet(p,target){
 await target.focus();await target.press('Enter');
 const d=p.getByRole('dialog');await d.waitFor();
 assert.deepEqual(await d.locator('.attribute-grid').evaluateAll(grids=>grids.map(g=>g.children.length)),[8,7,8]);
 await p.keyboard.press('Escape');assert.equal(await d.count(),0);
 assert.ok(await target.evaluate(e=>document.activeElement===e));
}
async function roleHelp(p,options){
 if(options){await p.getByRole('button',{name:'Abrir preferências'}).click();await p.locator('dialog[open] summary').filter({hasText:'Ajuda'}).click();}
 const origin=button(options?p.locator('dialog[open]'):p,'Funções táticas');await origin.click();
 const d=p.getByRole('dialog',{name:'Funções táticas'});await d.waitFor();assert.equal(await d.locator('dt').count(),7);
 await p.keyboard.press('Escape');assert.ok(await origin.evaluate(e=>e===document.activeElement));
 if(options)await p.keyboard.press('Escape');
}
async function primaryVisible(p,name){
 const b=button(p,name),box=await b.boundingBox(),vp=p.viewportSize();
 assert.ok(box&&box.y>=0&&box.y+box.height<=vp.height+1,'CTA outside viewport: '+name+' '+JSON.stringify(box));
}
try{
 for(const [mode,width,height] of [['economy',1280,720],['manual',1366,768],['balanced',1920,1080]]){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.getByRole('button',{name:/^Iniciar carreira/}).waitFor();await snap(p,mode+'-entrada');
  await start(p);await p.getByLabel('Nome da organização').fill('');
  assert.ok(await button(p,'Escolher meu elenco').isDisabled());
  await p.getByLabel('Nome da organização').fill('Nexus do Sul');await p.getByLabel('Sigla',{exact:true}).fill('sul');await button(p,'Escudo 3').click();
  assert.match(await p.locator('.fa-club').innerText(),/Nexus do Sul/);assert.match(await p.locator('.fa-club').innerText(),/SUL/);
  await primaryVisible(p,'Escolher meu elenco');await snap(p,mode+'-organizacao');await button(p,'Escolher meu elenco').click();
  const path=p.getByRole('button',{name:mode==='economy'?/^Elenco econômico/:mode==='balanced'?/^Elenco equilibrado/:/^Montar manualmente/});
  assert.equal(await p.locator('.fa-recommendations button').count(),3);
  await path.click();await saved(p);await roleHelp(p,false);await roleHelp(p,true);
  if(mode==='manual'){
   assert.equal((await stored(p)).draft.selected.length,0);
   const q=p.getByLabel('Buscar atleta'),role=p.getByLabel('Função tática',{exact:true}),ag=p.getByLabel('Classe do agente',{exact:true});
   await role.selectOption('IGL');await ag.selectOption('Iniciador');await q.fill('Son');assert.equal(await p.locator('.fa-catalog article').count(),1);
   await sheet(p,button(card(p,'Sonda'),'Ver ficha'));assert.equal(await q.inputValue(),'Son');
   await button(card(p,'Sonda'),'Ver ficha').click();await snap(p,'manual-ficha');await p.keyboard.press('Escape');
   await q.fill('');await role.selectOption('');await ag.selectOption('');
   const target=button(card(p,'Cedro'),'Ver ficha');await target.scrollIntoViewIfNeeded();const scroll=await p.locator('.fa-catalog').evaluate(e=>e.scrollTop);
   await sheet(p,target);assert.equal(await p.locator('.fa-catalog').evaluate(e=>e.scrollTop),scroll);
   for(const n of ['Drift','Pingo','Sonda'])await button(card(p,n),'Adicionar').click();
   await p.getByLabel('Capitão (IGL)').selectOption('J04');await saved(p);await p.reload();
   await p.getByRole('heading',{name:'Escolha seu elenco'}).waitFor();await saved(p);
   const partial=await stored(p);assert.deepEqual(partial.draft.selected,['J01','J02','J04']);assert.equal(partial.draft.igl,'J04');
   assert.equal(partial.draft.org,'Nexus do Sul');assert.equal(partial.draft.crest,2);assert.match(await p.locator('.fa-summary').innerText(),/7\.600 cr/);
   await button(p,'Voltar ao início').click();await p.getByRole('button',{name:/^Continuar carreira/}).click();
   for(const n of ['Nimbo','Cedro'])await button(card(p,n),'Adicionar').click();
  }else if(mode==='economy'){
   await button(p,'Trocar atleta · Sonda').click();const n=card(p,'Norte');await sheet(p,button(n,'Ver ficha'));
   await button(n,'Comparar troca').click();await sheet(p,button(n,'Ver ficha'));assert.equal(await button(n,'Comparar troca').getAttribute('aria-pressed'),'true');const proposal=await p.locator('.fa-proposal').innerText();
   for(const value of ['8.200','9.900','+1.700','2.100'])assert.ok(proposal.includes(value));
   await snap(p,'economy-troca');await button(p,'Aplicar troca').click();assert.equal(await p.getByLabel('Capitão (IGL)').inputValue(),'J12');
  }else{
   await button(p,'Trocar atleta · Drift').click();await button(card(p,'Vigia'),'Comparar troca').click();assert.ok(await button(p,'Aplicar troca').isDisabled());await button(p,'Cancelar troca').click();
  }
  await saved(p);await primaryVisible(p,'Revisar inscrição');await snap(p,mode+'-elenco');
  await button(p,'Revisar inscrição').click();await saved(p);await primaryVisible(p,'Confirmar inscrição');
  const draft=(await stored(p)).draft;
  await button(p,'Voltar ao elenco').click();await saved(p);assert.deepEqual((await stored(p)).draft,draft);
  await button(p,'Revisar inscrição').click();await saved(p);await snap(p,mode+'-inscricao');
  if(mode==='economy'){
   // Abort exactly the next IndexedDB workspace write on this disposable page.
   await p.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){
    if(this.name!=='workspace')return put.apply(this,args);
    IDBObjectStore.prototype.put=put;const request=put.apply(this,args);this.transaction.abort();return request;
   };});
   await button(p,'Confirmar inscrição').click();await p.locator('.fa-workbench').getByRole('alert').waitFor();assert.equal((await stored(p)).career,undefined);
  }
  await button(p,'Confirmar inscrição').evaluate(e=>{e.click();e.click();});
  await p.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
  await p.getByText('Inscrição confirmada. Sua equipe está no circuito.',{exact:true}).waitFor();
  const joined=await stored(p);assert.deepEqual(joined.career.roster,draft.selected);assert.equal(joined.draft.igl,draft.igl);
  assert.equal(joined.career.circuit.finance.ledger.filter(e=>e.kind==='entry').length,1);assert.equal(joined.onboarding,undefined);
  assert.equal(joined.career.circuit.matches.length,28);await p.reload();
  await p.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();assert.deepEqual((await stored(p)).career,joined.career);
  await roleHelp(p,true);console.log(mode,width+'x'+height,'passed');await ctx.close();
 }
 // Load prior-shape saves through the normal legacy path, including a live match.
 for(const active of [false,true]){
  const ctx=await browser.newContext(),p=await ctx.newPage();
  await p.goto(url);await p.getByRole('button',{name:/^Iniciar carreira/}).waitFor();
  const draft=suggestAssignments({...defaultDraft(),selected:['J01','J02','J04','J05','J24']});
  let w=startCircuitCareer({...freshWorkspace(),draft},'existing-career',17);
  if(active)w=startCareerMatch(advanceCareer(w,'event'));
  const text=encodeSave(w);
  await p.evaluate(text=>new Promise(ok=>{const req=indexedDB.open('esports-manager-beta-1.1');
   req.onsuccess=()=>{const db=req.result,t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:1,text},'active');t.oncomplete=()=>{db.close();ok()};};
  }),text);
  await p.reload();await p.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
  if(active){await button(p,'Continuar partida').click();await p.getByText('Preparação · 5 segundos simulados',{exact:true}).waitFor();}
  assert.deepEqual(await stored(p),JSON.parse(text).data);await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log('Existing career and active match passed.');
}finally{await browser.close();server.close();}
