import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ABILITIES,AGENTS} from '../src/abilities.ts';
import type {Agent,Slot} from '../src/abilities.ts';
import {decide} from '../src/ai.ts';
import {Random} from '../src/random.ts';
import {eventText} from '../lib/insights.ts';
import {TacticalRound} from '../src/simulation.ts';
import {activeEffect,visionBlocked,opticalPenalty,protectHits} from '../src/rework-effects.ts';
import type {ReworkEffect} from '../src/rework-effects.ts';
import {profiles,plans} from './fixtures.ts';
import type {Sector} from '../src/rules.ts';
function setup(agent:Agent='Bastião'){
 const ps=profiles();ps[0].agent=agent;const used=new Set([agent]);for(let i=1;i<5;i++){ps[i].agent=AGENTS.find(a=>!used.has(a))!;used.add(ps[i].agent);}
 const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:(p.team==='A'?'mid':p.id==='B0'?'A':'defense') as Sector}]));
 return new TacticalRound(ps,{map:'doca',attacking:'A',seed:12,ai:false,autoFire:false,plans,initial});
}
const args={sector:'mid' as const,edge:['mid','A'] as [Sector,Sector],edges:[['mid','A'],['mid','B']] as [Sector,Sector][],target:'A1'};
for(const agent of ['Prisma','Bastião'] as const)for(const slot of [0,1,2,3] as Slot[])test(`${agent} slot ${slot}: completion consumes one resource and uses approved timing`,()=>{
 const r=setup(agent),u=r.get('A0')!,s=ABILITIES[agent][slot];assert.equal(r.issue(u.id,{kind:'cast',slot,...args}),true);r.advance(s.cast-1);assert.equal(r.effects.length,0);if(slot<3)assert.equal(u.charges[slot],true);else assert.equal(u.ult,8);r.advance(s.cast);
 assert.equal(r.effects.length,1);const e=r.effects[0];assert.equal(e.kind,s.kind);assert.equal(e.activeAt,s.cast+s.warning);assert.equal(e.until,s.cast+s.warning+s.duration);if(slot===3){assert.equal(u.ult,0);assert.equal(u.usedUlt,true);assert.equal(activeEffect(e,r.now),false);}else assert.equal(u.charges[slot],false);
 assert.equal(r.issue(u.id,{kind:'cast',slot,...args}),false);r.advance(e.activeAt);assert.equal(activeEffect(e,r.now),true);r.advance(e.until);assert.equal(e.active,false);
});
test('Prisma replaces active Véu; all eight agents retain four unique named slots',()=>{assert.equal(AGENTS.length,8);assert.ok(!AGENTS.includes('Véu' as Agent));assert.equal(new Set(Object.values(ABILITIES).flat().map(s=>s.name)).size,32);});
test('explicit local edges required; no duplicate or nonincident core edges and no self link',()=>{
 const r=setup('Prisma');assert.equal(r.issue('A0',{kind:'cast',slot:3,sector:'mid'}),false);assert.equal(r.issue('A0',{kind:'cast',slot:3,sector:'mid',edges:[['mid','A'],['A','mid']]}),false);assert.equal(r.issue('A0',{kind:'cast',slot:0,edge:['A','attack']}),false);
 const b=setup();assert.equal(b.issue('A0',{kind:'cast',slot:1,target:'A0'}),false);assert.equal(b.issue('A0',{kind:'cast',slot:1,target:'B0'}),false);
});
test('opaque wall blocks both observers and transit without blocking movement; filter is directional',()=>{
 for(const slot of [0,2] as const){const r=setup('Prisma');r.issue('A0',{kind:'cast',slot,...args});r.advance(500);const e=r.effects[0];assert.equal(e.sector,slot===2?'A':'mid');assert.equal(r.observeFor('B0').visible.some(v=>v.id==='A0'),false);assert.equal(r.observeFor('A0').visible.some(v=>v.id==='B0'),slot===2);
 assert.equal(r.issue('A1',{kind:'move',to:'A'}),true);assert.equal(r.observeFor('B0').visible.some(v=>v.id==='A1'),false);assert.equal(r.get('A1')!.movement!.remaining,6000);
 }
 const r=setup('Prisma');r.issue('A0',{kind:'cast',slot:2,...args});r.advance(500);const base=r.effects[0];r.effects.push({...base,id:'other-wall',kind:'optical_wall'});assert.equal(visionBlocked(r.effects,500,'A','A:mid'),true);
});
test('optical penalties select max, spare allies, end immediately on movement and apply at arrival',()=>{
 const r=setup('Prisma');r.issue('A0',{kind:'cast',slot:1,sector:'A'});r.advance(500);const enemy=r.get('B0')!,e=r.effects[0];assert.equal(opticalPenalty(r.effects,500,enemy),800);assert.equal(opticalPenalty(r.effects,500,r.get('A0')!),0);r.effects.push({...e,id:'core',kind:'refraction',value:1200});assert.equal(opticalPenalty(r.effects,500,enemy),1200);assert.equal(r.issue('B0',{kind:'move',to:'mid'}),true);assert.equal(opticalPenalty(r.effects,500,enemy),0);r.advance(6500);assert.equal(opticalPenalty(r.effects,6500,enemy),0);
});
test('neutralization is continuous, local and blocks firing; movement cancels and restarts its clock',()=>{
 const r=setup('Prisma');r.issue('A0',{kind:'cast',slot:2,...args});r.advance(500);const e=r.effects[0];assert.equal(r.issue('B1',{kind:'destroy',device:e.id}),false);assert.equal(r.issue('B0',{kind:'destroy',device:e.id}),true);r.advance(1000);assert.equal(e.active,true);assert.equal(r.get('B0')!.action!.kind,'destroy');assert.equal(r.issue('B0',{kind:'move',to:'mid'}),true);r.advance(1500);assert.equal(e.active,true);assert.equal(r.events.some(x=>x.kind==='destroy_cancelled'),true);
});
for(const [agent,duration] of [['Prisma',1500],['Bastião',2000]] as const)test(`${agent}: warned core can be neutralized only after full continuous device action`,()=>{
 const r=setup(agent);r.get('B0')!.sector='mid';r.issue('A0',{kind:'cast',slot:3,...args});r.advance(1000);const e=r.effects[0];assert.equal(r.issue('B0',{kind:'destroy',device:e.id}),true);r.advance(1000+duration-1);assert.equal(e.active,true);r.advance(1000+duration);assert.equal(e.active,false);assert.equal(r.kills.B0,undefined);assert.equal(r.get('B0')!.ult,8);assert.equal(r.events.filter(e=>e.kind==='effect_ended').length,1);
});
test('death before completion preserves charge; deployed cover persists death while link breaks',()=>{
 const cancelled=setup();cancelled.issue('A0',{kind:'cast',slot:0,...args});cancelled.get('A0')!.vital.life=0;cancelled.advance(500);assert.equal(cancelled.get('A0')!.charges[0],true);assert.equal(cancelled.effects.length,0);
 for(const slot of [0,1] as const){const r=setup();r.issue('A0',{kind:'cast',slot,...args});r.advance(500);r.get('A0')!.vital.life=0;r.advance(501);assert.equal(r.effects[0].active,slot===0);}
});
test('link breaks on movement and invalid target completion spends no charge',()=>{
 const r=setup();r.issue('A0',{kind:'cast',slot:1,target:'A1'});r.issue('A1',{kind:'move',to:'A'});r.advance(500);assert.equal(r.effects.length,0);assert.equal(r.get('A0')!.charges[1],true);
 const b=setup();b.issue('A0',{kind:'cast',slot:1,target:'A1'});b.advance(500);b.issue('A1',{kind:'move',to:'A'});assert.equal(b.effects[0].active,false);
});
function effect(id:string,kind:ReworkEffect['kind'],value:number,capacity:number):ReworkEffect{return {id,kind,ability:id,owner:'A0',team:'A',sector:'mid',edges:[['mid','A'],['mid','B']],target:'A1',active:true,activeAt:0,until:6000,value,capacity};}
test('oriented cover protects stationary allies only from its incoming edge and only weapon damage',()=>{
 const r=setup(),u=r.units,e=effect('cover','cover',6000,6000),hit={actor:'B0',target:'A1',raw:1000,kind:'weapon_damage'};
 assert.equal(protectHits([hit],[e],u,1).hits[0].raw,400);assert.equal(protectHits([{...hit,kind:'blast_damage'},{...hit,kind:'zone_damage'}],[e],u,2).hits[0].raw,1000);
 r.get('B0')!.sector='defense';assert.equal(protectHits([hit],[e],u,3).hits[0].raw,1000);r.get('B0')!.sector='A';r.issue('A1',{kind:'move',to:'A'});assert.equal(protectHits([hit],[e],u,4).hits[0].raw,1000);
});
test('route pool is shared both directions, moving allies only, with unchanged travel',()=>{
 const r=setup(),e=effect('route','route_cover',2500,4000);r.get('A2')!.sector='A';r.issue('A1',{kind:'move',to:'A'});r.issue('A2',{kind:'move',to:'mid'});assert.equal(r.get('A2')!.movement!.remaining,6000);
 const hits=['A1','A2','A3'].map(target=>({actor:'B0',target,raw:10000,kind:'weapon_damage'}));const out=protectHits(hits,[e],r.units,1);assert.deepEqual(out.hits.map(h=>h.raw),[8000,8000,10000]);assert.equal(e.capacity,0);
});
test('one strongest nominal layer selected; exhausted layer gives no same-hit fallback',()=>{
 const r=setup(),strong=effect('cover','cover',6000,100),weak=effect('link','interposition',3000,3000),hit={actor:'B0',target:'A1',raw:1000,kind:'weapon_damage'};
 const a=protectHits([hit],[strong,weak],r.units,1);assert.equal(a.hits[0].raw,900);assert.equal(weak.capacity,3000);assert.equal(protectHits([hit],[strong,weak],r.units,2).hits[0].raw,700);assert.equal(protectHits([{...hit,kind:'blast_damage'}],[weak],r.units,3).hits[0].raw,700);assert.equal(protectHits([{...hit,kind:'zone_damage'}],[weak],r.units,4).hits[0].raw,1000);assert.equal(r.get('A0')!.vital.temporary,0);
});
test('shared redoubt pool apportions simultaneous hits deterministically without source order advantage',()=>{
 const r=setup(),hits=['A1','A2','A3'].map(target=>({actor:'B0',target,raw:10001,kind:'weapon_damage'})),a=effect('redoubt','redoubt',5000,10000),b=structuredClone(a);
 const first=protectHits(hits,[a],r.units,1),reverse=protectHits([...hits].reverse(),[b],r.units,1);assert.equal(first.absorbed.reduce((n,h)=>n+h.amount,0),10000);assert.deepEqual(Object.fromEntries(first.hits.map(h=>[h.target,h.raw])),Object.fromEntries(reverse.hits.map(h=>[h.target,h.raw])));assert.equal(a.capacity,0);
});
test('unchanged seeds replay new AI deterministically on both maps and sides',()=>{
 for(const map of ['doca','cume'] as const)for(const attacking of ['A','B'] as const){const ps=profiles(),options={map,attacking,seed:542,plans};const a=new TacticalRound(ps,options).run(),b=new TacticalRound(ps,options).run();assert.deepEqual(a,b);assert.ok(a.events.some(e=>e.kind==='effect_deployed'));assert.ok(a.actors.every(u=>u.vital.temporary===0));}
});

test('resource-preservation instruction also holds new slots until the plant',()=>{
 const r=setup('Prisma'),view=r.observeFor('A0');view.self.charges=[false,true,true];view.plan.defenseInstruction='resources';view.attacking='B';const decision=decide(view,new Random(1));assert.notEqual(decision.kind,'cast');
});
test('new effect telemetry has readable localized summaries including exhausted capacity',()=>{
 for(const kind of ['effect_deployed','effect_activated','effect_ended','ability_warning','optical_penalty','optical_restored','damage_prevented','destroy_start','destroy_cancelled','destroyed','cast_cancelled'])assert.ok(eventText({at:0,kind,actor:'A0',ability:'Anteparo',amount:100,detail:JSON.stringify({reason:'capacity_exhausted'})},{A0:'Jogador'},'doca'));
 assert.match(eventText({at:0,kind:'effect_ended',ability:'Anteparo',detail:JSON.stringify({reason:'capacity_exhausted'})},{})!,/reserva esgotada/);
});
