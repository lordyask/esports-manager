// Browser QA uses only generated synthetic fixtures and a local static export.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import {ATTRS,PLAYERS,salary} from '../lib/game.ts';
import {growthFor} from '../lib/development.ts';
import {cashCents} from '../lib/club-finance.ts';
import {AGENT_ART} from '../lib/agent-art.ts';
import {ABILITIES} from '../src/abilities.ts';

const {chromium}=await import(process.env.NEXUS_PLAYWRIGHT??'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=resolve('out'),fixtures=resolve(process.env.NEXUS_ARENA_FIXTURES??'/tmp/nexus-arena-command-fixtures'),output='validation/arena-premium';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!path.startsWith('/esports-manager/')){res.writeHead(404).end();return;}
  let file=resolve(root,`.${path.slice('/esports-manager'.length)}`);if(!file.startsWith(root+'/')&&file!==root)throw Error('invalid path');
  if((await stat(file)).isDirectory())file=join(file,'index.html');
  res.writeHead(200,{'content-type':mime[extname(file)]??'application/octet-stream'});createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,url=`${origin}/esports-manager/`;
await mkdir(`${output}/screenshots`,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.NEXUS_CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
async function open(width,height,fixture){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(`page: ${e.message}`));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(url,{waitUntil:'networkidle'});
 let raw;
 if(fixture){raw=await readFile(`${fixtures}/${fixture}.json`,'utf8');await page.evaluate(value=>new Promise((resolve,reject)=>{const q=indexedDB.open('esports-manager-beta-1.1',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:1,text:value},'active');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};}),raw);await page.reload({waitUntil:'networkidle'});}
 await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
 return {context,page,errors,raw,state:raw?JSON.parse(raw).data:null};
}
async function geometry(page){return page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,panels:[...document.querySelectorAll('.arena-panel')].map(n=>({label:n.querySelector('h2')?.textContent,stage:n.classList.contains('arena-stage'),clientWidth:n.clientWidth,scrollWidth:n.scrollWidth,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight}))}));}
async function checkLayout(page,errors){
 const g=await geometry(page);assert.ok(g.scrollWidth<=g.width+1,JSON.stringify(g));
 for(const p of g.panels)assert.ok((p.stage||p.scrollWidth<=p.clientWidth+2)&&p.scrollHeight<=p.clientHeight+2,JSON.stringify(p));
 const stageOverflow=await page.evaluate(()=>{const stage=document.querySelector('.arena-stage'),box=stage.getBoundingClientRect();return [...stage.querySelectorAll('.arena-title h2,.arena-versus,.arena-map,.arena-intro h2,.arena-intro p,.arena-next')].filter(n=>{const r=n.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1;}).map(n=>n.textContent);});
 assert.deepEqual(stageOverflow,[]);
 for(const img of await page.locator('.arena-home img, .category-brand img').all()){
  assert.ok((await img.getAttribute('src')).startsWith('/esports-manager/'));assert.equal(await img.evaluate(el=>el.complete&&el.naturalWidth>0),true);
 }
 const assets=await page.evaluate(async()=>Promise.all(['/esports-manager/brand/arena-dock.webp','/esports-manager/brand/tactical-stage.webp','/esports-manager/brand/nexus-monogram.png'].map(async p=>({path:p,status:(await fetch(p)).status}))));
 const fonts=await page.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family));
 assert.ok(fonts.includes('exo')&&fonts.includes('orbitron'),JSON.stringify(fonts));
 assert.ok(assets.every(a=>a.status===200),JSON.stringify(assets));assert.deepEqual(errors,[]);return g;
}
async function stored(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('esports-manager-beta-1.1',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,r=db.transaction('workspace').objectStore('workspace').get('active');r.onsuccess=()=>{db.close();resolve(r.result?.text??null);};r.onerror=()=>reject(r.error);};}));}

