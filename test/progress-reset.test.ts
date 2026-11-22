import assert from 'node:assert/strict';
import {beforeEach,test} from 'node:test';
import {IDBFactory} from 'fake-indexeddb';
import {confirmProgressReset,prepareProgressReset} from '../lib/progress-reset.ts';
import {commitWorkspace,loadWorkspace} from '../lib/storage.ts';
import {freshWorkspace} from '../lib/game.ts';

const current='esports-manager-beta-1.1',legacy='esports-manager-beta';
beforeEach(()=>{globalThis.indexedDB=new IDBFactory();});
function open(name:string,version?:number):Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open(name,version);
  r.onupgradeneeded=()=>r.result.createObjectStore('workspace');
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function seed(name:string,text:string){
 const db=await open(name,1);
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('workspace','readwrite');
  tx.objectStore('workspace').put({text,revision:4},'active');
  tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);
 });
 db.close();
}
async function stored(name:string){
 const db=await open(name);
 try{return await new Promise((resolve,reject)=>{
  const r=db.transaction('workspace').objectStore('workspace').get('active');
  r.onsuccess=()=>resolve(r.result?.text);r.onerror=()=>reject(r.error);
 });}finally{db.close();}
}
test('first visit skips the notice and a late confirmation preserves new progress',async()=>{
 assert.equal(await prepareProgressReset(),'done');
 const w=freshWorkspace();w.draft.org='Nova organização';
 await commitWorkspace(w,0);
 await confirmProgressReset();
 assert.equal(await prepareProgressReset(),'done');
 assert.deepEqual(await loadWorkspace(),{revision:1,data:w});
});
for(const source of [current,legacy]){
 test('a checkpoint in '+source+' alone requires acknowledgement before cleanup',async()=>{
  await seed(source,'undecodable legacy bytes');
  assert.equal(await prepareProgressReset(),'pending');
  await assert.rejects(commitWorkspace(freshWorkspace(),0),/Confirme/);
  assert.equal(await stored(source),'undecodable legacy bytes');
  assert.equal(await prepareProgressReset(),'pending');
  await confirmProgressReset();
  assert.equal(await stored(source),undefined);
  assert.equal(await loadWorkspace(),null);
 });
}
test('concurrent confirmations serialize, fence both legacy writers and preserve another database',async()=>{
 await seed(current,'career and archives');await seed(legacy,'beta 1.0');await seed('another-application','keep');
 assert.deepEqual(await Promise.all([prepareProgressReset(),prepareProgressReset()]),['pending','pending']);
 await Promise.all([confirmProgressReset(),confirmProgressReset()]);
 for(const name of [current,legacy]){
  assert.equal(await stored(name),undefined);
  await assert.rejects(open(name,1),{name:'VersionError'});
 }
 const w=freshWorkspace();await commitWorkspace(w,0);await confirmProgressReset();
 assert.equal((await loadWorkspace())?.revision,1);
 assert.equal(await stored('another-application'),'keep');
});
test('an interruption after legacy cleanup leaves confirmation pending and can be resumed',async()=>{
 await seed(legacy,'legacy only');assert.equal(await prepareProgressReset(),'pending');
 const db=await open(legacy);
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').clear();
  tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);
 });db.close();
 assert.equal(await prepareProgressReset(),'pending');
 await confirmProgressReset();assert.equal(await prepareProgressReset(),'done');
});
