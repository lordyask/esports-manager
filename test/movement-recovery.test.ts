import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AGENTS} from '../src/abilities.ts';
import {decide} from '../src/ai.ts';
import {BETA_2_1_MECHANICS,MECHANICS,PREVIOUS_MECHANICS,PREVIOUS_MOVEMENT_MECHANICS,mechanicsMatch,movementPolicyFor,tacticalPolicyFor} from '../src/content.ts';
import {sha256} from '../src/hash.ts';
import {Random} from '../src/random.ts';
import {edgeKey,PREPARATION_MS} from '../src/rules.ts';
import type {Sector,Team} from '../src/rules.ts';
import {TacticalRound,simulateRound} from '../src/simulation.ts';
import type {SimulationOptions} from '../src/tactical-types.ts';
import {automaticBuys,advanceSession,createSession,decodeSave,defaultDraft,encodeSave,freshWorkspace,suggestAssignments} from '../lib/game.ts';
import {plans,profiles} from './fixtures.ts';

function scenario(attacking:Team,team:Team){
 const ps=profiles().map((p,i)=>({...p,agent:AGENTS[i%5]}));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking,seed:17,plans,ai:false,autoFire:false});
 const id=`${team}0`,first:Sector=team===attacking?'attack_west':'gallery',next:Sector=team===attacking?'reception':'gallery_a',duration=team===attacking?800:1500;
 sim.advance(PREPARATION_MS);assert.equal(sim.issue(id,{kind:'move',to:first}),true);sim.advance(PREPARATION_MS+duration);
 const readyAt=sim.get(id)!.readyAt;assert.equal(readyAt,PREPARATION_MS+duration+1000);
 return {sim,id,next,readyAt};
}
function snapshot(sim:TacticalRound){return structuredClone({now:sim.now,units:sim.units,events:sim.events,areas:sim.areas,effects:sim.effects,processed:sim.processed,rng:{combat:sim.rng.combat.state,decisions:sim.rng.decisions.state,generation:sim.rng.generation.state},result:sim.result,planted:sim.planted});}

test('a move immediately before readiness is rejected without mutations or a queued movement',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const){
  const a=scenario(attacking,team),b=scenario(attacking,team);a.sim.advance(a.readyAt-1);b.sim.advance(b.readyAt-1);
  const view=a.sim.observeFor(a.id);assert.equal(view.self.ready,false);assert.deepEqual(decide(view,new Random(1)),{kind:'wait'});
  assert.equal(a.sim.issue(a.id,{kind:'wait'}),true);const before=snapshot(a.sim);
  assert.equal(a.sim.issue(a.id,{kind:'move',to:a.next}),false);assert.deepEqual(snapshot(a.sim),before);
  a.sim.advance(a.readyAt+5000);b.sim.advance(b.readyAt+5000);assert.deepEqual(snapshot(a.sim),snapshot(b.sim));
 }
});

test('valid movement is accepted at and after readiness for either team and side',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const)for(const offset of [0,1]){
  const {sim,id,next,readyAt}=scenario(attacking,team);sim.advance(readyAt+offset);
  assert.equal(sim.observeFor(id).self.ready,true);assert.equal(sim.issue(id,{kind:'move',to:next}),true);
  assert.equal(sim.get(id)!.movement?.to,next);
 }
});

test('invalid destinations and blocked passages remain rejected after recovery',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const){
  const {sim,id,next,readyAt}=scenario(attacking,team);sim.advance(readyAt+1);
  let before=snapshot(sim);assert.equal(sim.issue(id,{kind:'move',to:'B'}),false);assert.deepEqual(snapshot(sim),before);
  const u=sim.get(id)!;sim.areas.push({id:'test-barrier',kind:'barrier',team:team==='A'?'B':'A',owner:team==='A'?'B0':'A0',sector:u.sector,until:sim.now+10000,edges:[edgeKey(u.sector,next)],value:0,active:true});
  before=snapshot(sim);assert.equal(sim.issue(id,{kind:'move',to:next}),false);assert.deepEqual(snapshot(sim),before);
 }
});

