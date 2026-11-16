import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attackingTeam,beginRound,completeRound,createMap,isRegulationSideSwitch} from '../src/map.ts';
import type {MapState} from '../src/map.ts';
import {halfReset,quoteBuy} from '../src/economy.ts';
import type {Account} from '../src/economy.ts';
import type {Team} from '../src/rules.ts';
import {PREPARATION_MS} from '../src/rules.ts';
import {TacticalRound,simulateRound} from '../src/simulation.ts';
import type {SimulationOptions} from '../src/tactical-types.ts';
import {attackingTeam as priorAttackingTeam} from '../legacy/v0_6_0/src/map.ts';
import {defaultDraft,suggestAssignments,freshWorkspace,createSession,advanceSession,automaticBuys,encodeSave,decodeSave,nextSide} from '../lib/game.ts';
import type {Session,RoundRecord} from '../lib/game.ts';
import {reviewRound} from '../lib/insights.ts';
import {circuitSchedule} from '../lib/circuit-state.ts';
import {createNpcSession,npcCommand} from '../lib/circuit.ts';

const ids=['J12','J09','J02','J05','J24'];
const account=(id:string):Account=>({id,credits:6000,weapon:'main',shield:50,charges:[true,true,true],ult:7});
const freshMap=(initial:Team)=>createMap(Array.from({length:5},(_,i)=>account(`A${i}`)),Array.from({length:5},(_,i)=>account(`B${i}`)),initial,3);
const expected=(initial:Team,index:number):Team=>Math.floor(index/6)%2===0?initial:initial==='A'?'B':'A';
const boundaryIndexes=new Set([5,6,11,12,17,18]);
const roundResult=(state:MapState,winner:Team)=>({winner,reason:'fixture',at:20000,events:[],actors:(['A','B'] as const).flatMap(team=>state.teams[team].map(a=>({id:a.id,team,sector:'A' as const,vital:{life:team===winner?10000:0,shield:team===winner?a.shield*100:0,temporary:0,reduction:0},charges:a.charges,ult:a.ult,usedUlt:false})))});

test('regulation switches at 6, 12 and 18 for either initial side, independent of score',()=>{
 for(const initial of ['A','B'] as const)for(let index=0;index<24;index++){
  const state=freshMap(initial);state.rounds=index;
  for(const score of [{A:index,B:0},{A:0,B:index}]){state.score=score;assert.equal(attackingTeam(state),expected(initial,index),`initial ${initial}, round ${index+1}`);}
  assert.equal(isRegulationSideSwitch(index),[6,12,18].includes(index));
 }
 assert.equal(isRegulationSideSwitch(24),false);
 for(const initial of ['A','B'] as const)for(const boundary of [6,12,18])for(const winner of ['A','B'] as const){
  const state=freshMap(initial);state.rounds=boundary-1;state.score={A:Math.floor((boundary-1)/2),B:Math.ceil((boundary-1)/2)};
  const ready=beginRound(state,'eco','eco'),next=completeRound(ready.state,roundResult(ready.state,winner));
  assert.equal(next.rounds,boundary);assert.equal(attackingTeam(next),expected(initial,boundary));
 }
});

test('side changes do not reset economy at rounds 7 or 19, but round 13 retains its existing reset',()=>{
 for(const initial of ['A','B'] as const)for(const index of [6,12,18]){
  const state=freshMap(initial);state.rounds=index;state.loss={A:3,B:2};
  for(const team of ['A','B'] as const)state.teams[team]=state.teams[team].map(p=>({...p,credits:4321,weapon:'main',shield:50,charges:[true,true,true],ult:7}));
  const before=structuredClone(state),ready=beginRound(state,'eco','eco');assert.deepEqual(state,before);
  assert.equal(ready.attacking,expected(initial,index));
  for(const team of ['A','B'] as const){
   const source=index===12?before.teams[team].map(halfReset):before.teams[team];
   assert.deepEqual(ready.state.teams[team],quoteBuy(source,'eco',{help:true}).accounts);
   if(index!==12)assert.deepEqual(ready.state.teams[team],before.teams[team]);
   else{assert.equal(ready.state.teams[team][0].weapon,'basic');assert.equal(ready.state.teams[team][0].ult,7);}
  }
  assert.deepEqual(ready.state.loss,index===12?{A:0,B:0}:before.loss);
 }
});

test('overtime retains the previous alternating sides, equipment and pair-based finish',()=>{
 for(const initial of ['A','B'] as const){
  const state=freshMap(initial);state.rounds=24;state.score={A:12,B:12};
  for(let index=24;index<30;index++){
   state.rounds=index;assert.equal(attackingTeam(state),priorAttackingTeam(state));
   const ready=beginRound(state,'eco','eco');assert.equal(ready.attacking,index%2===0?initial:initial==='A'?'B':'A');
   assert.ok([...ready.state.teams.A,...ready.state.teams.B].every(a=>a.weapon==='main'&&a.shield===50&&a.charges.every(Boolean)));
  }
  state.rounds=24;state.score={A:12,B:12};
  for(let index=0;index<2;index++){
   const ready=beginRound(state,'eco','eco');Object.assign(state,completeRound(ready.state,roundResult(ready.state,'A')));assert.equal(state.phase,index===0?'buy':'finished');
  }
  assert.deepEqual(state.score,{A:14,B:12});assert.equal(state.winner,'A');
 }
});

