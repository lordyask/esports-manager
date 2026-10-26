import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadWorkspace,commitWorkspace,loadLegacyExport} from '../lib/storage.ts';
import {defaultDraft} from '../lib/game.ts';
test('local transaction rejects a stale tab and preserves the confirmed workspace',async()=>{
 const initial={draft:defaultDraft(),session:null};assert.equal(await loadWorkspace(),null);
 assert.equal(await commitWorkspace(initial,0),1);
 const results=await Promise.allSettled([commitWorkspace({...initial,draft:{...initial.draft,org:'Primeira aba'}},1),commitWorkspace({...initial,draft:{...initial.draft,org:'Segunda aba'}},1)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 const loaded=await loadWorkspace();assert.equal(loaded!.revision,2);assert.equal(('data' in loaded!?loaded!.data.draft.org:null),'Primeira aba');
 await assert.rejects(()=>commitWorkspace(initial,1),/Outra aba/);assert.equal((await loadWorkspace())!.revision,2);
});

test('an unreadable checkpoint preserves original bytes and revision so an explicit recovery can succeed',async()=>{
 const raw='original incompatible bytes';
 await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('esports-manager-beta-1.1',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:41,text:raw},'active');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};});
 const loaded=await loadWorkspace();assert.ok(loaded&&'raw' in loaded);assert.equal(loaded.raw,raw);assert.equal(loaded.revision,41);
 await assert.rejects(()=>commitWorkspace({draft:defaultDraft(),session:null},0),/Outra aba/);
 assert.equal(await commitWorkspace({draft:defaultDraft(),session:null},41),42);
 const restored=await loadWorkspace();assert.ok(restored&&'data' in restored);
});

test('legacy backup reads exact bytes without creating, upgrading or overwriting the old database',async()=>{
 const before=await indexedDB.databases();assert.equal(await loadLegacyExport(),null);assert.deepEqual(await indexedDB.databases(),before);
 const original='original beta 1.0 file bytes';
 await new Promise<void>(resolve=>{const r=indexedDB.open('esports-manager-beta',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>{const db=r.result,t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:7,text:original},'active');t.oncomplete=()=>{db.close();resolve();};};});
 assert.equal(await loadLegacyExport(),original);
 const names=await indexedDB.databases();assert.equal(names.find(d=>d.name==='esports-manager-beta')!.version,1);
 const current=await loadWorkspace();assert.ok(current);await commitWorkspace({draft:defaultDraft(),session:null},current.revision);
 assert.equal(await loadLegacyExport(),original);
});
