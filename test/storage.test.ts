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
 const loaded=await loadWorkspace();assert.equal(loaded!.revision,2);assert.equal(loaded!.data.draft.org,'Primeira aba');
 await assert.rejects(()=>commitWorkspace(initial,1),/Outra aba/);assert.equal((await loadWorkspace())!.revision,2);
});