try{
 for(const [width,height] of [[1920,1080],[1280,900],[768,900],[390,844],[360,800]]){
  const {context,page,errors,raw,state}=await open(width,height,'career');
  const player=PLAYERS.find(p=>p.id===state.draft.igl),growth=growthFor(state.development,player.id),agent=state.draft.assignments[player.id].agent,fixture=state.career.fixtures.find(f=>f.result);
  assert.equal(await page.locator('.arena-agent-copy strong').innerText(),agent.toUpperCase());
  assert.equal(await page.locator('.arena-cash').innerText(),`${(cashCents(state.career.circuit.finance)/100).toLocaleString('pt-BR',{maximumFractionDigits:0})} cr.`);
  assert.ok((await page.locator('.arena-payroll').innerText()).includes(salary(state.draft).toLocaleString('pt-BR')));
  assert.ok((await page.locator('.arena-attributes').innerText()).includes(String(growth.attrs[5])));
  assert.ok((await page.locator('.arena-attributes').innerText()).includes(String(growth.attrs[6])));
  assert.ok((await page.locator('.arena-chart svg desc').textContent()).includes(`Dia ${fixture.day}: ${state.draft.tag} ${fixture.result.score.A}, adversário ${fixture.result.score.B}`));
  const layout=await checkLayout(page,errors);assert.equal(await stored(page),raw);
  if(width===1920||width===390)await page.screenshot({path:`${output}/screenshots/central-${width}.png`,fullPage:true,animations:'disabled'});
  results.push({viewport:`${width}x${height}`,fixture:'career',layout,realData:'matched synthetic save',assets:'loaded',save:'unchanged'});await context.close();
 }
 {
  const {context,page,errors}=await open(390,844,null);await page.getByText('Nenhum agente em destaque',{exact:true}).waitFor();
  assert.equal(await page.locator('.arena-agent-open').count(),0);assert.equal(await page.locator('.arena-chart > svg[role="img"]').count(),0);
  assert.equal(await page.locator('.arena-cash').innerText(),'—');assert.equal(await page.getByRole('button',{name:'Abrir treinamento',exact:true}).isDisabled(),true);
  await checkLayout(page,errors);await page.screenshot({path:`${output}/screenshots/central-vazia-390.png`,fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Montar meu elenco/}).click();assert.equal(await page.getByRole('button',{name:'Elenco',exact:true}).getAttribute('aria-current'),'page');
  results.push({viewport:'390x844',fixture:'empty',agent:'empty',chart:'empty',training:'disabled',primary:'roster'});await context.close();
 }
 {
  const {context,page,errors}=await open(390,844,'long');assert.ok((await page.locator('.arena-heading p').innerText()).includes('ORGANIZAÇÃO NEXUS INTERNACIONAL DE ELITE'));
  await checkLayout(page,errors);await page.screenshot({path:`${output}/screenshots/central-nome-longo-390.png`,fullPage:true,animations:'disabled'});
  results.push({viewport:'390x844',fixture:'long-name',overflow:'none'});await context.close();
 }
 {
  const {context,page,errors,raw,state}=await open(1280,900,'history'),score=state.history[0].state.score;
  assert.ok((await page.locator('.arena-chart svg desc').textContent()).includes(`Partida 1: Sua equipe ${score.A}, adversário ${score.B}`));
  assert.equal(await page.locator('.arena-results span').count(),1);assert.equal(await stored(page),raw);await checkLayout(page,errors);
  results.push({fixture:'history-without-career',results:'read from saved history',save:'unchanged'});await context.close();
 }
 {
  const {context,page,errors,state}=await open(1280,900,'partial'),player=PLAYERS.find(p=>p.id===state.draft.selected[0]);
  assert.equal(await page.locator('.arena-agent-copy strong').innerText(),player.main.toUpperCase());
  assert.ok(await page.getByText('AGENTE PRINCIPAL DO ATLETA',{exact:true}).isVisible());
  assert.equal(await page.getByRole('button',{name:'Abrir treinamento',exact:true}).isDisabled(),true);await checkLayout(page,errors);
  results.push({fixture:'partial-roster',agent:'actual main agent identified as such',training:'disabled'});await context.close();
 }
 {
  const {context,page,errors,raw,state}=await open(1280,900,'career'),agent=state.draft.assignments[state.draft.igl].agent;
  await page.locator('#main-content').focus();await page.keyboard.press('Tab');
  const focus=await page.evaluate(()=>({area:document.activeElement.classList.contains('arena-area'),visible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outlineStyle}));
  assert.equal(focus.area,true);assert.equal(focus.visible,true);assert.notEqual(focus.outline,'none');
  const selector=page.getByLabel('Jogador em destaque'),other=state.draft.selected.find(id=>id!==state.draft.igl);await selector.selectOption(other);
  const otherAgent=state.draft.assignments[other].agent;assert.equal(await page.locator('.arena-agent-copy strong').innerText(),otherAgent.toUpperCase());
  const otherArt=page.locator('.arena-agent-open img');assert.equal(await otherArt.getAttribute('src'),`/esports-manager${AGENT_ART[otherAgent].preview.src}`);
  await page.waitForFunction(()=>{const img=document.querySelector('.arena-agent-open img');return img?.complete&&img.naturalWidth>0;});
  assert.ok((await page.locator('.arena-attributes').innerText()).includes(String(growthFor(state.development,other).attrs[5])));
  await selector.selectOption(state.draft.igl);
  const agentButton=page.getByRole('button',{name:`Ver habilidades de ${agent}`,exact:true});await agentButton.focus();await page.keyboard.press('Enter');
  const dialog=page.locator('.arena-dialog[open]');await dialog.waitFor();for(const ability of ABILITIES[agent])assert.ok((await dialog.innerText()).includes(ability.name));
  await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await agentButton.evaluate(el=>document.activeElement===el),true);
  const profile=page.getByRole('button',{name:'Ver perfil completo',exact:true});await profile.focus();await page.keyboard.press('Enter');await page.locator('.arena-dialog[open]').waitFor();
  const attrRows=page.locator('.arena-dialog[open] .arena-dialog-attributes>div'),growth=growthFor(state.development,state.draft.igl);assert.equal(await attrRows.count(),8);
  for(let i=0;i<8;i++){const text=await attrRows.nth(i).innerText();assert.ok(text.includes(ATTRS[i])&&text.includes(String(growth.attrs[i])));}
  await page.keyboard.press('Escape');assert.equal(await profile.evaluate(el=>document.activeElement===el),true);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await agentButton.locator('img').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.locator('.arena-area').nth(1).click();await page.getByRole('heading',{name:'Equipe',exact:true}).waitFor();await page.getByRole('button',{name:'NEXUS — menu principal'}).click();
  await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();assert.equal(await stored(page),raw);assert.deepEqual(errors,[]);
  results.push({fixture:'career',keyboard:'Enter and Escape; focus restored',dialogs:'official abilities and eight trained attributes',categories:'team and return',reducedMotion:'respected',save:'unchanged'});await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'career');await page.getByRole('button',{name:'Treinar hoje',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Treinamento',exact:true}).getAttribute('aria-current'),'page');assert.deepEqual(errors,[]);await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'career');await page.locator('.arena-finance').getByRole('button',{name:/Consultar/}).click();
  assert.equal(await page.getByRole('button',{name:'Finanças',exact:true}).getAttribute('aria-current'),'page');assert.deepEqual(errors,[]);await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'career');await page.getByRole('button',{name:'Abrir calendário',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Calendário',exact:true}).getAttribute('aria-current'),'page');assert.deepEqual(errors,[]);await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'career');await page.getByRole('button',{name:/Preparar confronto/}).click();
  await page.getByRole('button',{name:'Preparação',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Preparação',exact:true}).getAttribute('aria-current'),'page');assert.deepEqual(errors,[]);await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'trained');assert.equal(await page.getByRole('button',{name:'Treinar hoje',exact:true}).isDisabled(),true);
  assert.ok(await page.getByText('Treino de hoje encerrado',{exact:true}).isVisible());assert.deepEqual(errors,[]);await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'active');assert.equal(await page.getByRole('button',{name:'Treinar hoje',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:/Continuar partida/}).click();assert.equal(await page.getByRole('button',{name:'Partida',exact:true}).getAttribute('aria-current'),'page');assert.deepEqual(errors,[]);await context.close();
 }
 {
  const {context,page,errors}=await open(1280,900,'processing');assert.ok(await page.getByRole('heading',{name:'Fechamento da rodada',exact:true}).isVisible());
  assert.ok(await page.getByRole('heading',{name:'Conclua a rodada.',exact:true}).isVisible());assert.equal(await page.getByRole('button',{name:'Treinar hoje',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:/Concluir rodada/}).click();await page.getByRole('heading',{name:'Resultados pendentes da rodada',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Avançar um dia',exact:true}).isDisabled(),true);assert.deepEqual(errors,[]);await context.close();
 }
 results.push({fixtures:['career','trained','active','processing'],navigation:['training','finances','preparation','match','calendar processing'],locks:'preserved'});
 await writeFile(`${output}/browser-results.json`,JSON.stringify({scope:'Synthetic local fixtures, Chromium; no user save or public deployment.',basePath:'/esports-manager',results},null,2)+'\n');
 console.log(JSON.stringify({status:'passed',scenarios:results.length,output}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
