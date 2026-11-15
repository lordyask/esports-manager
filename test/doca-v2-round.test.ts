import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TacticalRound} from '../src/simulation.ts';
import {PREPARATION_MS,ROUND_MS,shortestPath} from '../src/rules.ts';
import {docaDistance,docaRange} from '../src/doca-v2.ts';
import {profiles,plans} from './fixtures.ts';
import {decide} from '../src/ai.ts';
import {Random} from '../src/random.ts';

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
test('automatic preparation for either attacking side consumes no combat resources',()=>{
 for(const attacking of ['A','B'] as const){
  const sim=new TacticalRound(profiles(),{map:'doca-v2',attacking,seed:16,plans}),before=sim.units.map(u=>({id:u.id,vital:structuredClone(u.vital),charges:[...u.charges],ult:u.ult}));
  sim.advance(PREPARATION_MS-1);
  for(const p of before){const u=sim.get(p.id)!;assert.deepEqual(u.vital,p.vital);assert.deepEqual(u.charges,p.charges);assert.equal(u.ult,p.ult);
   assert.ok((u.team===attacking?['attack','attack_west','attack_east']:['defense','defense_west','defense_east']).includes(u.sector));}
  assert.equal(sim.events.some(e=>['shot','cast_start','cast_complete','effect_deployed','first_contact','planted','defused'].includes(e.kind)),false);
 }
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
 assert.ok(sim.units.filter(u=>u.team==='B').every(u=>['defense','gallery','gallery_b','B','cover_b'].includes(u.sector)));
});
test('a second defender assigned to the same point can occupy its cover',()=>{
 const ps=profiles().map(p=>({...p,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 const assignments=Object.fromEntries(ps.filter(p=>p.team==='B').map(p=>[p.id,'B' as const]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:32,plans:{A:{...plans.A,attack:'control',site:'A'},B:{...plans.B,defenseAssignments:assignments}},autoFire:false});
 sim.advance(18000);assert.ok(sim.events.some(e=>e.kind==='arrived'&&e.actor?.startsWith('B')&&e.sector==='cover_b'));
 assert.equal(sim.events.some(e=>e.kind==='arrived'&&e.actor?.startsWith('B')&&e.sector==='A'),false);
});
test('plant and defuse work after preparation at either point with either attacking team',()=>{
 for(const site of ['A','B'] as const)for(const attacking of ['A','B'] as const){
  const ps=profiles(),attacker=ps.find(p=>p.team===attacking)!,defender=ps.find(p=>p.team!==attacking)!;
  const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p===attacker||p===defender?site:p.team===attacking?'attack':'defense'}]));
  const sim=new TacticalRound(ps,{map:'doca-v2',attacking,seed:41,plans,ai:false,autoFire:false,initial});
  assert.equal(sim.issue(attacker.id,{kind:'plant'}),false);sim.advance(PREPARATION_MS);
  assert.equal(sim.issue(attacker.id,{kind:'plant'}),true);sim.advance(PREPARATION_MS+4000);
  assert.equal(sim.planted?.sector,site);assert.equal(sim.issue(defender.id,{kind:'defuse'}),true);
  assert.equal(sim.run().reason,'defused');assert.equal(sim.result!.at,PREPARATION_MS+11000);
 }
});
test('defenders can retake both sites from the gallery and from the middle links',()=>{
 for(const site of ['A','B'] as const)for(const approach of [site==='A'?'gallery_a':'gallery_b',site==='A'?'link_a':'link_b'] as const){
  const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A0'?site:p.id==='B0'?approach:p.team==='A'?'attack':'defense'}]));
  const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:42,plans,ai:false,autoFire:false,initial});sim.advance(PREPARATION_MS);
  assert.equal(sim.issue('A0',{kind:'plant'}),true);assert.equal(sim.issue('B0',{kind:'move',to:site}),true);
  sim.advance(PREPARATION_MS+4000);assert.equal(sim.get('B0')!.sector,site);assert.equal(sim.issue('B0',{kind:'defuse'}),true);assert.equal(sim.run().reason,'defused');
 }
});
test('mobility can traverse a valid corner but cannot cross a wall as a shortcut',()=>{
 const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A0'?'triage':p.team==='A'?'attack':'defense'}]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:47,plans,ai:false,autoFire:false,initial});sim.advance(PREPARATION_MS);
 assert.equal(sim.issue('A0',{kind:'cast',slot:1,sector:'mid'}),false);
 assert.equal(sim.issue('A0',{kind:'cast',slot:1,sector:'bend_south'}),true);sim.advance(PREPARATION_MS+1500);
 assert.equal(sim.get('A0')!.sector,'bend_south');
});
test('tracking needs a visible target and cannot update its location through a wall',()=>{
 const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A2'?'A':p.id==='B0'?'corridor_a':p.team==='A'?'attack':'defense'}]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:43,plans,ai:false,autoFire:false,initial});sim.advance(PREPARATION_MS);
 assert.equal(sim.issue('A2',{kind:'cast',slot:1,target:'B0'}),true);sim.advance(PREPARATION_MS+500);
 assert.equal(sim.issue('B0',{kind:'move',to:'reception'}),true);sim.advance(PREPARATION_MS+3000);
 assert.equal(sim.get('B0')!.sector,'reception');assert.equal(sim.observeFor('A2').visible.some(e=>e.id==='B0'),false);
 assert.notEqual(sim.observeFor('A2').known.find(e=>e.id==='B0')?.sector,'reception');
});
test('AI does not repeatedly select an impossible scan or track through a wall',()=>{
 const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A2'?'bend_north':p.team==='A'?'attack':'defense'}]));
 const first=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:45,plans,ai:false,autoFire:false,initial});first.advance(PREPARATION_MS);
 assert.notEqual(decide(first.observeFor('A2'),new Random(1)).kind,'cast');
 const secondInitial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A2'?'A':p.id==='B0'?'corridor_a':p.team==='A'?'attack':'defense'}]));
 const second=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:46,plans,ai:false,autoFire:false,initial:secondInitial});second.advance(PREPARATION_MS);
 second.get('B0')!.sector='cover_a';second.advance(PREPARATION_MS+100);
 const view=second.observeFor('A2');assert.ok(view.known.some(e=>e.id==='B0'));assert.equal(view.visible.length,0);
 const action=decide(view,new Random(1));assert.ok(action.kind!=='cast'||action.slot!==1);
});
test('an isolated player seeing two opponents keeps the weapon ready instead of planting or casting',()=>{
 const ps=profiles(),initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A0'?'A':p.id==='B0'||p.id==='B1'?'corridor_a':p.team==='A'?'attack':'defense'}]));
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:48,plans:{A:{...plans.A,site:'A'},B:plans.B},ai:false,autoFire:false,initial});sim.advance(PREPARATION_MS);
 const view=sim.observeFor('A0');assert.equal(view.visible.length,2);assert.deepEqual(decide(view,new Random(1)),{kind:'wait'});
});
test('feint reaches the false route before changing direction',()=>{
 const ps=profiles().map(p=>({...p,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 const attack={...plans.A,attack:'feint' as const,site:'A' as const};
 const defense={...plans.B,defenseAssignments:Object.fromEntries(ps.filter(p=>p.team==='B').map(p=>[p.id,'A' as const]))};
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:51,plans:{A:attack,B:defense},autoFire:false});sim.advance(40000);
 const pressure=sim.events.find(e=>e.kind==='feint_pressure'),shift=sim.events.find(e=>e.kind==='strategy_shift');
 assert.equal(pressure?.sector,'B');assert.equal(shift?.sector,'A');assert.ok(pressure!.at<shift!.at);
 assert.ok(sim.events.some(e=>e.at>shift!.at&&e.kind==='arrived'&&e.actor?.startsWith('A')&&['gallery_b','gallery','link_b','mid','link_a','A'].includes(e.sector??'')));
});
