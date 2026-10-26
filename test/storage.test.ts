import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadWorkspace,commitWorkspace} from '../lib/storage.ts';
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
