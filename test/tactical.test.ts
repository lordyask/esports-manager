import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ABILITIES,AGENTS} from '../src/abilities.ts';
import type {Slot} from '../src/abilities.ts';
import {TacticalRound,simulateRound} from '../src/simulation.ts';
import {simulateMap} from '../src/autonomous.ts';
import {profiles,scenario,plans} from './fixtures.ts';

test('all 32 abilities resolve and consume exactly their own resource',()=>{
  let count=0;
  for(const agent of AGENTS)for(const slot of [0,1,2,3] as Slot[]){
    const fixture=scenario(agent),kind=ABILITIES[agent][slot].kind;
    fixture.options.initial!.B0={sector:kind==='interrupt'?'A':'mid'};
    const sim=new TacticalRound(fixture.ps,fixture.options);
    if(kind==='interrupt')assert.equal(sim.issue('B0',{kind:'cast',slot:2}),true);
    const target=['track','interrupt'].includes(kind)?'B0':kind==='guard'||kind==='teleport'?'A1':undefined;
    const sector=kind==='guard'?'A':kind==='teleport'?'attack':['speed','position','safe','alarm','trap','fortress','sweep'].includes(kind)?'A':'mid';
    const cast={kind:'cast' as const,slot,sector:sector as 'A'|'mid'|'attack',target,edge:['A','mid'] as ['A','mid']};
    if(kind==='guard')sim.get('A1')!.sector='A';
    assert.equal(sim.issue('A0',cast),true,`${agent} ${slot} must validate`);
    sim.advance(3500);
    const u=sim.get('A0')!;
    assert.equal(sim.abilityUses[ABILITIES[agent][slot].name],1,`${agent} ${slot} resolves once`);
    if(slot===3){assert.equal(u.ult,0);assert.equal(u.usedUlt,true);}else assert.equal(u.charges[slot],false);
    count++;
  }
  assert.equal(count,32);
});
test('fumaça blocks both teams and reveal never permits fire through it',()=>{
  const f=scenario('Bruma');f.options.initial!.B0={sector:'mid'};const sim=new TacticalRound(f.ps,f.options);
  assert.ok(sim.observeFor('A0').visible.some(e=>e.id==='B0'));
  sim.issue('A0',{kind:'cast',slot:0,sector:'A',edge:['A','mid']});sim.advance(500);
  assert.equal(sim.observeFor('A0').visible.some(e=>e.id==='B0'),false);
  assert.equal(sim.observeFor('B0').visible.some(e=>e.id==='A0'),false);
  assert.ok(sim.observeFor('A0').known.some(e=>e.id==='B0'));
});
test('hidden enemy changes do not change an identical AI observation',()=>{
  const f=scenario('Bruma');f.options.initial!.A0={sector:'attack'};
  const a=new TacticalRound(f.ps,f.options),b=new TacticalRound(f.ps,f.options);
  for(const sim of [a,b]){sim.issue('A0',{kind:'cast',slot:0,sector:'attack',edge:['attack','B']});sim.advance(500);}
  b.get('B0')!.sector='B'; // Hidden behind smoke; the other instance remains in defense.
  assert.deepEqual(a.observeFor('A0'),b.observeFor('A0'));
  const view=JSON.stringify(a.observeFor('A0'));
  assert.equal(view.includes('shotToken'),false);assert.equal(view.includes('attrs'),false);assert.equal(view.includes('rng'),false);
});
test('blast warns first, checks presence again and never harms allies',()=>{
  const f=scenario('Estalo');f.options.initial!.B0={sector:'mid'};f.options.initial!.A1={sector:'mid'};
  const sim=new TacticalRound(f.ps,f.options);sim.issue('A0',{kind:'cast',slot:2,sector:'mid'});sim.advance(500);
  assert.ok(sim.events.some(e=>e.kind==='blast_warning'));assert.equal(sim.get('B0')!.vital.shield,5000);
  sim.advance(1500);assert.equal(sim.get('B0')!.vital.shield,1500);assert.equal(sim.get('A1')!.vital.shield,5000);
  const g=scenario('Estalo');g.options.initial!.B0={sector:'mid'};const escaped=new TacticalRound(g.ps,g.options);
  escaped.issue('A0',{kind:'cast',slot:2,sector:'mid'});escaped.advance(500);escaped.get('B0')!.sector='defense';escaped.advance(1500);
  assert.equal(escaped.get('B0')!.vital.shield,5000);
});
test('zone delivers exactly five ticks and persists after caster death',()=>{
  const f=scenario('Bruma');f.options.initial!.B0={sector:'mid'};const sim=new TacticalRound(f.ps,f.options);
  sim.issue('A0',{kind:'cast',slot:2,sector:'mid'});sim.advance(500);sim.get('A0')!.vital.life=0;sim.advance(5500);
  assert.equal(sim.events.filter(e=>e.kind==='zone_damage'&&e.target==='B0').length,5);
  assert.equal(sim.get('B0')!.vital.shield,0);assert.equal(sim.get('B0')!.vital.life,10000);
});
test('alarm and trap survive beyond 10 seconds and creator elimination',()=>{
  const f=scenario('Trava');const sim=new TacticalRound(f.ps,f.options);
  sim.issue('A0',{kind:'cast',slot:0});sim.advance(500);sim.issue('A0',{kind:'cast',slot:1});sim.advance(1000);
  sim.get('A0')!.vital.life=0;sim.advance(15000);
  const alarm=sim.areas.find(a=>a.kind==='alarm')!,trap=sim.areas.find(a=>a.kind==='trap')!;
  assert.equal(alarm.active,true);assert.equal(trap.active,true);
  sim.get('B0')!.sector='mid';sim.issue('B0',{kind:'move',to:'A'});sim.advance(21000);
  assert.equal(alarm.active,false);assert.equal(trap.active,false);assert.ok(sim.get('B0')!.buffs.some(b=>b.kind==='slow'));
});
test('known devices require uninterrupted destruction time',()=>{
  const f=scenario('Trava');const sim=new TacticalRound(f.ps,f.options);
  sim.issue('A0',{kind:'cast',slot:0});sim.advance(500);sim.get('B0')!.sector='A';
  const device=sim.observeFor('B0').devices[0];assert.ok(device);
  assert.equal(sim.issue('B0',{kind:'destroy',device:device.id}),true);sim.advance(1499);
  assert.equal(sim.areas.find(a=>a.id===device.id)!.active,true);sim.advance(1500);assert.equal(sim.areas.find(a=>a.id===device.id)!.active,false);
});
test('shield abilities cannot stack over 25 and expire without restoring paid shield',()=>{
  const f=scenario('Bastião');f.options.initial!.A1={sector:'A'};const sim=new TacticalRound(f.ps,f.options);
  sim.issue('A0',{kind:'cast',slot:1,target:'A1'});sim.advance(500);sim.issue('A0',{kind:'cast',slot:3});sim.advance(1500);
  assert.equal(sim.get('A1')!.vital.temporary,2500);assert.equal(sim.get('A1')!.vital.shield,5000);
  sim.advance(7500);assert.equal(sim.get('A1')!.vital.temporary,0);assert.equal(sim.get('A1')!.vital.shield,5000);
});
test('speed expiration recomputes remaining travel rather than restarting edge',()=>{
  const f=scenario('Ímpeto');f.options.map='horizonte';f.options.initial!.A0={sector:'attack'};
  const sim=new TacticalRound(f.ps,f.options);sim.issue('A0',{kind:'cast',slot:0});sim.advance(500);sim.issue('A0',{kind:'move',to:'A'});
  sim.advance(6500);assert.ok(sim.get('A0')!.movement);sim.advance(15928);
  assert.equal(sim.get('A0')!.sector,'attack');sim.advance(15929);assert.equal(sim.get('A0')!.sector,'A');
});
test('barrier blocks movement, smoke allows it, and step signals arrival',()=>{
  const f=scenario('Bastião');const sim=new TacticalRound(f.ps,f.options);
  sim.issue('A0',{kind:'cast',slot:0,sector:'A',edge:['A','mid']});sim.advance(500);
  assert.equal(sim.issue('A0',{kind:'move',to:'mid'}),false);
  const g=scenario('Véu');const moving=new TacticalRound(g.ps,g.options);
  moving.issue('A0',{kind:'cast',slot:2,sector:'mid'});moving.advance(3500);
  assert.equal(moving.get('A0')!.sector,'mid');assert.ok(moving.events.some(e=>e.kind==='arrival_signal'));
});
test('tracking cannot be extended indefinitely by ordinary visual contact',()=>{
  const f=scenario('Farol');for(const p of f.ps)if(p.team==='A')f.options.initial![p.id]={sector:'A'};
  f.options.initial!.B0={sector:'mid'};
  const sim=new TacticalRound(f.ps,f.options);sim.issue('A0',{kind:'cast',slot:1,target:'B0'});sim.advance(4000);
  const controller=sim.units.find(u=>u.team==='A'&&u.agent==='Bruma')!;
  assert.equal(sim.issue(controller.id,{kind:'cast',slot:0,sector:'A',edge:['A','mid']}),true);sim.advance(4500);
  sim.get('B0')!.sector='B';sim.advance(4600);
  assert.equal(sim.observeFor('A0').known.find(e=>e.id==='B0')?.sector,'mid');
});
test('a barrier appearing during a crossing invalidates the old arrival',()=>{
  const f=scenario('Bastião');f.options.initial!.B0={sector:'mid'};
  const sim=new TacticalRound(f.ps,f.options);sim.issue('B0',{kind:'move',to:'A'});sim.advance(1000);
  sim.issue('A0',{kind:'cast',slot:0,sector:'A',edge:['A','mid']});sim.advance(1500);
  assert.equal(sim.get('B0')!.movement,null);sim.advance(6000);assert.equal(sim.get('B0')!.sector,'mid');
});
test('integrated objective timers accept exact plant and defuse deadlines',()=>{
  const f=scenario('Estalo'),plant=new TacticalRound(f.ps,f.options);
  plant.advance(96000);assert.equal(plant.issue('A0',{kind:'plant'}),true);
  assert.equal(plant.run().at,140000);assert.equal(plant.result!.reason,'detonation');
  const g=scenario('Estalo');g.options.initial!.B0={sector:'A'};const defuse=new TacticalRound(g.ps,g.options);
  defuse.issue('A0',{kind:'plant'});defuse.advance(37000);defuse.issue('B0',{kind:'defuse'});
  assert.equal(defuse.run().reason,'defused');assert.equal(defuse.result!.at,44000);
});
test('integrated explosive damage precedes a plant finishing at the same instant',()=>{
  const f=scenario('Estalo');f.ps[0].shield=0;f.ps[5].agent='Estalo';
  f.options.initial!.A0={sector:'A',life:1000};f.options.initial!.B0={sector:'mid'};
  const sim=new TacticalRound(f.ps,f.options);sim.advance(1000);sim.issue('A0',{kind:'plant'});
  sim.advance(3500);sim.issue('B0',{kind:'cast',slot:2,sector:'A'});sim.advance(5000);
  assert.equal(sim.get('A0')!.vital.life,0);assert.equal(sim.planted,null);assert.equal(sim.events.some(e=>e.kind==='planted'),false);
});
test('autonomous 5v5 round is reproducible and independent of input array order',()=>{
  const ps=profiles(),opts={map:'enlace' as const,attacking:'A' as const,seed:88,plans};
  const a=simulateRound(ps,opts),b=simulateRound([...ps].reverse(),opts);
  assert.deepEqual(a,b);assert.ok(a.at<=140000);assert.equal(a.actors.length,10);assert.ok(a.events.some(e=>e.kind==='shot'));
});
test('autonomous map reaches 13 regulation wins or complete overtime pair',()=>{
  const game=simulateMap(profiles(),{map:'patio',seed:20,plans});
  assert.equal(game.state.phase,'finished');assert.ok(game.summary.rounds>=13);assert.ok(game.summary.events>0);
  assert.ok(game.state.score[game.state.winner!]>=13);assert.ok(Object.keys(game.summary.abilityUses).length>0);
  assert.deepEqual(game.purchases[12],{A:'eco',B:'eco'});
});
test('teleport cannot follow an ally into a destination different from the confirmed sector',()=>{
  const f=scenario('Véu');f.options.initial!.A1={sector:'mid'};const sim=new TacticalRound(f.ps,f.options);
  assert.equal(sim.issue('A0',{kind:'cast',slot:3,target:'A1',sector:'mid'}),true);sim.advance(1000);
  sim.get('A1')!.sector='B';sim.advance(3000);assert.equal(sim.get('A0')!.sector,'A');assert.equal(sim.get('A0')!.ult,0);
});
test('retake regression seed reaches an objective result without the former overtime stall',()=>{
  const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Estalo','Farol','Bruma','Trava','Bastião'] as const)[i%5];if(p.agent==='Trava')p.weapon='precision';});
  const plan={attack:'fast' as const,defense:'retake' as const,site:'A' as const};
  const game=simulateMap(ps,{map:'patio',seed:20261020,initialAttack:'A',plans:{A:plan,B:plan}});
  assert.equal(game.state.phase,'finished');assert.ok(game.summary.rounds<200);assert.ok(game.summary.plants>0);
});
test('speed changes during a delayed crossing never schedule fractional milliseconds',()=>{
  const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Ímpeto','Farol','Véu','Trava','Bastião'] as const)[i%5];if(p.agent==='Trava')p.weapon='precision';});
  const plan={attack:'control' as const,defense:'aggressive' as const,site:'A' as const};
  const game=simulateMap(ps,{map:'patio',seed:20261019,plans:{A:plan,B:plan}});
  assert.equal(game.state.phase,'finished');for(const round of game.rounds)for(const e of round.events)assert.ok(Number.isInteger(e.at));
});
test('a rotation cannot be shot from an unrelated connection merely because origin sectors are adjacent',()=>{
  const f=scenario('Estalo');f.options.initial!.B0={sector:'defense'};
  const sim=new TacticalRound(f.ps,f.options);assert.ok(sim.observeFor('A0').visible.some(e=>e.id==='B0'));
  sim.issue('B0',{kind:'move',to:'mid'});
  assert.equal(sim.observeFor('A0').visible.some(e=>e.id==='B0'),false);
});
test('starting a legal escape leaves the blast sector without making movement generally invulnerable',()=>{
  const f=scenario('Estalo');f.options.initial!.B0={sector:'mid'};
  const sim=new TacticalRound(f.ps,f.options);sim.issue('A0',{kind:'cast',slot:2,sector:'mid'});sim.advance(500);
  sim.issue('B0',{kind:'move',to:'defense'});sim.advance(1500);assert.equal(sim.get('B0')!.vital.shield,5000);
  // The same traversal is observable by an enemy standing at its endpoint.
  sim.get('A1')!.sector='defense';assert.ok(sim.observeFor('A1').visible.some(e=>e.id==='B0'));
});
test('retake defense uses site anchors and a central reserve instead of five players in spawn',()=>{
  const ps=profiles(),plan={attack:'fast' as const,defense:'retake' as const,site:'A' as const};
  const sim=new TacticalRound(ps,{map:'horizonte',attacking:'A',seed:1,ai:false,autoFire:false,plans:{A:plan,B:plan}});
  const defense=sim.units.filter(u=>u.team==='B');assert.equal(defense.filter(u=>u.sector==='mid').length,3);assert.equal(defense.filter(u=>u.sector==='defense').length,0);
});
test('Horizonte retake regression seed completes without reaching the safety limit',()=>{
  const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Estalo','Farol','Bruma','Trava','Bastião'] as const)[i%5];if(p.agent==='Trava')p.weapon='precision';});
  const plan={attack:'fast' as const,defense:'retake' as const,site:'A' as const};
  const game=simulateMap(ps,{map:'horizonte',seed:20261021,initialAttack:'B',plans:{A:plan,B:plan}});
  assert.equal(game.state.phase,'finished');assert.ok(game.summary.rounds<200);
});