test('rejected movement does not cancel another action, and casting is not generically blocked',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const){
  const a=scenario(attacking,team);a.sim.advance(a.readyAt-1);
  const u=a.sim.get(a.id)!,enemy=team==='A'?'B':'A';
  a.sim.areas.push({id:'test-device',kind:'alarm',team:enemy,owner:`${enemy}0`,sector:u.sector,until:a.sim.now+10000,edges:[],value:0,active:true});
  assert.equal(a.sim.issue(a.id,{kind:'destroy',device:'test-device'}),true);
  const before=snapshot(a.sim);assert.equal(a.sim.issue(a.id,{kind:'move',to:a.next}),false);assert.deepEqual(snapshot(a.sim),before);
  const b=scenario(attacking,team);b.sim.advance(b.readyAt-1);
  assert.equal(b.sim.issue(b.id,{kind:'cast',slot:1,sector:b.next}),true);
 }
});

test('a rejected redirect does not cancel movement already started by an ability',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const){
  const {sim,id,next,readyAt}=scenario(attacking,team);sim.advance(readyAt-750);
  assert.equal(sim.issue(id,{kind:'cast',slot:1,sector:next}),true);sim.advance(readyAt-250);
  assert.equal(sim.get(id)!.movement?.to,next);
  const before=snapshot(sim),back=team===attacking?'attack':'defense';
  assert.equal(sim.issue(id,{kind:'move',to:back}),false);assert.deepEqual(snapshot(sim),before);
 }
});

test('valid plant and defuse commands remain available during recovery',()=>{
 for(const attacking of ['A','B'] as const){
  const attacker=`${attacking}0`,defender=`${attacking==='A'?'B':'A'}0`;
  const plant=new TacticalRound(profiles(),{map:'doca-v2',attacking,seed:21,plans,ai:false,autoFire:false,initial:{[attacker]:{sector:'corridor_a'}}});
  plant.advance(PREPARATION_MS);assert.equal(plant.issue(attacker,{kind:'move',to:'A'}),true);plant.advance(8500);
  assert.equal(plant.observeFor(attacker).self.ready,false);assert.equal(plant.issue(attacker,{kind:'plant'}),true);
  const defuse=new TacticalRound(profiles(),{map:'doca-v2',attacking,seed:22,plans,ai:false,autoFire:false,initial:{[attacker]:{sector:'A'},[defender]:{sector:'gallery_a'}}});
  defuse.advance(PREPARATION_MS);assert.equal(defuse.issue(attacker,{kind:'plant'}),true);defuse.advance(6500);
  assert.equal(defuse.issue(defender,{kind:'move',to:'A'}),true);defuse.advance(9000);
  assert.equal(defuse.observeFor(defender).self.ready,false);assert.equal(defuse.issue(defender,{kind:'defuse'}),true);
 }
});

test('preparation still permits internal organization, with the same movement readiness check',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const){
  const id=`${team}0`,first=team===attacking?'attack_west':'defense_west',back=team===attacking?'attack':'defense';
  const sim=new TacticalRound(profiles(),{map:'doca-v2',attacking,seed:19,plans,ai:false,autoFire:false});
  assert.equal(sim.issue(id,{kind:'move',to:first}),true);sim.advance(1799);
  assert.equal(sim.issue(id,{kind:'move',to:back}),false);assert.equal(sim.issue(id,{kind:'wait'}),true);
  sim.advance(1800);assert.equal(sim.issue(id,{kind:'move',to:back}),true);
 }
});

test('scripted movement uses the same check at the readiness boundary',()=>{
 for(const attacking of ['A','B'] as const)for(const team of ['A','B'] as const)for(const offset of [-1,0,1]){
  const id=`${team}0`,first=team===attacking?'attack_west':'gallery',next=team===attacking?'reception':'gallery_a',arrival=PREPARATION_MS+(team===attacking?800:1500),readyAt=arrival+1000;
  const sim=new TacticalRound(profiles(),{map:'doca-v2',attacking,seed:27,plans,ai:false,autoFire:false,script:[{at:readyAt+offset,actor:id,decision:{kind:'move',to:next}}]});
  sim.advance(PREPARATION_MS);assert.equal(sim.issue(id,{kind:'move',to:first}),true);sim.advance(readyAt+Math.max(offset,0));
  assert.equal(sim.events.some(e=>e.kind==='move_start'&&e.actor===id&&e.sector===next),offset>=0);
 }
});

