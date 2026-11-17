import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace,defaultDraft,suggestAssignments,advanceSession,automaticBuys,encodeSave,decodeSave,PLAYERS} from '../lib/game.ts';
import type {Workspace} from '../lib/game.ts';
import {startCircuitCareer,startCareer,advanceCareer,startCareerMatch,acceptCareerResult,trainCareer} from '../lib/career.ts';
import {circuitSchedule,pendingNpc,standings,completedDay,finalDraws,CLUB_IDS} from '../lib/circuit-state.ts';
import type {CircuitMatch,CircuitResult} from '../lib/circuit-state.ts';
import {simulateNpc,acceptNpcResult} from '../lib/circuit.ts';
import {clubPlan} from '../lib/club-policy.ts';
import {cashCents,clubFinance,salaryAccrued,PRIZES} from '../lib/club-finance.ts';
import {OPPONENTS} from '../lib/opponents.ts';
import {deleteHistory} from '../lib/history.ts';
import {commitWorkspace,loadWorkspace} from '../lib/storage.ts';
const ids=['J12','J09','J02','J05','J24'];
const base=()=>({...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected:ids})});
const start=(seed=7331)=>startCircuitCareer(base(),'circuit-test',seed);
function ownGame(w:Workspace){let next=startCareerMatch(w);while(next.session!.state.phase==='buy'){const s=next.session!;next=acceptCareerResult(next,advanceSession(s,{id:'r'+s.state.rounds,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:next.draft.plan,B:clubPlan(s.metadata!.opponentId!,s.seed,s.state.rounds)}}));}return next;}
function closeRound(w:Workspace){let next=w,m=pendingNpc(next.career!);while(m){next=acceptNpcResult(next,m.id,simulateNpc(m));m=pendingNpc(next.career!);}return next;}
function campaign(seed:number,mode:'none'|'collective'|'individual'='none'){
 let w=start(seed);for(let day=1;day<=28;day++){if(mode!=='none')w=trainCareer(w,{kind:'attribute',attribute:0,...(mode==='individual'?{mode:'individual',playerId:ids[0]}:{})});if(day%4===0)w=decodeSave(encodeSave(closeRound(ownGame(w))));if(day<28)w=advanceCareer(w,'day');}return w;
}
test('full approved grid contains every pair once and balanced starts for all eight clubs',()=>{
 const grid=circuitSchedule('grid',7);assert.equal(grid.length,28);assert.equal(new Set(grid.map(m=>[m.a,m.b].sort().join(':'))).size,28);
 for(const id of CLUB_IDS){const games=grid.filter(m=>m.a===id||m.b===id);assert.equal(games.length,7);assert.equal(new Set(games.map(m=>m.day)).size,7);const starts=games.filter(m=>(m.initialAttack==='A'?m.a:m.b)===id).length;assert.ok(starts===3||starts===4);}
 for(const day of [4,8,12,16,20,24,28]){const games=grid.filter(m=>m.day===day);assert.equal(games.length,4);assert.equal(new Set(games.map(m=>m.map)).size,1);}
});
test('finance settles by cumulative cents, preserves approved totals and annual contracts',()=>{
 const roster=PLAYERS.filter(p=>ids.includes(p.id)).map(p=>p.id),f=clubFinance(roster,28,1);
 assert.equal(f.contracts.length,5);assert.ok(f.contracts.every(c=>c.startDay===1&&c.endDayExclusive===366));assert.equal(365-f.closedThrough,337);
 assert.equal(f.ledger.filter(e=>e.kind==='salary').reduce((n,e)=>n-e.cents,0),salaryAccrued(roster,28));
 assert.equal(cashCents(f),3000000-100000-salaryAccrued(roster,28)-280000+800000);assert.equal(new Set(f.ledger.map(e=>e.id)).size,f.ledger.length);assert.equal(PRIZES.reduce((n,p)=>n+p,0),20000);
 const init=start();assert.equal(cashCents(init.career!.circuit!.finance),2900000);assert.deepEqual(decodeSave(encodeSave(init)),init);
 const fractional=clubFinance(['J01','J02','J03','J04','J17'],28);assert.deepEqual(fractional.ledger.filter(e=>e.kind==='salary').map(e=>-e.cents),[277667,277666,277667,277667]);assert.equal(cashCents(fractional),1509333);
});
test('single days and event jumps charge the same crossed paydays with no repeated charges',()=>{
 const initial=closeRound(ownGame(advanceCareer(start(),'event')));let daily=initial;for(let i=4;i<8;i++)daily=advanceCareer(daily,'day');const jumped=advanceCareer(initial,'event');
 assert.deepEqual(daily.career!.circuit!.finance,jumped.career!.circuit!.finance);assert.equal(jumped.career!.day,8);assert.equal(jumped.career!.circuit!.finance.ledger.filter(e=>e.kind==='salary').length,1);
 assert.deepEqual(decodeSave(encodeSave(jumped)).career!.circuit!.finance,jumped.career!.circuit!.finance);
});
test('interrupted round preserves finished NPCs; classification waits for four saved results',()=>{
 let w=ownGame(advanceCareer(start(),'event'));assert.throws(()=>advanceCareer(w,'event'),/processamento/);assert.equal(completedDay(w.career!.circuit!),0);
 const m=pendingNpc(w.career!)!,s=simulateNpc(m);w=acceptNpcResult(w,m.id,s);const old=encodeSave(w);assert.deepEqual(acceptNpcResult(w,m.id,s),w);
 w=decodeSave(old);assert.notEqual(pendingNpc(w.career!)!.id,m.id);w=closeRound(w);assert.equal(completedDay(w.career!.circuit!),4);assert.equal(w.career!.circuit!.matches.filter(m=>m.result).length,4);assert.equal(standings(w.career!.circuit!.matches).reduce((n,r)=>n+r.played,0),8);
});
test('club policies vary inside known repertoires and share the same seed/round inputs',()=>{
 for(const t of OPPONENTS){const plans=Array.from({length:30},(_,n)=>clubPlan(t.id,73,n));assert.ok(new Set(plans.map(p=>p.attack)).size>1);assert.deepEqual(plans[3],clubPlan(t.id,73,3));}
});
function mock(a:string,b:string,x:number,y:number):CircuitMatch{return {id:a+b,day:4,map:'doca-v2',a,b,initialAttack:'A',seed:1,result:{score:{A:x,B:y},rounds:x+y,winner:x===y?null:x>y?'A':'B'} as CircuitResult};}
test('standings applies points, wins, whole-group head-to-head then global round difference',()=>{
 const two=[mock('user','pzr',13,11),mock('frv','user',13,0),mock('pzr','frv',13,0)];const rows=standings(two).filter(r=>['user','pzr','frv'].includes(r.id));assert.ok(rows.every(r=>r.points===3&&r.head===3));assert.equal(rows[0].id,'pzr');
 const head=[mock('user','pzr',13,0),mock('user','frv',0,13),mock('pzr','mra',13,0)];assert.ok(standings(head).findIndex(r=>r.id==='user')<standings(head).findIndex(r=>r.id==='pzr'));
 const draws=standings([mock('user','pzr',15,15)]);assert.equal(draws.find(r=>r.id==='user')!.points,1);assert.equal(draws.find(r=>r.id==='pzr')!.drawn,1);
});
test('exceptional draw is deterministic, saved once and applies only after numeric criteria',()=>{
 const grid=circuitSchedule('draw',55).map(m=>({...m,result:{score:{A:15,B:15},winner:null,rounds:30} as CircuitResult}));const d=finalDraws(grid,55);assert.equal(d.length,1);assert.equal(d[0].teams.length,8);assert.deepEqual(finalDraws(grid,55),d);assert.deepEqual(standings(grid,d).map(r=>r.id),d[0].order);
});
test('complete circuit closes 28 games, expenses and one prize; export/import is idempotent',async()=>{
 const before=JSON.stringify(OPPONENTS),w=campaign(8901,'collective'),c=w.career!,x=c.circuit!,rows=standings(x.matches,x.draws);
 assert.equal(c.day,28);assert.equal(x.matches.filter(m=>m.result).length,28);assert.ok(rows.every(r=>r.played===7));assert.equal(rows.reduce((n,r)=>n+r.difference,0),0);assert.equal(rows.reduce((n,r)=>n+r.wins,0),rows.reduce((n,r)=>n+r.lost,0));assert.equal(rows.reduce((n,r)=>n+r.points,0),x.matches.reduce((n,m)=>n+(m.result!.winner===null?2:3),0));
 assert.ok(x.matches.every(m=>m.map==='doca-v2'&&m.result!.receipts.every(r=>r.equipment.A.length===5&&r.equipment.B.length===5)));
 assert.equal(x.finance.ledger.filter(e=>e.kind==='salary').length,4);assert.equal(x.finance.ledger.filter(e=>e.kind==='operation').length,4);assert.equal(x.finance.ledger.filter(e=>e.kind==='prize').length,1);assert.equal(cashCents(x.finance),3000000-100000-salaryAccrued(ids,28)-280000+PRIZES[rows.findIndex(r=>r.id==='user')]*100);assert.equal(JSON.stringify(OPPONENTS),before);
 assert.equal(w.history!.length,7);const s=encodeSave(w);assert.ok(Buffer.byteLength(s)<64*1024*1024);assert.deepEqual(decodeSave(s),w);const removed=deleteHistory(w,w.history![0].id);assert.deepEqual(removed.career!.circuit,w.career!.circuit);assert.throws(()=>advanceCareer(w,'day'),/dia 28/);
 const prior=await loadWorkspace(),revision=prior?.revision??0;const rev=await commitWorkspace(w,revision);assert.deepEqual((await loadWorkspace() as {data:Workspace}).data,w);await assert.rejects(commitWorkspace(w,revision),/Outra aba/);assert.equal((await loadWorkspace())!.revision,rev);
});
test('campaign with individual training keeps opponents fixed and records complete results',()=>{const w=campaign(993,'individual');assert.equal(w.career!.circuit!.closed,true);assert.equal(w.career!.days.filter(d=>d.status==='trained').length,28);});
test('new circuit saves identify schema 6 and explicit mechanics',()=>{
 const save=JSON.parse(encodeSave(start()));assert.equal(save.schema,6);assert.equal(save.mechanics.engine,'0.6.1');assert.equal(decodeSave(JSON.stringify(save)).career!.version,2);
});
test('a full 20-match common history does not block or erase competitive results',()=>{
 const prior=ownGame(advanceCareer(start(),'event')).session!;const w=startCircuitCareer({...base(),history:Array.from({length:20},(_,i)=>({...structuredClone(prior),id:`previous:${i}`}))},'full-history',21);
 const after=ownGame(advanceCareer(w,'event'));assert.equal(after.history!.length,20);assert.ok(after.career!.circuit!.matches[0].result);assert.deepEqual(decodeSave(encodeSave(after)),after);
});
test('all initial and opponent athletes have approved countries without gameplay bonuses',()=>{assert.equal(PLAYERS.length,24);assert.ok(PLAYERS.every(p=>p.country));assert.equal(OPPONENTS.flatMap(t=>t.players).filter(p=>p.country).length,35);});
test('recomputed checksum cannot hide duplicated entries, changed grade or extra NPC attributes',()=>{
 let w=start();w.career!.circuit!.finance.ledger.push({...w.career!.circuit!.finance.ledger[0]});assert.throws(()=>decodeSave(encodeSave(w)),/Extrato/);
 w=start();w.career!.circuit!.matches[1].a='user';assert.throws(()=>decodeSave(encodeSave(w)),/Grade/);
 w=closeRound(ownGame(advanceCareer(start(),'event')));const altered=structuredClone(w),result=altered.career!.circuit!.matches[1].result!,npc=result.profiles[0];npc.attrs[0]++;
 for(const receipt of result.receipts)receipt.equipment[npc.team].find(p=>p.id===npc.id)!.attrs[0]++;
 assert.throws(()=>decodeSave(encodeSave(altered)),/NPC alterados/);
});
