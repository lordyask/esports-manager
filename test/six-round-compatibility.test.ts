import {openReadyWorkspace} from '../lib/progress-reset.ts';
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace as oldFresh,defaultDraft as oldDraft,suggestAssignments as oldSuggest,createSession as oldSession,advanceSession as oldAdvance,automaticBuys as oldBuys,encodeSave as oldEncode} from '../legacy/v0_6_0/lib/game.ts';
import {historyJSON as oldHistory} from '../legacy/v0_6_0/lib/history.ts';
import {attackingTeam as oldAttackingTeam} from '../legacy/v0_6_0/src/map.ts';
import {freshWorkspace as olderFresh,encodeSave as olderEncode} from '../legacy/v0_5_1/lib/game.ts';
import {prepareImport,decodeSave,encodeSave,advanceSession} from '../lib/game.ts';
import {readArchive} from '../lib/archive.ts';
import {loadWorkspace} from '../lib/storage.ts';
import {attackingTeam} from '../src/map.ts';
import {sha256} from '../src/hash.ts';

const ids=['J12','J09','J02','J05','J24'];
const draft=()=>oldSuggest({...oldDraft(),selected:ids});
function advanceTo(session:ReturnType<typeof oldSession>,until:number){
 while(session.state.phase==='buy'&&session.state.rounds<until)session=oldAdvance(session,{id:`r${session.state.rounds}`,revision:session.state.rounds,buys:oldBuys(session),plans:{A:draft().plan,B:draft().plan}});
 return session;
}

test('old in-progress save and nested archives remain byte-for-byte preserved without switching sides',async()=>{
 const d=draft(),session=advanceTo(oldSession(d,'legacy-six-save'),7),child=olderEncode(olderFresh());
 assert.equal(session.state.rounds,7);assert.equal(oldAttackingTeam({...session.state,rounds:6}),'A');assert.equal(attackingTeam({...session.state,rounds:6}),'B');
 const original=oldEncode({...oldFresh(),draft:d,session,development:{...oldFresh().development!,used:true,matchId:session.id},archives:[{id:sha256(child),text:child}]});
 assert.throws(()=>decodeSave(original),/preservado/i);
 const imported=prepareImport(original);assert.equal(imported.archiveOnly,true);assert.equal(imported.data.session,null);assert.equal(imported.data.archives!.length,2);
 const archive=imported.data.archives!.find(a=>a.text===original)!,view=readArchive(archive);assert.equal(view.engine,'0.6.0');assert.equal(archive.text,original);assert.deepEqual(view.data.session,session);
 assert.equal(imported.data.archives!.find(a=>a.text===child)?.text,child);assert.equal(decodeSave(encodeSave(imported.data)).archives!.find(a=>a.id===archive.id)!.text,original);
 assert.throws(()=>advanceSession(session as never,{id:'new',revision:session.state.rounds,buys:'eco',plans:{A:d.plan,B:d.plan}}),/incompatível/);
 const db=await openReadyWorkspace();
 await new Promise<void>((resolve,reject)=>{const t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:1,text:original},'active');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});db.close();
 const loaded=await loadWorkspace();assert.ok(loaded&&'raw' in loaded);assert.equal(loaded.raw,original);assert.match(loaded.error,/preservado/i);
 const reread=await loadWorkspace();assert.ok(reread&&'raw' in reread);assert.equal(reread.raw,original);assert.equal(reread.revision,1);
});

test('old completed histories are read and exported with the original 12-round rule',()=>{
 const d=draft();let session=oldSession(d,'legacy-six-history');
 while(session.state.phase==='buy')session=oldAdvance(session,{id:`r${session.state.rounds}`,revision:session.state.rounds,buys:oldBuys(session),plans:{A:d.plan,B:d.plan}});
 assert.ok(session.state.rounds>=7);const raw=oldHistory([session]),imported=prepareImport(raw),archive=imported.data.archives![0],view=readArchive(archive);
 assert.equal(imported.archiveOnly,true);assert.equal(archive.text,raw);assert.equal(view.engine,'0.6.0');assert.deepEqual(view.data.history,[session]);
 assert.equal(oldAttackingTeam({...session.state,rounds:6}),'A');assert.equal(attackingTeam({...session.state,rounds:6}),'B');
});