function verifyReplay(session:Session,record:RoundRecord,attacking:Team){
 const ps=session.profiles.map(p=>({...p,...record.equipment[p.team].find(e=>e.id===p.id)!}));
 const options={map:session.map,attacking,seed:record.seed,plans:record.command.plans};
 const initial=new TacticalRound(ps,{...options,ai:false,autoFire:false});
 for(const u of initial.units){assert.equal(u.sector,u.team===attacking?'attack':'defense');assert.deepEqual(initial.observeFor(u.id).plan,record.command.plans[u.team]);assert.equal(initial.observeFor(u.id).attacking,attacking);}
 assert.equal(initial.events.some(e=>e.kind==='first_contact'||e.kind==='shot'),false);initial.advance(PREPARATION_MS);
 assert.ok(initial.events.some(e=>e.kind==='action_start'&&e.at===PREPARATION_MS));
 const planter=ps.find(p=>p.team===attacking)!,defender=ps.find(p=>p.team!==attacking)!;
 const positions=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id===planter.id||p.id===defender.id?'A':p.team===attacking?'attack':'defense'}]));
 const objective=new TacticalRound(ps,{...options,ai:false,autoFire:false,initial:positions as SimulationOptions['initial']});objective.advance(PREPARATION_MS);
 assert.equal(objective.issue(defender.id,{kind:'plant'}),false);assert.equal(objective.issue(planter.id,{kind:'plant'}),true);objective.advance(PREPARATION_MS+4000);
 assert.equal(objective.issue(defender.id,{kind:'defuse'}),true);assert.equal(objective.run().reason,'defused');
 assert.deepEqual(simulateRound(ps,options),record.result);
 for(const e of record.result.events.filter(e=>e.kind==='planted'))assert.equal(session.profiles.find(p=>p.id===e.actor)?.team,attacking);
 for(const e of record.result.events.filter(e=>e.kind==='defused'))assert.notEqual(session.profiles.find(p=>p.id===e.actor)?.team,attacking);
 assert.equal(reviewRound(session,record).attacking,attacking);
}

test('user matches resume across every change with correct side, bases, plans and objectives',()=>{
 const draft=suggestAssignments({...defaultDraft(),seed:7331,selected:ids});
 const plans={A:{...draft.plan,attack:'fast' as const,defense:'reading' as const,site:'A' as const},B:{...draft.plan,attack:'control' as const,defense:'retake' as const,site:'B' as const}};
 for(const initial of ['A','B'] as const){
  let session=createSession(draft,`six-side-${initial}-0`);session.state.initialAttack=initial;
  while(session.state.rounds<19&&session.state.phase==='buy'){
   const index=session.state.rounds,side=expected(initial,index),command={id:`r${index}`,revision:index,buys:automaticBuys(session),plans};
   assert.equal(attackingTeam(session.state),side);assert.equal(nextSide(session),side==='A'?'Ataque':'Defesa');
   if(boundaryIndexes.has(index)){
    const workspace={...freshWorkspace(),draft,session,development:{...freshWorkspace().development!,used:true,matchId:session.id}};
    const restored=decodeSave(encodeSave(workspace)).session!;assert.equal(attackingTeam(restored.state),side);
    const next=advanceSession(session,command);assert.deepEqual(advanceSession(restored,command),next);verifyReplay(next,next.records[index],side);session=next;
   }else session=advanceSession(session,command);
  }
  assert.equal(session.state.rounds,19,`fixture ended before round 19 for initial ${initial}`);
 }
});

test('NPC matches use the same side and club plans at all regulation switches',()=>{
 const fixture=circuitSchedule('six-npc',71).find(m=>m.a!=='user'&&m.b!=='user')!;
 for(const initial of ['A','B'] as const){
  const match={...fixture,initialAttack:initial};let session=createNpcSession(match);
  while(session.state.rounds<19&&session.state.phase==='buy'){
   const index=session.state.rounds,command=npcCommand(match,session),side=expected(initial,index);
   assert.equal(attackingTeam(session.state),side);const next=advanceSession(session,command);
   if(boundaryIndexes.has(index)){assert.deepEqual(next.records[index].command.plans,command.plans);verifyReplay(next,next.records[index],side);}
   session=next;
  }
  assert.equal(session.state.rounds,19,`NPC fixture ended before round 19 for initial ${initial}`);
 }
});
