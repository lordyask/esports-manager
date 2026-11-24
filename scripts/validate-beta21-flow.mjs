// End-to-end release checks with isolated browser profiles and synthetic data only.
import assert from 'node:assert/strict';
import {APP_TITLE} from '../lib/release.ts';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import {advanceSession,automaticBuys,encodeSave} from '../lib/game.ts';
import {acceptCareerResult,advanceCareer,startCareerMatch} from '../lib/career.ts';
import {createNpcSession,npcCommand,acceptNpcResult} from '../lib/circuit.ts';
import {pendingNpc} from '../lib/circuit-state.ts';
import {clubPlan} from '../lib/club-policy.ts';
import {BETA_2_1_1_MECHANICS} from '../src/content.ts';
import {addArchive,archiveFromText} from '../lib/archive.ts';
import {enrollEconomy} from './enroll-browser.mjs';
import {checkProgressReset} from './progress-reset-browser.mjs';

const {chromium}=await import(process.env.NEXUS_PLAYWRIGHT??'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const output=resolve(process.env.NEXUS_BETA21_OUTPUT??'/tmp/nexus-beta21-flow');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const root=resolve(req.headers['x-nexus-test-export']==='previous'?(process.env.NEXUS_PRE_RESET_EXPORT??'out'):'out');
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith('/esports-manager/')){res.writeHead(404).end();return;}
  let file=resolve(root,`.${path.slice('/esports-manager'.length)}`);
  if(!file.startsWith(root+'/')&&file!==root)throw Error('invalid path');
  if((await stat(file)).isDirectory())file=join(file,'index.html');
  res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream'});createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/esports-manager/`;
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.NEXUS_CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
const stored=page=>page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('esports-manager-beta-1.1');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,r=db.transaction('workspace').objectStore('workspace').get('active');r.onsuccess=()=>{db.close();resolve(r.result?.text??null);};r.onerror=()=>reject(r.error);};}));
const put=async(page,text)=>page.evaluate(value=>new Promise((resolve,reject)=>{const q=indexedDB.open('esports-manager-beta-1.1');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:1,text:value},'active');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};}),text);
const data=async page=>JSON.parse(await stored(page)).data;
async function trainOneDay(page){
 await enrollEconomy(page);
 assert.equal((await data(page)).draft.selected.length,5);
 await page.locator('.arena-nav-calendar').click();
 await page.getByRole('heading',{name:'Dia 1 de 28',exact:true}).waitFor();
 const state=await data(page);
 assert.equal(state.career.fixtures.length,7);assert.ok(state.career.fixtures.every(f=>f.map==='doca-v2'));
 assert.equal(state.career.circuit.matches.length,28);assert.ok(state.career.circuit.matches.every(m=>m.map==='doca-v2'));
 await page.getByRole('button',{name:'Treinar hoje',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar treino coletivo',exact:true}).click();
 await page.getByText(/Treino confirmado e salvo/).waitFor();
}
// The old tab must receive a genuine r6 career, including every recorded result.
function preResetSave(firstMatch,archive){
 let w=structuredClone(firstMatch);
 assert.equal(w.session.state.rounds,0);
 w.session.mechanics=BETA_2_1_1_MECHANICS;
 while(w.session.state.phase==='buy'){
  const s=w.session,round=s.state.rounds;
  const plans={A:w.draft.plan,B:clubPlan(s.metadata.opponentId,s.seed,round)};
  w=acceptCareerResult(w,advanceSession(s,{id:'previous-'+round,revision:round,buys:automaticBuys(s),plans}));
 }
 let match;
 while((match=pendingNpc(w.career))){
  let npc=createNpcSession(match);
  npc.mechanics=BETA_2_1_1_MECHANICS;
  while(npc.state.phase==='buy')npc=advanceSession(npc,npcCommand(match,npc));
  w=acceptNpcResult(w,match.id,npc);
 }
 const next=startCareerMatch(advanceCareer(w,'event'));
 next.session.mechanics=BETA_2_1_1_MECHANICS;
 const envelope=JSON.parse(encodeSave(addArchive(next,archiveFromText(archive))));
 return JSON.stringify({...envelope,beta:'2.1.1',mechanics:BETA_2_1_1_MECHANICS});
}
try{
 const context=await browser.newContext({viewport:{width:1366,height:768},acceptDownloads:true}),page=await context.newPage(),errors=[],dialogs=[];
 page.on('pageerror',e=>errors.push(`page: ${e.message}`));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.on('dialog',d=>{dialogs.push(d.message());return d.accept();});
 await page.goto(url,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/^Iniciar carreira/}).waitFor();
 assert.equal(await page.title(),APP_TITLE);
 assert.equal(await page.evaluate(async()=>('serviceWorker' in navigator?(await navigator.serviceWorker.getRegistrations()).length:0)),0);
 await trainOneDay(page);
 let state=await data(page);assert.equal(state.career.days[0].status,'trained');assert.equal(state.career.days[0].receipt.gains.length,5);
 await page.reload();await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
 await page.locator('.arena-nav-calendar').click();
 assert.ok((await page.getByTestId('daily-status').innerText()).includes('realizado'));
 await page.getByRole('button',{name:'Avançar até o próximo jogo',exact:true}).click();
 await page.getByRole('heading',{name:'Dia 4 de 28',exact:true}).waitFor();
 await page.getByRole('button',{name:'Preparar confronto de hoje',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar e ir à partida',exact:true}).click();
 await page.getByText('Preparação · 5 segundos simulados',{exact:true}).waitFor();
 const firstMatch=await data(page);assert.equal(firstMatch.session.map,'doca-v2');
 await page.getByRole('button',{name:'Confirmar compras e jogar rodada',exact:true}).click();
 await page.getByText('FIM DA RODADA 1',{exact:true}).waitFor({timeout:60000});
 state=await data(page);const first=state.session.records[0];assert.equal(first.equipment.A.length,5);assert.equal(first.equipment.B.length,5);
 assert.ok([...first.equipment.A,...first.equipment.B].every(item=>Array.isArray(item.attrs)&&item.attrs.length===8&&typeof item.weapon==='string'));
 assert.ok(first.result.events.some(e=>e.kind==='action_start'&&e.at===5000));
 await page.reload();await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
 await page.getByRole('button',{name:'Continuar partida',exact:true}).click();
 await page.getByText('FIM DA RODADA 1',{exact:true}).waitFor();
 const autoBuy=page.getByLabel('Usar compras automáticas ao simular sequência');
 await autoBuy.click();await autoBuy.and(page.locator(':checked')).waitFor();
 await page.getByLabel('Ritmo entre rodadas automáticas').selectOption('fast');
 for(let n=0;n<6;n++){
  if(!(await page.getByRole('button',{name:'Simular até a próxima pausa',exact:true}).count()))break;
  const prior=(await data(page)).session.state.rounds;
  await page.getByRole('button',{name:'Simular até a próxima pausa',exact:true}).click();
  await page.waitForFunction(()=>{const text=document.querySelector('[role="status"]')?.textContent??'';return (text.includes('Sequência pausada na mudança de fase')||text.includes('Partida e resultados da rodada salvos'))&&!document.querySelector('.match-actions button:disabled');},null,{timeout:180000});
  state=await data(page);assert.ok(state.session.state.rounds>prior);
  if(state.session.state.phase==='finished')break;
  assert.ok([6,12,18,24].includes(state.session.state.rounds));
 }
 await page.getByText('Partida e resultados da rodada salvos.',{exact:true}).waitFor({timeout:180000});
 state=await data(page);assert.equal(state.session.state.phase,'finished');
 assert.equal(state.career.fixtures.filter(f=>f.result).length,1);
 const completed=state.career.circuit.matches.filter(m=>m.result);
 assert.equal(completed.length,4);assert.equal(completed.filter(m=>m.a!=='user'&&m.b!=='user').length,3);
 assert.ok(completed.every(m=>m.map==='doca-v2'&&m.result.receipts.length>0));
 assert.ok(state.history.some(s=>s.id===state.session.id));
 const finished=await stored(page);await page.reload();await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
 assert.equal(await stored(page),finished);assert.deepEqual(errors,[]);
 results.push({scenario:'new-career',status:'passed',rounds:state.session.state.rounds,npcResults:3,checks:['five-player roster','new circuit with Doca V2 for all 28 matches','training and reload','calendar advance','start and simulated preparation','effective equipment and attributes','round reload','complete match','three NPC results saved','completed save reload','no service worker']});
 await context.close();

 const recoveryContext=await browser.newContext({viewport:{width:1366,height:768},acceptDownloads:true}),recoveryPage=await recoveryContext.newPage();
 const old=await readFile('/tmp/nexus-doca-v2-browser-old.json','utf8');
 await recoveryPage.goto(url);await recoveryPage.getByRole('button',{name:/^Iniciar carreira/}).waitFor();await put(recoveryPage,old);await recoveryPage.reload();
 await recoveryPage.getByRole('heading',{name:'Seu arquivo foi preservado.',exact:true}).waitFor();assert.equal(await stored(recoveryPage),old);
 const [download]=await Promise.all([recoveryPage.waitForEvent('download'),recoveryPage.getByRole('button',{name:'Exportar arquivo preservado',exact:true}).click()]);
 assert.equal(await readFile(await download.path(),'utf8'),old);
 await recoveryPage.getByRole('button',{name:'Reiniciar com esta versão',exact:true}).click();
 await recoveryPage.locator('dialog[open]').getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await stored(recoveryPage),old);
 await recoveryPage.getByRole('button',{name:'Reiniciar com esta versão',exact:true}).click();
 await recoveryPage.locator('dialog[open]').getByRole('button',{name:'Confirmar reinício da organização',exact:true}).click();
 await recoveryPage.getByText('Organização reiniciada. Registros preservados no acervo.',{exact:true}).waitFor();
 state=await data(recoveryPage);assert.equal(state.archives.filter(a=>a.text===old).length,1);assert.equal(state.career,undefined);assert.equal(state.session,null);
 await recoveryPage.reload();assert.equal((await data(recoveryPage)).archives.find(a=>a.text===old).text,old);
 results.push({scenario:'legacy-recovery',status:'passed',checks:['old active save unchanged on load','exact-byte original export','cancel leaves save unchanged','explicit reset preserves exact original in archive','archive remains after reload']});
 await recoveryContext.close();
 await checkProgressReset({browser,url,currentSave:preResetSave(firstMatch,old),oldSave:old,trainOneDay});
 results.push({scenario:'general-progress-reset',status:'passed',previousAppTested:!!process.env.NEXUS_PRE_RESET_EXPORT});

 await writeFile(join(output,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}catch(error){for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{await browser.close();server.close();}
