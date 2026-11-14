import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TacticalRound} from '../src/simulation.ts';
import {decide} from '../src/ai.ts';
import {Random} from '../src/random.ts';
import {AGENTS} from '../src/abilities.ts';
import {profiles,plans} from './fixtures.ts';
import type {Sector} from '../src/rules.ts';
function setup(pulso=false){const p=profiles();if(pulso){p[0].agent='Pulso';const used=new Set([p[0].agent]);for(let i=1;i<5;i++){p[i].agent=AGENTS.find(a=>!used.has(a))!;used.add(p[i].agent);}}
 const initial=Object.fromEntries(p.map(u=>[u.id,{sector:(u.team==='A'?'attack':u.agent==='Prisma'?'B':'mid') as Sector}]));return new TacticalRound(p,{map:'doca',attacking:'A',seed:11,plans,ai:false,autoFire:false,initial});}
test('one ally neutralizes each observed device; others retain their own tactical action',()=>{
 const r=setup();for(const u of r.alive('A')){u.charges=[false,false,false];u.ult=0;}
 assert.equal(r.issue('B2',{kind:'cast',slot:2,sector:'B',edge:['B','attack']}),true);r.advance(500);
 for(const u of r.alive('A')){const v=r.observeFor(u.id),before=structuredClone(v),d=decide(v,new Random(1));assert.deepEqual(v,before);r.issue(u.id,d);}
 const active=r.alive('A').filter(u=>u.action?.kind==='destroy');assert.equal(active.length,1);assert.equal(r.observeFor(active[0].id).self.neutralizing,r.effects[0].id);assert.ok(r.alive('A').some(u=>!u.action));
});
test('neutralization reservation is released by death or interruption, allowing another ally to act',()=>{
 const r=setup();for(const u of r.alive('A')){u.charges=[false,false,false];u.ult=0;}r.issue('B2',{kind:'cast',slot:2,sector:'B',edge:['B','attack']});r.advance(500);
 const d=decide(r.observeFor('A0'),new Random(1));assert.equal(d.kind,'destroy');r.issue('A0',d);assert.notEqual(decide(r.observeFor('A1'),new Random(1)).kind,'destroy');r.get('A0')!.action=null;assert.equal(decide(r.observeFor('A1'),new Random(1)).kind,'destroy');r.issue('A0',d);r.get('A0')!.vital.life=0;assert.equal(decide(r.observeFor('A1'),new Random(1)).kind,'destroy');
});
test('device reservations match the device ID rather than blocking unrelated neutralizations',()=>{
 const r=setup();for(const u of r.alive('A')){u.charges=[false,false,false];u.ult=0;}r.issue('B2',{kind:'cast',slot:2,sector:'B',edge:['B','attack']});r.advance(500);r.effects.push({...structuredClone(r.effects[0]),id:'second-device'});
 const first=decide(r.observeFor('A0'),new Random(1));r.issue('A0',first);const second=decide(r.observeFor('A1'),new Random(1));assert.deepEqual(second,{kind:'destroy',device:'second-device'});r.issue('A1',second);assert.notEqual(decide(r.observeFor('A2'),new Random(1)).kind,'destroy');
});
test('Pulso does not spend decisions trying to interrupt a movement action',()=>{
 const r=setup(true),u=r.get('A0')!;u.charges=[false,true,false];u.ult=0;r.get('B0')!.sector='attack';r.issue('B0',{kind:'move',to:'A'});const v=r.observeFor('A0');assert.ok(v.visible.some(e=>e.id==='B0'&&e.action==='move'));const d=decide(v,new Random(1));assert.notDeepEqual(d,{kind:'cast',slot:1,target:'B0',sector:'attack'});assert.equal(u.charges[1],true);
});
test('Pulso still interrupts a real channel and consumes exactly one charge',()=>{
 const r=setup(true),u=r.get('A0')!;r.options.attacking='B';u.sector='A';u.charges=[false,true,false];u.ult=0;r.get('B0')!.sector='A';assert.equal(r.issue('B0',{kind:'plant'}),true);const d=decide(r.observeFor('A0'),new Random(1));assert.deepEqual(d,{kind:'cast',slot:1,target:'B0',sector:'A'});assert.equal(r.issue('A0',d),true);r.advance(500);assert.equal(r.get('B0')!.action,null);assert.equal(u.charges[1],false);assert.equal(r.abilityUses.Interferência,1);
});
