import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AGENTS} from '../src/abilities.ts';
import {docaSight} from '../src/doca-v2.ts';
import {decideDocaV2} from '../src/doca-v2-ai.ts';
import {sha256} from '../src/hash.ts';
import {TacticalRound,simulateRound} from '../src/simulation.ts';
import type {Profile,SimulationOptions,TeamPlan} from '../src/tactical-types.ts';
import type {Team} from '../src/rules.ts';
import {profiles} from './fixtures.ts';

function scenario(attacking:Team,site:'A'|'B',policy:'doca-v2-tactical-r4'|'doca-v2-tactical-r5'){
 const ps:Profile[]=profiles().map((p,i)=>({...p,agent:AGENTS[i%5],weapon:'main',shield:50,charges:[false,false,false],ult:0}));
 const defending=attacking==='A'?'B':'A',defenders=ps.filter(p=>p.team===defending);
 const defenseAssignments=Object.fromEntries(defenders.map((p,i)=>[p.id,(['A','B','A','B','mid'] as const)[i]]));
 const attackPlan:TeamPlan={attack:'control',defense:'balanced',site},defensePlan:TeamPlan={attack:'fast',defense:'balanced',site:'A',defenseAssignments};
 const plans=attacking==='A'?{A:attackPlan,B:defensePlan}:{A:defensePlan,B:attackPlan};
 const options:SimulationOptions={map:'doca-v2',attacking,seed:7,plans,tacticalPolicy:policy};
 return {ps,defenders,defenseAssignments,options};
}

test('cover cannot observe the main, middle or gallery entrance of its site',()=>{
 for(const site of ['A','B'] as const){
  const cover=site==='A'?'cover_a':'cover_b',entries=site==='A'?['corridor_a','link_a','gallery_a'] as const:['corridor_b','link_b','gallery_b'] as const;
  for(const entry of entries){assert.equal(docaSight({sector:cover},{sector:entry}).visible,false);assert.equal(docaSight({sector:site},{sector:entry}).visible,true);}
 }
});

test('both assigned defenders hold each site before contact, for either team and target',()=>{
 for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const){
  for(const policy of ['doca-v2-tactical-r4','doca-v2-tactical-r5'] as const){
   const {ps,defenders,defenseAssignments,options}=scenario(attacking,site,policy);
   const sim=new TacticalRound(ps,{...options,autoFire:false});sim.advance(17000);
   assert.equal(sim.events.some(e=>e.kind==='first_contact'),false);
   for(const position of ['A','B'] as const){
    const assigned=defenders.filter(p=>defenseAssignments[p.id]===position);
    assert.equal(assigned.length,2);
    for(const p of assigned){
     const view=sim.observeFor(p.id);assert.deepEqual(view.known,[]);assert.deepEqual(view.visible,[]);
     assert.ok(sim.events.some(e=>e.kind==='arrived'&&e.actor===p.id&&e.sector===position&&e.at===13500));
    }
    const sectors=assigned.map(p=>sim.get(p.id)!.sector).sort();
    assert.deepEqual(sectors,policy==='doca-v2-tactical-r4'?[position,`cover_${position.toLowerCase()}`]:[position,position]);
   }
  }
 }
});

test('after planting, the defender route decision is identical under both policies',()=>{
 for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const){
  const {ps,defenders,options}=scenario(attacking,site,'doca-v2-tactical-r5');
  const sim=new TacticalRound(ps,{...options,ai:false,autoFire:false});
  const view=sim.observeFor(defenders[0].id);view.self.sector='gallery';view.planted={sector:site,deadline:60000};view.now=25000;
  const before=decideDocaV2(view,'doca-v2-tactical-r4'),after=decideDocaV2(view,'doca-v2-tactical-r5');
  assert.deepEqual(after,before);assert.equal(after.kind,'move');
 }
});

test('the preceding policy replays a complete previously captured round exactly',()=>{
 const {ps,options}=scenario('A','A','doca-v2-tactical-r4');
 const result=simulateRound(ps,options);
 assert.equal(sha256(JSON.stringify(result)),'76ebc53397c4c38e4c0e12afca8087996bc793e05d6a7fadb2640e4a8a8a235d');
 assert.deepEqual(simulateRound([...ps].reverse(),options),result);
});
