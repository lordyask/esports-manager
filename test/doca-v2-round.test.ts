import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TacticalRound} from '../src/simulation.ts';
import {PREPARATION_MS,ROUND_MS,shortestPath} from '../src/rules.ts';
import {docaDistance,docaRange} from '../src/doca-v2.ts';
import {profiles,plans} from './fixtures.ts';

test('both teams start in their bases and preparation allows only internal movement',()=>{
 const sim=new TacticalRound(profiles(),{map:'doca-v2',attacking:'A',seed:13,plans,ai:false});
 assert.ok(sim.units.filter(u=>u.team==='A').every(u=>u.sector==='attack'));
 assert.ok(sim.units.filter(u=>u.team==='B').every(u=>u.sector==='defense'));
 const before=[...sim.get('A0')!.charges];
 assert.equal(sim.issue('A0',{kind:'cast',slot:2,sector:'attack'}),false);
 assert.equal(sim.issue('A0',{kind:'plant'}),false);
 assert.equal(sim.issue('A0',{kind:'move',to:'reception'}),false);
 assert.equal(sim.issue('A0',{kind:'move',to:'attack_west'}),true);
 sim.advance(PREPARATION_MS-1);
 assert.equal(sim.get('A0')!.sector,'attack_west');assert.deepEqual(sim.get('A0')!.charges,before);
 assert.equal(sim.issue('A0',{kind:'move',to:'reception'}),false);
 assert.equal(sim.events.some(e=>['shot','cast_start','cast_complete','first_contact','planted'].includes(e.kind)),false);
 sim.advance(PREPARATION_MS);assert.equal(sim.issue('A0',{kind:'move',to:'reception'}),true);
 assert.ok(sim.events.some(e=>e.kind==='action_start'&&e.at===PREPARATION_MS));
});
test('preparation does not consume the action clock',()=>{
 const sim=new TacticalRound(profiles(),{map:'doca-v2',attacking:'A',seed:17,plans,ai:false,autoFire:false});
 const result=sim.run();assert.equal(result.reason,'time_expired');assert.equal(result.at,PREPARATION_MS+ROUND_MS);
});
test('cover blocks observation, shots and a projectile cast while exposed entrance permits contact',()=>{
 const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A0'?'A':p.id==='B0'?'cover_a':p.team==='A'?'attack':'defense'}]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:19,plans,ai:false,initial});
 sim.advance(PREPARATION_MS);assert.equal(sim.observeFor('A0').visible.some(x=>x.id==='B0'),false);
 assert.equal(sim.issue('A0',{kind:'cast',slot:2,sector:'cover_a'}),false);
 sim.advance(PREPARATION_MS+2000);assert.equal(sim.events.some(e=>e.kind==='shot'),false);
 sim.get('B0')!.sector='corridor_a';assert.equal(sim.observeFor('A0').visible.some(x=>x.id==='B0'),true);
});
test('range uses both positions symmetrically and geometry follows the approved entrances',()=>{
 const x={sector:'A' as const},y={sector:'corridor_a' as const};assert.equal(docaDistance(x,y),docaDistance(y,x));assert.equal(docaRange(x,y),docaRange(y,x));
 assert.deepEqual(shortestPath('doca-v2','gallery_a','gallery_b')?.path,['gallery_a','gallery','gallery_b']);
 assert.ok(!shortestPath('doca-v2','attack','A')!.path.includes('triage'));
 assert.ok(!shortestPath('doca-v2','attack','B')!.path.includes('triage'));
});
test('smoke blocks sight across a valid entrance without allowing fire through it',()=>{
 const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A4'?'A':p.id==='B0'?'corridor_a':p.team==='A'?'attack':'defense'}]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:23,plans,ai:false,autoFire:false,initial});sim.advance(PREPARATION_MS);
 assert.ok(sim.observeFor('A4').visible.some(x=>x.id==='B0'));
 assert.equal(sim.issue('A4',{kind:'cast',slot:0,sector:'A',edge:['A','corridor_a']}),true);sim.advance(PREPARATION_MS+500);
 assert.equal(sim.observeFor('A4').visible.some(x=>x.id==='B0'),false);assert.equal(sim.observeFor('B0').visible.some(x=>x.id==='A4'),false);
});
test('five explicit B assignments do not create an automatic defender at A',()=>{
 const ps=profiles().map((p,i)=>({...p,charges:[false,false,false] as [boolean,boolean,boolean],ult:0,role:(['Entry','Second','Support','Lurker','Anchor'] as const)[i%5]}));
 const defend={...plans.B,defense:'reading' as const,defenseAssignments:Object.fromEntries(ps.filter(p=>p.team==='B').map(p=>[p.id,'B' as const]))};
 const attack={...plans.A,attack:'control' as const,site:'B' as const};
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:31,plans:{A:attack,B:defend},autoFire:false});sim.advance(16000);
 assert.equal(sim.events.some(e=>e.kind==='arrived'&&e.actor?.startsWith('B')&&e.sector==='A'),false);
 assert.ok(sim.units.filter(u=>u.team==='B').every(u=>['defense','gallery','gallery_b','B'].includes(u.sector)));
});