test('prior mechanical revisions retain old scripted behavior and exact replay',()=>{
 assert.equal(PREVIOUS_MECHANICS.contentHash,'60821438f979c30d04fe17daf414ddd15ae01e1e74efafc2ef392f407c91a4e9');
 assert.equal(PREVIOUS_MOVEMENT_MECHANICS.contentHash,'f3372a40a11023243d2937492914a551ad259b528b3e83707a4a7dcded371fb6');
 for(const m of [PREVIOUS_MECHANICS,PREVIOUS_MOVEMENT_MECHANICS]){assert.equal(mechanicsMatch(m),true);assert.equal(movementPolicyFor(m),'legacy-r1');}
 assert.equal(movementPolicyFor(MECHANICS),'require-ready-r2');assert.equal(movementPolicyFor(BETA_2_1_MECHANICS),'require-ready-r2');assert.equal(tacticalPolicyFor(BETA_2_1_MECHANICS),'doca-v2-tactical-r5');assert.notEqual(MECHANICS.contentHash,PREVIOUS_MOVEMENT_MECHANICS.contentHash);
 const ps=profiles().map(p=>({...p,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 const options:SimulationOptions={map:'doca-v2',attacking:'A',seed:4242,plans,ai:false,autoFire:false,script:[{at:5000,actor:'A0',decision:{kind:'move',to:'attack_west'}},{at:5000,actor:'B0',decision:{kind:'move',to:'gallery'}},{at:6000,actor:'A0',decision:{kind:'move',to:'reception'}},{at:6750,actor:'B0',decision:{kind:'move',to:'gallery_a'}}]};
 const old=simulateRound(ps,{...options,movementPolicy:'legacy-r1'}),current=simulateRound(ps,options);
 assert.equal(sha256(JSON.stringify(old)),'94da816f6824d2b19dcac08d8d58d7a6e4527e77432faf30c03c76a82810e982');
 assert.notEqual(sha256(JSON.stringify(current)),sha256(JSON.stringify(old)));
 for(const id of ['A0','B0'])assert.equal(current.events.filter(e=>e.kind==='move_start'&&e.actor===id).length,1);
});

test('automatic rounds keep the same decisions and results under either movement policy',()=>{
 for(const tacticalPolicy of ['doca-v2-tactical-r4','doca-v2-tactical-r5'] as const){
  const options:SimulationOptions={map:'doca-v2',attacking:'A',seed:9182,plans,tacticalPolicy};
  assert.deepEqual(simulateRound(profiles(),options),simulateRound(profiles(),{...options,movementPolicy:'legacy-r1'}));
 }
});

test('a saved r5 match continues with its original movement policy and new matches use the fix',()=>{
 const draft=suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']}),session=createSession(draft,'old-movement');
 session.mechanics=structuredClone(PREVIOUS_MOVEMENT_MECHANICS);
 const workspace={...freshWorkspace(),draft,session,development:{...freshWorkspace().development!,used:true,matchId:session.id}};
 const oldEnvelope=JSON.parse(encodeSave(workspace));oldEnvelope.mechanics=PREVIOUS_MOVEMENT_MECHANICS;oldEnvelope.beta='2.0.0-doca-v2.dev.3';
 const restored=decodeSave(JSON.stringify(oldEnvelope));assert.deepEqual(restored,workspace);
 const command={id:'first',revision:0,buys:automaticBuys(session),plans:{A:draft.plan,B:draft.plan}};
 assert.deepEqual(advanceSession(restored.session!,command),advanceSession(session,command));
 assert.deepEqual(advanceSession(restored.session!,command).mechanics,PREVIOUS_MOVEMENT_MECHANICS);
 assert.deepEqual(createSession(draft,'new-movement').mechanics,MECHANICS);
});
