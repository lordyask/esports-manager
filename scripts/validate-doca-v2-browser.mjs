// Local static export only; no published site or external user data.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.NEXUS_PLAYWRIGHT??'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const server=spawn('python3',['-m','http.server','4179','--bind','127.0.0.1','--directory','out'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,executablePath:process.env.NEXUS_CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const fixture=await readFile('/tmp/nexus-doca-v2-browser-save.json','utf8'),old=await readFile('/tmp/nexus-doca-v2-browser-old.json','utf8');
const results=[];await mkdir('/tmp/nexus-doca-v2-browser',{recursive:true});
try{
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<500}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
  for(let n=0;;n++){try{await page.goto('http://127.0.0.1:4179/');break;}catch(e){if(n===30)throw e;await new Promise(r=>setTimeout(r,200));}}
  await page.getByRole('button',{name:/Montar meu elenco/}).waitFor();
  await page.locator('input[type=file]').setInputFiles('/tmp/nexus-doca-v2-browser-save.json');
  await page.getByText('Salvamento importado.',{exact:true}).waitFor();
  await page.getByText('Preparação · 5 segundos simulados',{exact:true}).waitFor();
  const defenders=page.locator('select[aria-label^="Posição defensiva de "]');assert.equal(await defenders.count(),5);
  for(let i=0;i<5;i++)await defenders.nth(i).selectOption('B');
  await page.getByRole('button',{name:'Confirmar compras e jogar rodada',exact:true}).click();
  await page.getByText('FIM DA RODADA 1',{exact:true}).waitFor({timeout:60000});
  const map=page.getByRole('region',{name:'Mapa Doca V2'});await map.waitFor();
  const equipment=page.locator('details').filter({has:page.getByText('Equipamento efetivo no início da rodada',{exact:true})});
  await equipment.locator('summary').click();assert.equal(await equipment.locator('tbody tr').count(),10);
  const area=map.getByRole('button',{name:'Área Galeria de Serviço · centro'});await area.focus();await page.keyboard.press('Enter');assert.equal(await area.getAttribute('aria-pressed'),'true');
  await map.screenshot({path:`/tmp/nexus-doca-v2-browser/map-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  const stored=await page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('esports-manager-beta-1.1');q.onsuccess=()=>{const db=q.result,r=db.transaction('workspace').objectStore('workspace').get('active');r.onsuccess=()=>resolve(r.result.text);r.onerror=()=>reject(r.error);};}));
  const state=JSON.parse(stored).data;assert.equal(state.session.records.length,1);assert.ok(Object.values(state.session.records[0].command.plans.A.defenseAssignments).every(x=>x==='B'));assert.equal(state.session.records[0].equipment.A.length,5);assert.equal(state.session.records[0].equipment.B.length,5);
  assert.ok(state.session.records[0].result.events.some(e=>e.kind==='action_start'&&e.at===5000));assert.deepEqual(errors,[]);
  results.push({width,status:'passed',checks:['preparation controls','five B assignments saved','worker round','actual equipment for ten players','action begins at 5 s','keyboard map selection','no horizontal overflow','no page errors']});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();page.on('dialog',d=>d.accept());await page.goto('http://127.0.0.1:4179/');await page.getByRole('button',{name:/Montar meu elenco/}).waitFor();
 await page.evaluate(raw=>new Promise((resolve,reject)=>{const q=indexedDB.open('esports-manager-beta-1.1');q.onsuccess=()=>{const db=q.result,t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:1,text:raw},'active');t.oncomplete=resolve;t.onerror=()=>reject(t.error);};}),old);
 await page.reload();await page.getByRole('heading',{name:'Seu arquivo foi preservado.'}).waitFor();
 const before=await page.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('esports-manager-beta-1.1');q.onsuccess=()=>{const r=q.result.transaction('workspace').objectStore('workspace').get('active');r.onsuccess=()=>resolve(r.result.text);};}));assert.equal(before,old);
 await page.locator('input[type=file]').setInputFiles('/tmp/nexus-doca-v2-browser-save.json');await page.getByText('Salvamento importado.',{exact:true}).waitFor();
 const after=await page.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('esports-manager-beta-1.1');q.onsuccess=()=>{const r=q.result.transaction('workspace').objectStore('workspace').get('active');r.onsuccess=()=>resolve(r.result.text);};}));
 assert.equal(JSON.parse(after).data.archives.find(a=>a.text===old)?.text,old);assert.equal(JSON.parse(after).data.session.id,JSON.parse(fixture).data.session.id);
 results.push({status:'passed',checks:['legacy active save unchanged on load','explicit import preserves exact original in archive']});await context.close();
 await writeFile('validation/doca-v2/browser.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
}finally{await browser.close();server.kill();}
