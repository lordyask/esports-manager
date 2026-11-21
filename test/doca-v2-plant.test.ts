import assert from 'node:assert/strict';
import {test} from 'node:test';
import {decide} from '../src/ai.ts';
import {docaCanFire} from '../src/doca-v2.ts';
import type {DocaPosition} from '../src/doca-v2.ts';
import {Random} from '../src/random.ts';
import {edgeKey} from '../src/rules.ts';
import type {Sector,Team} from '../src/rules.ts';
import {TacticalRound} from '../src/simulation.ts';
import type {TacticalPolicy} from '../src/tactical-types.ts';
import {plans,profiles} from './fixtures.ts';

interface Setup {
 site?:'A'|'B';
 attacking?:Team;
 seed?:number;
 defenderSector?:Sector;
 policy?:TacticalPolicy;
 automatic?:boolean;
}
function scenario({site='A',attacking='A',seed=17,defenderSector='mid',policy,automatic=false}:Setup={}){
 const defending=attacking==='A'?'B':'A';
 const attacker=attacking+'0',defender=defending+'0';
 const players=profiles().map(p=>({...p,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 const plan={...plans.A,site,attack:'fast' as const};
 const sim=new TacticalRound(players,{
  map:'doca-v2',attacking,seed,plans:{A:plan,B:plan},tacticalPolicy:policy,ai:automatic,autoFire:automatic,
  initial:{[attacker]:{sector:site},[defender]:{sector:defenderSector}},
 });
 return {sim,attacker,defender,link:site==='A'?'link_a' as const:'link_b' as const};
}
function approach(at:number,setup:Setup={}){
 const scene=scenario(setup);
 scene.sim.advance(5000);
 assert.ok(scene.sim.issue(scene.defender,{kind:'move',to:scene.link}));
 scene.sim.advance(at);
 return scene;
}
function choose({sim,attacker}:ReturnType<typeof scenario>){
 const decision=decide(sim.observeFor(attacker),sim.rng.decisions,sim.options.tacticalPolicy);
 assert.ok(sim.issue(attacker,decision));
 return decision.kind;
}
function plantAt(sim:TacticalRound,id:string,at:number){
 return sim.events.some(e=>e.actor===id&&e.at===at&&e.kind==='plant_start');
}

for(const site of ['A','B'] as const)for(const attacking of ['A','B'] as const)for(const seed of [17,73]){
 test(`plant decision at 7000 ms: site ${site}, attacking ${attacking}, seed ${seed}`,()=>{
  for(const policy of ['doca-v2-tactical-r5','doca-v2-tactical-r6'] as const){
   const scene=approach(7000,{site,attacking,seed,policy});
   const {sim,defender,attacker}=scene,view=sim.observeFor(attacker);
   assert.equal(view.self.ready,true);
   assert.deepEqual(view.visible,[{id:defender,sector:'mid',action:'move'}]);
   assert.ok(docaCanFire(sim.get(attacker)! as DocaPosition,sim.get(defender)! as DocaPosition));
   const old=policy==='doca-v2-tactical-r5';
   assert.equal(choose(scene),old?'plant':'wait');
   assert.equal(plantAt(sim,attacker,7000),old);
  }
 });
}

test('the current policy uses the first exposed millisecond, including mid-traversal',()=>{
 for(const at of [6874,6875]){
  const scene=approach(at);
  assert.equal(scene.sim.observeFor(scene.attacker).visible.length,at===6874?0:1);
  assert.equal(choose(scene),at===6874?'plant':'wait');
  assert.equal(plantAt(scene.sim,scene.attacker,at),at===6874);
 }
});

test('clear site, wall and stationary visible defender',()=>{
 for(const [sector,clear] of [['defense',true],['mid',true],['link_a',false]] as const){
  const scene=scenario({defenderSector:sector});
  scene.sim.advance(7000);
  assert.equal(scene.sim.observeFor(scene.attacker).visible.length,clear?0:1);
  assert.equal(choose(scene),clear?'plant':'wait');
 }
});

test('a recent sighting alone cannot block the plant',()=>{
 const scene=scenario({defenderSector:'link_a'}),{sim,attacker,defender}=scene;
 sim.advance(5000);
 assert.equal(sim.observeFor(attacker).visible[0]?.id,defender);
 assert.ok(sim.issue(defender,{kind:'move',to:'mid'}));
 sim.advance(5750);
 const view=sim.observeFor(attacker);
 assert.deepEqual(view.visible,[]);
 assert.ok(view.known.some(k=>k.id===defender));
 assert.equal(choose(scene),'plant');
});

test('smoke must obscure the approach actually being observed',()=>{
 for(const edge of ['link_a','corridor_a'] as const){
  const scene=approach(7000),{sim,attacker}=scene;
  sim.areas.push({id:'smoke',kind:'smoke',team:'A',owner:'A1',sector:'A',until:10000,
   edges:[edgeKey('A',edge)],value:0,active:true});
  const clear=edge==='link_a';
  assert.equal(sim.observeFor(attacker).visible.length,clear?0:1);
  assert.equal(choose(scene),clear?'plant':'wait');
 }
});

test('an optical filter uses the individual observer’s side',()=>{
 for(const team of ['A','B'] as const){
  const scene=approach(7000),{sim,attacker,defender}=scene;
  sim.effects.push({id:'filter',kind:'optical_filter',ability:'Filtro',team,owner:team+'1',
   sector:'link_a',edges:[['A','link_a']],activeAt:6000,until:10000,active:true,value:0});
  assert.equal(sim.observeFor(attacker).visible.some(e=>e.id===defender),team==='A');
  assert.equal(sim.observeFor(defender).visible.some(e=>e.id===attacker),team==='B');
  assert.equal(choose(scene),team==='A'?'wait':'plant');
 }
});

test('a direct plant under pressure and a plant already channeling can finish',()=>{
 for(const start of [6874,7000]){
  const scene=approach(start),{sim,attacker}=scene;
  if(start===6874)assert.equal(choose(scene),'plant');
  else assert.ok(sim.issue(attacker,{kind:'plant'}));
  sim.advance(7000);
  assert.equal(sim.observeFor(attacker).visible.length,1);
  assert.equal(decide(sim.observeFor(attacker),sim.rng.decisions).kind,'wait');
  sim.advance(start+4000);
  assert.ok(sim.events.some(e=>e.actor===attacker&&e.kind==='planted'&&e.at===start+4000));
 }
});

test('urgent defuse still takes priority in sight of an opponent',()=>{
 const scene=scenario({defenderSector:'A'}),{sim,defender}=scene;
 sim.advance(7000);
 sim.planted={sector:'A',deadline:sim.now+9000};
 const view=sim.observeFor(defender);
 assert.equal(view.visible.length,1);
 assert.deepEqual(decide(view,new Random(17)),{kind:'defuse'});
});

test('scheduled AI at first contact keeps its weapon active instead of channeling',()=>{
 for(const policy of ['doca-v2-tactical-r5','doca-v2-tactical-r6'] as const){
  const {sim,attacker,defender}=scenario({automatic:true,policy});
  // Align the planter's first decision with the engine's 250 ms observation tick.
  sim.get(attacker)!.nextDecision=7000;
  sim.advance(7000);
  assert.ok(sim.events.some(e=>e.kind==='first_contact'&&e.actor===attacker&&e.target===defender&&e.at===7000));
  assert.equal(plantAt(sim,attacker,7000),policy==='doca-v2-tactical-r5');
  sim.advance(7500);
  assert.equal(sim.events.some(e=>e.kind==='shot'&&e.actor===attacker&&e.target===defender),policy==='doca-v2-tactical-r6');
 }
});
