// Isolated static build only. Never point this runner at production.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.MAPS_PLAYWRIGHT??'/tmp/esports-browser/node_modules/playwright/index.mjs');
const {expect}=await import((process.env.MAPS_PLAYWRIGHT??'/tmp/esports-browser/node_modules/playwright/index.mjs').replace(/index.mjs$/,'test.mjs'));
const server=spawn('python3',['-m','http.server','4175','--bind','127.0.0.1','--directory',process.env.MAPS_SERVER_ROOT??'/tmp/nexus-maps-site'],{stdio:'ignore'});
console.log('Starting Chromium');
const browser=await chromium.launch({headless:true,...(process.env.MAPS_CHROMIUM?{executablePath:process.env.MAPS_CHROMIUM,args:['--no-sandbox']}: {})});
const output='validation/maps/browser';await mkdir(output,{recursive:true});const results=[];
try{
 for(const map of ['doca','cume'])for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,isMobile:width<500}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});page.on('dialog',d=>d.accept());
  const nav=async(name)=>{const open=page.getByRole('button',{name:'Abrir menu',exact:true});if(await open.isVisible())await open.click();await page.getByRole('navigation').getByRole('button',{name:new RegExp(name)}).click();};
  console.log('Opening',map,width);await page.goto('http://127.0.0.1:4175/esports-manager/');await page.getByRole('button',{name:/Montar meu elenco/}).waitFor();
  await page.locator('input[type=file]').setInputFiles(resolve(`${output}/${map}-fixture.json`));await page.getByText('Salvamento importado.',{exact:true}).waitFor();
  await nav('Preparação');const panel=page.getByRole('region',{name:`Mapa ${map==='doca'?'Doca':'Cume'}`,exact:true});await panel.waitFor();
  assert.ok(await panel.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0));
  const area=panel.getByRole('button',{name:map==='doca'?'Setor A · Armazém':'Setor A · Observatório'});await area.focus();await page.keyboard.press('Enter');assert.equal(await area.getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:/Confirmar e ir à partida/}).click();await page.getByText('Partida criada. Revise as compras antes de iniciar.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Confirmar compras e jogar rodada',exact:true}).click();await page.getByText('FIM DA RODADA 1',{exact:true}).waitFor({timeout:60000});
  assert.equal(await page.locator('.map-marker').count(),10);
  await page.reload();await nav('Partida');await page.getByText('FIM DA RODADA 1',{exact:true}).waitFor();assert.equal(await page.locator('.map-marker').count(),10);
  await page.getByLabel('Usar compras automáticas ao simular sequência').click();await expect(page.getByLabel('Usar compras automáticas ao simular sequência')).toBeChecked();await expect(page.getByLabel('Usar compras automáticas ao simular sequência')).toBeEnabled();await page.getByLabel('Ritmo entre rodadas automáticas').selectOption('fast');
  for(let n=0;n<4;n++){
   const button=page.getByRole('button',{name:'Simular até a próxima pausa',exact:true});if(!await button.count())break;
   await button.click();await page.getByText(/^(Partida concluída e salva\.|Sequência pausada na mudança de fase\.)/).waitFor({timeout:60000});
  }
  await page.getByRole('heading',{name:'O que contribuiu para o resultado',exact:true}).waitFor();
  assert.equal(await page.locator('.map-marker').count(),10);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:`${output}/${map}-${width}.png`,fullPage:true});
  await nav('Histórico');await page.getByRole('button',{name:'Abrir relatório',exact:true}).click();await page.getByRole('region',{name:`Mapa ${map==='doca'?'Doca':'Cume'}`,exact:true}).waitFor();
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar todo o histórico',exact:true}).click();const download=await event;const backup=await readFile(await download.path(),'utf8');
  assert.ok(backup.includes(`\"map\": \"${map}\"`)||backup.includes(`\"map\":\"${map}\"`));
  await page.reload();await nav('Histórico');assert.equal(await page.getByRole('button',{name:'Abrir relatório',exact:true}).count(),1);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);results.push({map,width,status:'passed',checks:['art loaded under Pages base path','keyboard sector selection','ten final-sector markers','manual round','checkpoint reload','automatic match and phase pauses','history export and reload','no overflow','no JS errors or missing assets']});await context.close();
 }
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}catch(e){for(const c of browser.contexts())for(const p of c.pages())await p.screenshot({path:`${output}/failure.png`,fullPage:true}).catch(()=>{});throw e;}
finally{await browser.close();server.kill();}
