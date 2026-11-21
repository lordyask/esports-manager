import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace,defaultDraft,suggestAssignments,advanceSession,automaticBuys,createSession,encodeSave,decodeSave,normalizedWorkspace} from '../lib/game.ts';
import type {Session,Workspace} from '../lib/game.ts';
import {startCircuitCareer,trainCareer,advanceCareer,startCareerMatch,acceptCareerResult} from '../lib/career.ts';
import {createNpcSession,npcCommand,acceptNpcResult} from '../lib/circuit.ts';
import {pendingNpc} from '../lib/circuit-state.ts';
import {clubPlan} from '../lib/club-policy.ts';
import {historyJSON,readHistory} from '../lib/history.ts';
import {loadWorkspace,commitWorkspace} from '../lib/storage.ts';
import {BETA_2_1_MECHANICS,MECHANICS,PREVIOUS_MECHANICS,mechanicsMatch,tacticalPolicyFor} from '../src/content.ts';
import {sha256} from '../src/hash.ts';
import {attackingTeam} from '../src/map.ts';
import {simulateRound} from '../src/simulation.ts';

function oldSession(s:Session){s.mechanics=structuredClone(PREVIOUS_MECHANICS);return s;}
function step(w:Workspace){
 const s=w.session!;
 const plans={A:w.draft.plan,B:clubPlan(s.metadata!.opponentId!,s.seed,s.state.rounds)};
 return acceptCareerResult(w,advanceSession(s,{id:`r${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans}));
}
function completeOwn(w:Workspace){while(w.session!.state.phase==='buy')w=step(w);return w;}
async function installRawSave(raw:string){
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('esports-manager-beta-1.1',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise<void>((resolve,reject)=>{const t=db.transaction('workspace','readwrite');t.objectStore('workspace').put({revision:1,text:raw},'active');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});db.close();
}

test('both exact 0.6.1 policy revisions are recognized without accepting other mechanics',()=>{
 assert.equal(PREVIOUS_MECHANICS.contentHash,'60821438f979c30d04fe17daf414ddd15ae01e1e74efafc2ef392f407c91a4e9');
 assert.equal(tacticalPolicyFor(PREVIOUS_MECHANICS),'doca-v2-tactical-r4');assert.equal(tacticalPolicyFor(BETA_2_1_MECHANICS),'doca-v2-tactical-r5');
 assert.notEqual(MECHANICS.contentHash,PREVIOUS_MECHANICS.contentHash);
 assert.equal(mechanicsMatch({...PREVIOUS_MECHANICS,contentHash:'different'}),false);
 assert.throws(()=>tacticalPolicyFor({...MECHANICS,contentHash:'different'}),/incompatível/);
});

test('an existing 0.6.1 circuit, history and active match survive loading and keep the old policy',async()=>{
 const draft=suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']});
 let w=startCircuitCareer({...freshWorkspace(),draft},'old-circuit',7331);
 w=trainCareer(w,{kind:'attribute',attribute:0});w=advanceCareer(w,'event');w=startCareerMatch(w);oldSession(w.session!);w=completeOwn(w);
 let match=pendingNpc(w.career!);
 while(match){let npc=oldSession(createNpcSession(match));while(npc.state.phase==='buy')npc=advanceSession(npc,npcCommand(match,npc));w=acceptNpcResult(w,match.id,npc);match=pendingNpc(w.career!);}
 assert.equal(w.history!.length,1);assert.equal(w.career!.circuit!.matches.filter(m=>m.result).length,4);
 assert.ok(w.career!.circuit!.matches.filter(m=>m.result).every(m=>mechanicsMatch(m.result!.mechanics)&&tacticalPolicyFor(m.result!.mechanics)==='doca-v2-tactical-r4'));
 w=advanceCareer(w,'event');w=startCareerMatch(w);oldSession(w.session!);w=step(w);
 const data=normalizedWorkspace(w),raw=JSON.stringify({format:'esports-manager-beta',schema:6,beta:'2.0.0-doca-v2.dev.2',mechanics:PREVIOUS_MECHANICS,engine:PREVIOUS_MECHANICS.engine,rules:PREVIOUS_MECHANICS.rules,digest:sha256(JSON.stringify(data)),data});
 assert.deepEqual(decodeSave(raw),w);await installRawSave(raw);
 const loaded=await loadWorkspace();assert.ok(loaded&&'data' in loaded);assert.deepEqual(loaded.data,w);
 const prior=structuredClone(loaded.data),continued=step(loaded.data),record=continued.session!.records.at(-1)!;
 assert.deepEqual(continued.career,prior.career);assert.deepEqual(continued.history,prior.history);assert.deepEqual(continued.session!.mechanics,PREVIOUS_MECHANICS);
 const roundProfiles=continued.session!.profiles.map(p=>({...p,...record.equipment[p.team].find(e=>e.id===p.id)!}));
 assert.deepEqual(record.result,simulateRound(roundProfiles,{map:continued.session!.map,attacking:attackingTeam(prior.session!.state),seed:record.seed,plans:record.command.plans,tacticalPolicy:'doca-v2-tactical-r4'}));
 const revision=await commitWorkspace(continued,loaded.revision),reloaded=await loadWorkspace();assert.ok(reloaded&&'data' in reloaded);assert.equal(reloaded.revision,revision);assert.deepEqual(reloaded.data,continued);
 const exported=JSON.parse(historyJSON(prior.history!));exported.beta='2.0.0-doca-v2.dev.2';assert.deepEqual(readHistory(JSON.stringify(exported)),prior.history);
 assert.deepEqual(decodeSave(encodeSave(continued)),continued);
 assert.deepEqual(createSession(draft,'new-match').mechanics,MECHANICS);
 const nextNpc=continued.career!.circuit!.matches.find(m=>m.a!=='user'&&!m.result)!;assert.deepEqual(createNpcSession(nextNpc).mechanics,MECHANICS);
});

test('the published Beta 2.1 save replays round two exactly; new user and NPC sessions use r6',()=>{
 // Golden SHA-256 of the complete next session calculated independently by 851a11e.
 assert.equal(BETA_2_1_MECHANICS.contentHash,'c77ea0aa2221851fd120fa4d4fc6d6f3498317140d31d616d938762a90d354de');
 const draft=suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24'],seed:73});
 const original=createSession(draft,'b1-beta21-replay');
 assert.equal(tacticalPolicyFor(original.mechanics),'doca-v2-tactical-r6');
 const career=startCircuitCareer({...freshWorkspace(),draft},'new-circuit-b1',73).career!;
 const npc=createNpcSession(career.circuit!.matches.find(m=>m.a!=='user')!);
 assert.deepEqual(npc.mechanics,original.mechanics);
 original.mechanics=structuredClone(BETA_2_1_MECHANICS);
 const command=(s:Session)=>({id:'round-'+s.state.rounds,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:draft.plan,B:draft.plan}});
 const session=advanceSession(original,command(original));
 const w=freshWorkspace();
 w.draft=draft;
 w.session=session;
 w.development!.used=true;
 w.development!.matchId=session.id;
 const envelope=JSON.parse(encodeSave(w));
 envelope.mechanics=BETA_2_1_MECHANICS;
 const loaded=decodeSave(JSON.stringify(envelope)).session!;
 const next=advanceSession(loaded,command(loaded));
 assert.deepEqual(next.mechanics,BETA_2_1_MECHANICS);
 assert.equal(sha256(JSON.stringify(next)),'8e7f2f08ed365ec33ae18e51d30225ac636a08b506b80f7cf9522a898f6a054e');
});
