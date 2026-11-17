import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AGENTS} from '../src/abilities.ts';
import {decide} from '../src/ai.ts';
import {probability,professionalScore} from '../src/combat.ts';
import {Random} from '../src/random.ts';
import {TacticalRound} from '../src/simulation.ts';
import type {Attributes,Sector} from '../src/rules.ts';
import type {SimulationOptions} from '../src/tactical-types.ts';
import {newDevelopment,growthFor,previewTraining} from '../lib/development.ts';
import {defaultDraft,suggestAssignments,createSession,advanceSession} from '../lib/game.ts';
import {condition,probe} from '../scripts/attribute-probe.ts';
import type {Variant} from '../scripts/attribute-probe.ts';
import {plans,profiles} from './fixtures.ts';

test('trained attributes enter the match profile and round equipment record',()=>{
 const ids=['J02','J24','J22','J05','J03'],initial=newDevelopment();
 const trained=previewTraining(initial,ids,{mode:'individual',playerId:ids[0],kind:'attribute',attribute:0}).development;
 const raw=growthFor(trained,ids[0]).attrs;assert.ok(raw[0]>growthFor(initial,ids[0]).attrs[0]);
 const draft=suggestAssignments({...defaultDraft(),selected:ids},trained),session=createSession(draft,'attribute-entry',trained);
 assert.deepEqual(session.profiles.find(p=>p.id===`A:${ids[0]}`)!.attrs,raw);
 const next=advanceSession(session,{id:'round-0',revision:0,buys:'eco',plans:{A:draft.plan,B:draft.plan}});
 assert.deepEqual(next.records[0].equipment.A.find(p=>p.id===`A:${ids[0]}`)!.attrs,raw);
});

test('each raw attribute reaches the corresponding shot probability without a team bonus',()=>{
 const variants:Variant[]=['aim','movement','positioning','reading','utility','communication','discipline','emotion'];
 const weights=[.45,.15,.25,.15,0,0,0,0],base=[60,60,60,60,60,60,60,60] as Attributes;
 for(let i=0;i<variants.length;i++)for(const boosted of ['A','B'] as const){
  const result=probe(1234567,boosted,'A',variants[i],boosted),strong=result.actors[boosted],other=result.actors[boosted==='A'?'B':'A'];
  assert.equal(strong.raw[i],80);assert.ok(Math.abs(strong.effective-(professionalScore(base,condition)+20*weights[i]*1.076))<1e-9);
  const actual=result.firstShots.find(s=>s.actor===`${boosted}0`)!;
  assert.equal(actual.basisPoints,probability(strong.effective,other.effective));
 }
});

test('familiarity, morale, position and impairment reach the live resolver',()=>{
 const result=probe(7,'A','A','equal',null,{team:'A',positioning:8,impairment:.15});
 assert.equal(result.actors.A.baseWeighted,62);assert.ok(Math.abs(result.actors.A.effective-56.7052)<1e-9);
 assert.equal(result.firstShots.find(s=>s.actor==='A0')!.basisPoints,4607);
 assert.equal(result.firstShots.find(s=>s.actor==='B0')!.basisPoints,5393);
});

test('with the same positions, changing only attack/defense does not change the duel',()=>{
 for(const seed of [7,83])for(const site of ['A','B'] as const)for(const variant of ['equal','aim','utility'] as const){
  const boosted=variant==='equal'?null:'A';
  const a=probe(seed,'A',site,variant,boosted),b=probe(seed,'B',site,variant,boosted),otherSite=probe(seed,'A',site==='A'?'B':'A',variant,boosted);
  assert.deepEqual(a.firstShots,b.firstShots);assert.deepEqual(a.duel,b.duel);
  assert.deepEqual(a.firstShots,otherSite.firstShots);assert.deepEqual(a.duel,otherSite.duel);
  if(variant==='utility'){
   const control=probe(seed,'A',site,'equal',null);assert.deepEqual(a.firstShots,control.firstShots);assert.deepEqual(a.duel,control.duel);
  }
 }
});

function skillDecision(attribute:4|5,value:number,retake=false){
 const ps=profiles().map((p,i)=>({...p,agent:AGENTS[i%5],attrs:[...p.attrs] as Attributes,charges:[true,false,false] as [boolean,boolean,boolean],ult:0}));
 const actor=retake?'B0':'A0';ps.find(p=>p.id===actor)!.attrs[attribute]=value;
 const initial:NonNullable<SimulationOptions['initial']>=Object.fromEntries(ps.map(p=>[p.id,{sector:(p.id.endsWith('0')?'A':p.team==='A'?'attack':'defense') as Sector}]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:5,plans,initial,ai:false,autoFire:false});sim.advance(5000);
 const view=sim.observeFor(actor);if(retake)view.planted={sector:'A',deadline:55000};
 const rng=new Random(1),chances:number[]=[];rng.chance=bp=>{chances.push(bp);return false;};decide(view,rng);
 assert.equal(chances.length,1);return {quality:retake?view.self.tactical.retake:view.self.tactical.entry,chance:chances[0]};
}
test('utility and communication affect selected ability decisions, not weapon score',()=>{
 const low=skillDecision(4,60),utility=skillDecision(4,80),communication=skillDecision(5,80);
 assert.equal(low.chance,6456);assert.equal(utility.chance,7102);assert.equal(communication.chance,6994);
 assert.equal(skillDecision(4,80,true).chance,6994);
 assert.ok(utility.quality>low.quality&&communication.quality>low.quality);
});

test('movement does not affect traversal time; communication and discipline affect decision timing',()=>{
 function arrival(movement:number){
  const ps=profiles().map(p=>({...p,attrs:[...p.attrs] as Attributes,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));ps.find(p=>p.id==='B0')!.attrs[1]=movement;
  const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:13,plans,ai:false,autoFire:false});sim.advance(5000);
  assert.equal(sim.issue('B0',{kind:'move',to:'gallery'}),true);sim.advance(6500);
  return sim.events.find(e=>e.kind==='arrived'&&e.actor==='B0')?.at;
 }
 assert.equal(arrival(1),6500);assert.equal(arrival(100),6500);
 function nextDecision(communication:number,discipline:number){
  const ps=profiles().map(p=>({...p,attrs:[...p.attrs] as Attributes,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
  const defender=ps.find(p=>p.id==='B0')!;defender.attrs[5]=communication;defender.attrs[6]=discipline;
  const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:13,plans,autoFire:false});sim.advance(5000);return sim.get('B0')!.nextDecision;
 }
 assert.equal(nextDecision(60,60),5500);assert.equal(nextDecision(80,60),5460);assert.equal(nextDecision(60,80),5440);
});
