// A disposable profile starts with the IndexedDB layout of the published Beta 2.1.1.
import assert from 'node:assert/strict';
const notice='O NEXUS recebeu uma atualização. Para iniciar esta nova etapa do beta, seu progresso anterior será zerado neste navegador, incluindo carreira, elenco, treinos e históricos de partidas. Ao continuar, você poderá criar uma nova carreira do zero.';
const confirm=page=>page.getByRole('button',{name:'Entendi, iniciar nova carreira',exact:true});
async function priorProfile(page,url,text){
 await page.route(url+'qa-seed',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>QA</title>'}));
 await page.goto(url+'qa-seed');
 await page.evaluate(async raw=>{
  async function seed(name,value){
   await new Promise((ok,fail)=>{
    const r=indexedDB.open(name,1);
    r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onerror=()=>fail(r.error);
    r.onsuccess=()=>{const db=r.result,t=db.transaction('workspace','readwrite');
     t.objectStore('workspace').put({revision:5,text:value},'active');
     t.oncomplete=()=>{db.close();ok();};t.onabort=()=>fail(t.error);
    };
   });
  }
  await seed('esports-manager-beta-1.1',raw);await seed('esports-manager-beta','legacy checkpoint');
  await seed('unrelated-app','keep');localStorage.setItem('unrelated-pref','keep');localStorage.setItem('nexus.ui.motion','reduce');
 },text);
}
function readSlot(page,name){
 return page.evaluate(key=>new Promise((resolve,reject)=>{
  const r=indexedDB.open(key);
  r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{const db=r.result,q=db.transaction('workspace').objectStore('workspace').get('active');
   q.onsuccess=()=>{db.close();resolve(q.result?.text??null);};q.onerror=()=>reject(q.error);
  };
 }),name);
}

export async function checkProgressReset({browser,url,currentSave,oldSave,trainOneDay}){
 const primary='esports-manager-beta-1.1',legacy='esports-manager-beta';
 for(const [kind,text] of [['old-recovery',oldSave],['active-career',currentSave]]){
  const context=await browser.newContext(),page=await context.newPage(),stale=await context.newPage();
  try{
   await priorProfile(stale,url,text);
   const oldApp=kind==='active-career'&&!!process.env.NEXUS_PRE_RESET_EXPORT;
   if(oldApp){
    await stale.setExtraHTTPHeaders({'x-nexus-test-export':'previous'});
    await stale.goto(url);await stale.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
    assert.match(await stale.title(),/Beta 2\.1\.1\b/);
    await stale.locator('.arena-areas button').first().click();
    await stale.getByRole('button',{name:/^Visão geral Resumo/}).click();
   }
   await page.goto(url);await page.getByText(notice,{exact:true}).waitFor();await page.reload();await confirm(page).waitFor();
   assert.equal(await readSlot(page,primary),text);assert.equal(await readSlot(page,legacy),'legacy checkpoint');
   assert.equal(await page.getByRole('button',{name:/^Iniciar carreira/}).count(),0);
   const second=await context.newPage();await second.goto(url);await confirm(second).waitFor();
   await confirm(page).click();await page.getByRole('button',{name:/^Iniciar carreira/}).waitFor();
   assert.equal(await readSlot(page,primary),null);assert.equal(await readSlot(page,legacy),null);
   await second.getByRole('button',{name:/^Iniciar carreira/}).waitFor();
   assert.equal(await readSlot(page,'unrelated-app'),'keep');
   assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('nexus.ui.motion'),localStorage.getItem('unrelated-pref')]),['reduce','keep']);
   if(kind==='active-career'){
    page.on('dialog',dialog=>dialog.accept());
    await trainOneDay(page);
    const trained=await readSlot(page,primary),w=JSON.parse(trained).data;
    assert.equal(w.career.day,1);assert.equal(w.career.days[0].status,'trained');
    assert.equal(w.career.days[0].receipt.gains.length,5);assert.equal(w.session,null);
    assert.equal(w.history?.length??0,0);assert.equal(w.archives?.length??0,0);
    assert.notEqual(w.career.id,JSON.parse(currentSave).data.career.id);
    if(oldApp){
     await stale.getByRole('button',{name:'Salvar organização',exact:true}).click();
     await stale.locator('.notice.error').waitFor();
    }
    assert.equal(await stale.evaluate(()=>new Promise(resolve=>{
     const r=indexedDB.open('esports-manager-beta-1.1',1);
     r.onsuccess=()=>{r.result.close();resolve('unexpected success');};r.onerror=()=>resolve(r.error.name);
    })),'VersionError');
    await second.reload();await second.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
    await page.reload();await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
    await page.locator('.arena-nav-calendar').click();
    assert.match(await page.getByTestId('daily-status').innerText(),/realizado/);
    assert.equal(await readSlot(second,primary),trained);
   }
  }finally{await context.close();}
 }
}
