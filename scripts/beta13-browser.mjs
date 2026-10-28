// Run on an isolated local HTTP server, never on the public Pages site.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {PLAYERS} from '../lib/game.ts';
import {readHistory} from '../lib/history.ts';
const {chromium}=await import(process.env.BETA13_PLAYWRIGHT??'/tmp/esports-browser/node_modules/playwright/index.mjs');
const {expect}=await import(process.env.BETA13_PLAYWRIGHT_EXPECT??'/tmp/esports-browser/node_modules/playwright/test.mjs');
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1','--directory','/tmp/esports-site'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
const artifacts='validation/beta13/browser';await mkdir(artifacts,{recursive:true});
const results=[];
const targetName=PLAYERS.find(p=>p.id==='J02').name;
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<500,acceptDownloads:true}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));let accept=true;page.on('dialog',d=>accept?d.accept():d.dismiss());
  const nav=async(name)=>{await page.getByRole('navigation').getByRole('button',{name:new RegExp(name)}).click();};
  const download=async(button)=>{const event=page.waitForEvent('download');await button.click();const file=await event;const path=await file.path();return {path,text:await readFile(path,'utf8')};};
  let opened=false;for(let n=0;n<20;n++){try{await page.goto('http://127.0.0.1:4173/esports-manager/');opened=true;break;}catch{await new Promise(r=>setTimeout(r,250));}}assert.ok(opened);
  await page.getByRole('button',{name:/Montar meu elenco/}).waitFor();
  await page.locator('input[type=file]').setInputFiles('/tmp/beta13-browser-fixture.json');
  await expect(page.getByText('Salvamento importado.',{exact:true})).toBeVisible();
  await nav('Histórico');await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(1);
  await nav('Relatório');await page.getByRole('button',{name:/Nova partida com o elenco/}).click();
  await page.getByLabel('Modalidade').selectOption('individual');
  await page.getByLabel('Atributo treinado').selectOption('6');
  await page.getByLabel('Jogador do treino individual').selectOption('J02');
  await nav('Agentes');await nav('Treinamento');await expect(page.getByLabel('Atributo treinado')).toHaveValue('6');
  await page.getByLabel('Foco do treino').selectOption('agent');await page.getByLabel(`Agente que será treinado por ${targetName}`).selectOption('Bastião');
  await expect(page.getByLabel(`Agente que será treinado por ${targetName}`)).toBeEnabled();await page.reload();await nav('Treinamento');await expect(page.getByLabel('Modalidade')).toHaveValue('individual');await expect(page.getByLabel(`Agente que será treinado por ${targetName}`)).toHaveValue('Bastião');
  await page.getByLabel('Foco do treino').selectOption('attribute');await expect(page.getByLabel('Atributo treinado')).toHaveValue('6');
  if(viewport.width<500)await page.getByLabel('Foco do treino').selectOption('agent');
  await page.screenshot({path:`${artifacts}/training-${viewport.width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Confirmar treino individual',exact:true}).click();await expect(page.getByText('Treino confirmado e salvo.',{exact:true})).toBeVisible();
  await nav('Treinamento');await expect(page.getByRole('button',{name:'Confirmar treino individual',exact:true})).toHaveCount(0);
  await nav('Preparação');await expect(page.getByLabel('Código reproduzível da partida')).toHaveCount(0);
  accept=false;await page.getByRole('button',{name:/Confirmar e ir à partida/}).click();await expect(page.getByRole('button',{name:/Confirmar e ir à partida/})).toBeEnabled();accept=true;
  await page.getByRole('button',{name:/Confirmar e ir à partida/}).click();await expect(page.getByText('Partida criada. Revise as compras antes de iniciar.',{exact:true})).toBeVisible();
  await page.getByLabel('Usar compras automáticas ao simular sequência').check();
  await expect(page.getByLabel('Usar compras automáticas ao simular sequência')).toBeEnabled();await page.reload();await nav('Partida');await expect(page.getByLabel('Usar compras automáticas ao simular sequência')).toBeChecked();
  await page.getByLabel('Ritmo entre rodadas automáticas').selectOption('fast');
  for(let i=0;i<3;i++){
   const button=page.getByRole('button',{name:'Simular até a próxima pausa',exact:true});if(!await button.count())break;
   await button.click();await page.getByText(/^(Partida concluída e salva\.|Sequência pausada na mudança de fase\.)/).waitFor({timeout:120000});
  }
  await expect(page.getByRole('heading',{name:'O que contribuiu para o resultado',exact:true})).toBeVisible();
  await nav('Histórico');await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(2);
  const backup=await download(page.getByRole('button',{name:'Exportar todo o histórico',exact:true}));const sessions=readHistory(backup.text);assert.equal(sessions.length,2);assert.notEqual(sessions[0].seed,sessions[1].seed);assert.ok(sessions[1].metadata.finishedAt);
  const csv=await download(page.getByRole('button',{name:'CSV jogadores',exact:true}).first());assert.ok(csv.text.includes('familiaridade'));
  const rounds=await download(page.getByRole('button',{name:'CSV rodadas',exact:true}).first());assert.ok(rounds.text.includes('compras_realizadas_time'));
  await page.getByRole('button',{name:'Abrir relatório',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Elenco e estatísticas da época',exact:true})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);assert.equal(overflow,false);
  await page.screenshot({path:`${artifacts}/history-${viewport.width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Excluir',exact:true}).first().click();await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(1);
  await page.reload();await nav('Histórico');await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(1);
  await page.locator('input[type=file]').setInputFiles(backup.path);await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(2);
  await page.locator('input[type=file]').setInputFiles(backup.path);await expect(page.getByText('Histórico importado sem substituir a partida ou o treinamento atuais.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(2);
  await page.getByRole('button',{name:'Reiniciar organização',exact:true}).click();await expect(page.getByText('Organização reiniciada.',{exact:true})).toBeVisible();await nav('Histórico');await expect(page.getByRole('button',{name:'Abrir relatório',exact:true})).toHaveCount(2);
  assert.deepEqual(errors,[]);results.push({viewport,status:'passed',history:sessions.length,checks:['schema2 import','individual choices reload','single training confirmation','start cancellation','auto-buy reload','automatic match','seed change','history JSON/CSV','deletion reload','merge deduplication','no horizontal overflow','no page errors','organization reset preserves history']});await context.close();
 }
 await writeFile(`${artifacts}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}catch(error){await writeFile(`${artifacts}/failure.txt`,String(error));for(const c of browser.contexts())for(const p of c.pages())await p.screenshot({path:`${artifacts}/failure.png`,fullPage:true}).catch(()=>{});throw error;}
finally{await browser.close();server.kill();}
