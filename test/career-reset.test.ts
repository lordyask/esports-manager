import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace,defaultDraft,suggestAssignments,encodeSave,decodeSave,prepareImport,createSession,advanceSession,automaticBuys} from '../lib/game.ts';
import {startCircuitCareer,advanceCareer,trainCareer,startCareerMatch} from '../lib/career.ts';
import {restartCareer,archiveFromText,addArchive,readArchive,removeArchive,rescueArchive,legacyWorkspace} from '../lib/archive.ts';
import {growthFor} from '../lib/development.ts';
import {loadWorkspace,commitWorkspace} from '../lib/storage.ts';
import {MECHANICS} from '../src/content.ts';
import {PLAYERS} from '../lib/game.ts';
import {freshWorkspace as oldFresh,defaultDraft as oldDraft,suggestAssignments as oldSuggest,encodeSave as oldEncode,createSession as oldSession,advanceSession as oldAdvance,automaticBuys as oldBuys} from '../legacy/v0_4_1/lib/game.ts';
import {startCareer as oldStart,startCircuitCareer as oldCircuit} from '../legacy/v0_4_1/lib/career.ts';
import {sha256} from '../src/hash.ts';
const ids=['J12','J09','J02','J05','J24'];
const base=()=>({...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),org:'Equipe teste',tag:'TST',color:'#123abc',crest:2,selected:ids})});
const oldBase=()=>({...oldFresh(),draft:oldSuggest({...oldDraft(),org:'Antiga',selected:ids})});
test('career reset clears campaign, selected roster, XP, training and buys; retains identity without mutation',()=>{
 let w=trainCareer(startCircuitCareer(base(),'reset',9),{kind:'attribute',attribute:0});w=advanceCareer(w,'event');w=startCareerMatch(w);w.autoBuy=true;w.buyPreparation={[w.session!.profiles.find(p=>p.team==='A')!.id]:'full'};const before=structuredClone(w),reset=restartCareer(w);
 assert.deepEqual(w,before);assert.equal(reset.session,null);assert.equal(reset.career,undefined);assert.deepEqual(reset.draft.selected,[]);assert.deepEqual(reset.draft.assignments,{});assert.equal(reset.autoBuy,false);assert.equal(reset.buyPreparation,undefined);assert.equal(reset.trainingPreparation,undefined);assert.equal(reset.development!.used,false);assert.deepEqual(reset.development!.players,{});assert.equal(reset.draft.org,'Equipe teste');assert.equal(reset.draft.tag,'TST');assert.equal(reset.draft.color,'#123abc');assert.equal(reset.draft.crest,2);
 assert.equal(reset.archives!.length,1);const snapshot=readArchive(reset.archives![0]);assert.equal(snapshot.data.career!.day,4);assert.equal(snapshot.data.session!.id,before.session!.id);assert.deepEqual(snapshot.data.career!.circuit,before.career!.circuit);assert.deepEqual(decodeSave(encodeSave(reset)),reset);
 const restarted=startCircuitCareer({...reset,draft:suggestAssignments({...reset.draft,selected:ids})},'new',19);assert.equal(restarted.career!.day,1);assert.ok(!restarted.career!.circuit!.matches.some(m=>m.result));assert.equal(restarted.career!.circuit!.finance.ledger.filter(e=>e.kind==='initial').length,1);
});
test('organization reset also clears the four identity fields while retaining archives',()=>{
 const w=startCircuitCareer(base(),'reset-org',13),out=restartCareer(w,true),defaults=defaultDraft();for(const field of ['org','tag','color','crest'] as const)assert.equal(out.draft[field],defaults[field]);assert.equal(out.archives!.length,1);assert.equal(restartCareer(out).archives!.length,1);
});
test('concluded history remains usable; original unfinished snapshot is exportable and deduplicated',()=>{
 const w=base();let s=createSession(w.draft,'finished');while(s.state.phase!=='finished')s=advanceSession(s,{id:'r'+s.state.rounds,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:w.draft.plan,B:w.draft.plan}});
 const out=restartCareer({...w,session:s,history:[s],development:{...w.development!,used:true,matchId:s.id}});assert.deepEqual(out.history,[s]);assert.equal(out.archives!.length,1);const a=out.archives![0];assert.equal(addArchive(out,a),out);assert.deepEqual(removeArchive(out,a.id).history,[s]);assert.equal(readArchive(a).data.session!.state.phase,'finished');
});
test('legacy schemas 2, 3, 4 and 5 become read-only with original Véu; configuration maps to Prisma with base XP',()=>{
 for(const schema of [2,3,4,5] as const){const before=oldBase();before.draft.assignments[ids[0]].agent='Véu';let old=schema===5?oldCircuit(before,'old',6):schema===4?oldStart(before,'old',6):before;const e=JSON.parse(oldEncode(old));e.schema=schema;e.digest=sha256(JSON.stringify(e.data));const raw=JSON.stringify(e),out=legacyWorkspace(raw);assert.equal(out.session,null);assert.equal(out.career,undefined);assert.equal(out.draft.org,'Antiga');assert.equal(out.draft.assignments[ids[0]].agent,'Prisma');assert.equal(readArchive(out.archives![0]).data.draft.assignments[ids[0]].agent,'Véu');assert.equal(out.archives![0].text,raw);assert.equal(growthFor(out.development,ids[0]).agentXP.Prisma,0);assert.deepEqual(decodeSave(encodeSave(out)),out);}
});
test('previous engine results and ability names remain unchanged and cannot enter current engine',()=>{
 const w=oldBase();w.draft.assignments[ids[0]].agent='Véu';let s=oldSession(w.draft,'legacy-v01');s=oldAdvance(s,{id:'r0',revision:0,buys:oldBuys(s),plans:{A:w.draft.plan,B:w.draft.plan}});const raw=oldEncode({...w,session:s,development:{...w.development!,used:true,matchId:s.id}}),out=legacyWorkspace(raw),view=readArchive(out.archives![0]);assert.throws(()=>decodeSave(raw),/preservado/i);assert.deepEqual(view.data.session,s);assert.throws(()=>advanceSession(s as any,{id:'bad',revision:1,buys:'eco',plans:{A:w.draft.plan,B:w.draft.plan}}));assert.equal(prepareImport(raw).archiveOnly,true);
});
test('legacy 1.0 imports remain read-only and checksum corruption is rejected',()=>{
 const w=oldBase(),session=oldSession(w.draft,'1.0'),data={draft:w.draft,session};const raw=JSON.stringify({format:'esports-manager-beta',schema:1,beta:'1.0.0',engine:'0.3.0',rules:'gdd-1.3',digest:sha256(JSON.stringify(data)),data});const imported=prepareImport(raw);assert.equal(imported.archiveOnly,true);assert.equal(imported.data.session,null);assert.equal(readArchive(imported.data.archives![0]).data.legacyReport!.session.id,session.id);const corrupt=JSON.parse(raw);corrupt.data.draft.seed++;assert.throws(()=>prepareImport(JSON.stringify(corrupt)),/modificado/);
});
test('mechanics mismatch rejected at envelope and session even with a recomputed payload digest',()=>{
 const w=base();w.session=createSession(w.draft,'version');w.development!.used=true;w.development!.matchId='version';const a=JSON.parse(encodeSave(w));a.mechanics.contentHash='changed';assert.throws(()=>decodeSave(JSON.stringify(a)),/incompatível/);
 const b=JSON.parse(encodeSave(w));b.data.session.mechanics.contentHash='changed';b.digest=sha256(JSON.stringify(b.data));assert.throws(()=>decodeSave(JSON.stringify(b)),/versão|incompatível|mecânica/i);assert.equal(MECHANICS.engine,'0.6.1');assert.equal(PLAYERS.find(p=>p.id==='J11')!.name,'Prisma');assert.equal(PLAYERS.find(p=>p.id==='J11')!.main,'Farol');
});
test('corrupted archives reject digest changes, unknown mode and nested acervos; rescue preserves bytes',()=>{
 const raw=oldEncode(oldBase()),a=archiveFromText(raw);assert.throws(()=>readArchive({...a,text:raw+' '}));assert.throws(()=>readArchive({...a,mode:'invalid'} as any));assert.throws(()=>archiveFromText(encodeSave({...freshWorkspace(),archives:[a]})),/aninhados/);const rescue=rescueArchive('{broken');assert.equal(rescue.text,'{broken');assert.equal(readArchive(rescue).engine,'não validado');assert.deepEqual(decodeSave(encodeSave(addArchive(freshWorkspace(),rescue))).archives,[rescue]);
});
test('atomic persistence refuses stale reset and retains current campaign, then commits a valid reset',async()=>{
 const w=startCircuitCareer(base(),'storage',17),loaded=await loadWorkspace(),rev=loaded?.revision??0;await commitWorkspace(w,rev);const reset=restartCareer(w);await assert.rejects(commitWorkspace(reset,rev),/Outra aba/);assert.equal((await loadWorkspace() as any).data.career.id,'storage');await commitWorkspace(reset,rev+1);assert.deepEqual((await loadWorkspace() as any).data,reset);
});
