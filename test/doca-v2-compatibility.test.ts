import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace as oldFresh,defaultDraft as oldDraft,suggestAssignments as oldSuggest,createSession as oldSession,advanceSession as oldAdvance,encodeSave as oldEncode} from '../legacy/v0_5_1/lib/game.ts';
import {historyJSON as oldHistory} from '../legacy/v0_5_1/lib/history.ts';
import {prepareImport,decodeSave,encodeSave,advanceSession,freshWorkspace,defaultDraft,suggestAssignments,createSession,previewRound} from '../lib/game.ts';
import {readArchive} from '../lib/archive.ts';
import {roundsCSV} from '../lib/history.ts';
const ids=['J12','J09','J02','J05','J24'];
function previous(){const draft=oldSuggest({...oldDraft(),selected:ids});const session=oldSession(draft,'old-ongoing');return {draft,session};}
test('0.5.1 in-progress save requires explicit preservation; original map and round remain intact',()=>{
 const {draft,session}=previous(),next=oldAdvance(session,{id:'r0',revision:0,buys:'eco',plans:{A:draft.plan,B:draft.plan}});
 const old={...oldFresh(),draft,session:next,development:{...oldFresh().development!,used:true,matchId:next.id}};
 const raw=oldEncode(old);assert.throws(()=>decodeSave(raw),/preservado/i);
 const converted=prepareImport(raw);assert.equal(converted.archiveOnly,true);assert.equal(converted.data.session,null);
 const archive=converted.data.archives![0],view=readArchive(archive);assert.equal(archive.text,raw);assert.equal(view.engine,'0.5.1');assert.deepEqual(view.data.session,next);
 assert.equal(decodeSave(encodeSave(converted.data)).archives![0].text,raw);
 assert.throws(()=>advanceSession(next as never,{id:'new',revision:next.state.rounds,buys:'eco',plans:{A:draft.plan,B:draft.plan}}),/incompatível/);
});
test('completed 0.5.1 history remains readable and byte-for-byte exportable through the archive',()=>{
 const {draft}=previous();let session=oldSession(draft,'old-completed');while(session.state.phase!=='finished')session=oldAdvance(session,{id:`r${session.state.rounds}`,revision:session.state.rounds,buys:'eco',plans:{A:draft.plan,B:draft.plan}});
 const raw=oldHistory([session]),out=prepareImport(raw);assert.equal(out.archiveOnly,true);assert.equal(out.data.archives![0].text,raw);assert.deepEqual(readArchive(out.data.archives![0]).data.history,[session]);
});
test('new saves use the Doca V2 revision and reject obsolete active maps',()=>{
 const w=freshWorkspace();assert.equal(w.draft.map,'doca-v2');assert.deepEqual(decodeSave(encodeSave(w)),w);
 assert.throws(()=>decodeSave(encodeSave({...w,draft:{...w.draft,map:'doca'}})),/Configuração salva inválida/);
});
test('round receipt preserves actual retained and partially bought equipment for both teams',()=>{
 const draft=suggestAssignments({...defaultDraft(),selected:ids}),session=createSession(draft,'equipment-snapshot');
 const [retained,poor]=session.state.teams.A;retained.weapon='main';retained.shield=17;retained.credits=0;poor.credits=0;
 const buys=Object.fromEntries(session.state.teams.A.map((p,i)=>[p.id,i===1?'full' as const:'eco' as const]));
 const preview=previewRound(session,buys),next=advanceSession(session,{id:'equipment-r0',revision:0,buys,plans:{A:draft.plan,B:draft.plan}});
 for(const team of ['A','B'] as const)for(const item of next.records[0].equipment[team]){
  const account=preview.state.teams[team].find(p=>p.id===item.id)!,profile=session.profiles.find(p=>p.id===item.id)!;
  assert.equal(item.weapon,account.weapon);assert.equal(item.shield,account.shield);assert.deepEqual(item.charges,account.charges);assert.deepEqual(item.attrs,profile.attrs);
 }
 assert.equal(next.records[0].equipment.A.find(p=>p.id===retained.id)!.weapon,'main');
 assert.equal(next.records[0].equipment.A.find(p=>p.id===poor.id)!.weapon,'basic');
 const w={...freshWorkspace(),draft,session:next,development:{...freshWorkspace().development!,used:true,matchId:next.id}};
 assert.deepEqual(decodeSave(encodeSave(w)).session!.records[0].equipment,next.records[0].equipment);
 assert.ok(roundsCSV([next]).includes('equipamento_efetivo_time'));const invalid=structuredClone(w);invalid.session!.records[0].equipment.A[0].shield=999;
 assert.throws(()=>decodeSave(encodeSave(invalid)),/Equipamento inicial inválido/);
});
