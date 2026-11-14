// Frozen 0.4.1 regression: these mechanics are read-only in the current product.
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startCareer,advancePreview,advanceCareer,trainCareer,skipCareerTraining,startCareerMatch,acceptCareerResult,releaseCareerMatch} from '../legacy/v0_4_1/lib/career.ts';
import {fixtureSchedule,validateCareer} from '../legacy/v0_4_1/lib/career-state.ts';
import {opponentProfiles,OPPONENTS} from '../legacy/v0_4_1/lib/opponents.ts';
import {defaultDraft,suggestAssignments,freshWorkspace,createSession,advanceSession,automaticBuys,encodeSave,decodeSave,beginMatch,nextMatch} from '../legacy/v0_4_1/lib/game.ts';
import type {Workspace} from '../legacy/v0_4_1/lib/game.ts';
import {growthFor,newDevelopment,xpPerSession} from '../legacy/v0_4_1/lib/development.ts';
import {commitWorkspace,loadWorkspace} from '../legacy/v0_4_1/lib/storage.ts';
import {historyJSON,readHistory} from '../legacy/v0_4_1/lib/history.ts';
import {sha256} from '../legacy/v0_4_1/src/hash.ts';
const ids=['J12','J09','J02','J05','J24'];
const base=():Workspace=>({...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected:ids})});
const campaign=()=>startCareer(base(),'daily-test',902111);
function finish(w:Workspace){
 let next=w;
 while(next.session?.state.phase==='buy'){
  const s=next.session,command={id:'r'+s.state.rounds,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:next.draft.plan,B:{attack:'fast' as const,defense:'balanced' as const,site:'A' as const}}};
  next=acceptCareerResult(next,advanceSession(s,command));
 }
 return next;
}
test('approved fixtures have seven dates, four Doca, three Cume and 4/3 player starts',()=>{
 const fs=fixtureSchedule();assert.deepEqual(fs.map(f=>f.day),[4,8,12,16,20,24,28]);assert.equal(fs.filter(f=>f.map==='doca').length,4);assert.equal(fs.filter(f=>f.initialAttack==='A').length,4);assert.equal(new Set(fs.map(f=>f.opponentId)).size,7);
});
test('canonical NPC catalog is fixed, independent and has 35 approved averages and distinct agents',()=>{
 assert.equal(OPPONENTS.length,7);assert.equal(new Set(OPPONENTS.flatMap(t=>t.players.map(p=>p.id))).size,35);
 for(const t of OPPONENTS){const ps=opponentProfiles(t.id);assert.equal(new Set(ps.map(p=>p.agent)).size,5);assert.equal(ps.filter(p=>p.igl).length,1);for(const p of t.players)assert.equal(p.attrs.reduce((a,b)=>a+b,0)/8,p.overall);const other=opponentProfiles(t.id);ps[0].attrs[0]=100;assert.notDeepEqual(ps,other);assert.deepEqual(other,opponentProfiles(t.id));}
 assert.throws(()=>{OPPONENTS[0].players[0].attrs[0]=100;});
});
test('new career starts at day 1 with zero growth, preserves history, cannot import old XP into progression',()=>{
 const old=base();old.development={...newDevelopment(),used:false,players:{[ids[0]]:{...growthFor(undefined,ids[0]),attributeXP:[999,0,0,0,0,0,0,0]}}};
 const next=startCareer(old,'fresh',20);assert.equal(next.career!.day,1);assert.deepEqual(next.development!.players,{});assert.deepEqual(old.development.players[ids[0]].attributeXP,[999,0,0,0,0,0,0,0]);assert.throws(()=>startCareer(next,'again',21));
 const active={...base(),session:createSession(base().draft,'old')};assert.throws(()=>startCareer(active,'bad',22),/Conclua/);
});
test('collective and individual consume one shared daily chance, reload never restores it',()=>{
 const a=trainCareer(campaign(),{kind:'attribute',attribute:0});assert.equal(a.career!.days[0].receipt!.gains.length,5);assert.throws(()=>trainCareer(a,{kind:'attribute',attribute:1}),/encerrada/);
 assert.throws(()=>trainCareer(decodeSave(encodeSave(a)),{mode:'individual',playerId:ids[0],kind:'attribute',attribute:0}),/encerrada/);
 const b=trainCareer(campaign(),{mode:'individual',playerId:ids[0],kind:'attribute',attribute:0});assert.equal(b.career!.days[0].receipt!.gains.length,1);assert.equal(b.career!.days[0].receipt!.gains[0].gainedXP,2*xpPerSession(84));assert.equal(b.development!.players[ids[1]],undefined);
 const c=advanceCareer(b,'day');assert.equal(c.career!.day,2);assert.equal(c.development!.used,false);assert.deepEqual(c.development!.players,b.development!.players);
});
test('skip and jump discard exactly the available days without automatic training',()=>{
 const w=campaign();assert.deepEqual(advancePreview(w,'event'),{target:4,lost:3});const jump=advanceCareer(w,'event');assert.deepEqual(jump.career!.days.map(d=>d.status),['forfeited','forfeited','forfeited']);assert.deepEqual(jump.development!.players,{});assert.equal(jump.development!.used,false);
 const skipped=skipCareerTraining(w);assert.equal(advancePreview(skipped,'event').lost,2);assert.throws(()=>trainCareer(skipped,{kind:'attribute',attribute:0}));
 assert.throws(()=>advanceCareer(jump,'day'),/confronto/);assert.throws(()=>advanceCareer(jump,'event'),/confronto/);
});
test('day-by-day and direct jumps yield identical state and fixed adversaries',()=>{
 let a=campaign(),b=campaign();const before=JSON.stringify(OPPONENTS);
 a=advanceCareer(advanceCareer(advanceCareer(a,'day'),'day'),'day');b=advanceCareer(b,'event');assert.deepEqual(a,b);assert.equal(JSON.stringify(OPPONENTS),before);
});
test('match starts only on due day, closes unused training, respects canonical profiles and cannot duplicate',()=>{
 assert.throws(()=>startCareerMatch(campaign()),/disponível/);const day4=advanceCareer(campaign(),'event'),w=startCareerMatch(day4);
 assert.equal(w.career!.days.at(-1)!.status,'match');assert.deepEqual(w.session!.profiles.filter(p=>p.team==='B'),opponentProfiles('pzr'));assert.equal(w.session!.metadata!.opponentId,'pzr');
 assert.throws(()=>trainCareer(w,{kind:'attribute',attribute:0}),/encerrada/);assert.throws(()=>advanceCareer(w,'day'),/ativa/);assert.throws(()=>startCareerMatch(w));
 assert.throws(()=>beginMatch(w,'extra'),/agenda/);assert.throws(()=>nextMatch(w),/calendário/);
});
test('match checkpoints, history, result idempotency and no same-day training after finish',()=>{
 let w=startCareerMatch(advanceCareer(campaign(),'event'));const s=w.session!,c={id:'first',revision:0,buys:automaticBuys(s),plans:{A:w.draft.plan,B:w.draft.plan}};
 const manual=acceptCareerResult(w,advanceSession(s,c)),loaded=decodeSave(encodeSave(manual));assert.deepEqual(loaded,manual);
 w=finish(loaded);assert.equal(w.career!.fixtures[0].result!.rounds,w.session!.state.rounds);assert.deepEqual(acceptCareerResult(w,w.session!),w);assert.deepEqual(readHistory(historyJSON(w.history!)),w.history);
 const release=releaseCareerMatch(w);assert.equal(release.development!.used,true);assert.throws(()=>trainCareer(release,{kind:'attribute',attribute:0}),/encerrada/);assert.throws(()=>startCareerMatch(release));
 const next=advanceCareer(w,'event');assert.equal(next.career!.day,8);assert.equal(next.draft.map,'cume');assert.equal(next.development!.used,false);assert.equal(next.history!.length,1);assert.equal(next.session,null);
});
test('save validation rejects altered NPCs, fabricated XP, duplicate days, corrupt agenda and schema downgrade',()=>{
 const w=startCareerMatch(advanceCareer(campaign(),'event'));const wrong=structuredClone(w);wrong.session!.profiles.find(p=>p.team==='B')!.attrs[0]++;assert.throws(()=>decodeSave(encodeSave(wrong)),/adversário alterado/);
 const fabricated=campaign();fabricated.development!.players[ids[0]]={...growthFor(undefined,ids[0]),attributeXP:[200,0,0,0,0,0,0,0]};assert.throws(()=>decodeSave(encodeSave(fabricated)),/Evolução fora/);
 const duplicate=trainCareer(campaign(),{kind:'attribute',attribute:0});duplicate.career!.days.push(structuredClone(duplicate.career!.days[0]));assert.throws(()=>decodeSave(encodeSave(duplicate)),/diárias/);
 const schedule=campaign();schedule.career!.fixtures[0].map='cume';assert.throws(()=>decodeSave(encodeSave(schedule)),/Agenda/);
 const orphan=advanceCareer(campaign(),'event');orphan.career!.fixtures[0].sessionId='orphan';assert.throws(()=>decodeSave(encodeSave(orphan)),/checkpoint ativo/);
 const own=structuredClone(w);own.session!.profiles.find(p=>p.team==='A')!.attrs[0]++;assert.throws(()=>decodeSave(encodeSave(own)),/desenvolvimento diário/);
 const bytes=JSON.parse(encodeSave(campaign()));assert.equal(bytes.schema,4);bytes.schema=3;assert.throws(()=>decodeSave(JSON.stringify(bytes)),/incompatível/);
 const bad=campaign();bad.career!.day=29;assert.throws(()=>validateCareer(bad));
});
test('daily confirmations persist once and stale IndexedDB writes preserve confirmed growth',async()=>{
 const w=campaign();const revision=await commitWorkspace(w,0);const trained=trainCareer(w,{kind:'attribute',attribute:1});await commitWorkspace(trained,revision);await assert.rejects(()=>commitWorkspace(w,revision),/Outra aba/);const loaded=await loadWorkspace();assert.ok(loaded&&'data' in loaded);assert.deepEqual(loaded.data,trained);
});
test('all 28 daily sessions and seven matches finish, NPC stats never evolve and day 29 is unavailable',()=>{
 let w=campaign();const signature=sha256(JSON.stringify(OPPONENTS));
 for(let day=1;day<=28;day++){
  assert.equal(w.career!.day,day);w=trainCareer(w,{kind:'attribute',attribute:(day-1)%8});
  if(day%4===0){w=startCareerMatch(w);assert.deepEqual(w.session!.profiles.filter(p=>p.team==='B'),opponentProfiles(w.session!.metadata!.opponentId!));w=finish(w);}
  w=decodeSave(encodeSave(w));assert.equal(sha256(JSON.stringify(OPPONENTS)),signature);if(day<28)w=advanceCareer(w,'day');
 }
 assert.equal(w.career!.days.filter(d=>d.status==='trained').length,28);assert.equal(w.career!.fixtures.filter(f=>f.result).length,7);assert.equal(w.career!.agendaCompleted,true);assert.equal(w.history!.length,7);assert.throws(()=>advanceCareer(w,'day'),/28/);assert.throws(()=>trainCareer(releaseCareerMatch(w),{kind:'attribute',attribute:0}),/encerrada/);
});
