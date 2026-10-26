import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profiles,plans} from './fixtures.ts';
import {TacticalRound,simulateRound} from '../src/simulation.ts';
import {decide} from '../src/ai.ts';
import {Random} from '../src/random.ts';
import {quoteBuy} from '../src/economy.ts';
import {packageGaps} from '../lib/game.ts';
import {reviewRound} from '../lib/insights.ts';

test('traversing a connection permits fire at half cadence and casting still blocks fire',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[true,false,false];p.ult=0;p.weapon='main';});
 const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A0'?'attack':p.id==='B0'?'A':'defense'}]));
 const sim=new TacticalRound(ps,{map:'enlace',attacking:'A',seed:19,ai:false,plans,initial:initial as any,script:[{at:0,actor:'A0',decision:{kind:'move',to:'A'}}]});
 sim.units.filter(u=>u.id!=='A0').forEach(u=>u.readyAt=200000);
 sim.advance(999);assert.equal(sim.events.filter(e=>e.kind==='shot'&&e.actor==='A0').length,0);
 sim.advance(1000);assert.equal(sim.events.filter(e=>e.kind==='shot'&&e.actor==='A0').length,1);
 sim.advance(2000);assert.deepEqual(sim.events.filter(e=>e.kind==='shot'&&e.actor==='A0').map(e=>e.at),[1000,2000]);assert.ok(sim.get('A0')!.movement);
 ps[0].agent='Farol';ps[2].agent='Estalo';
 const casting=new TacticalRound(ps,{map:'enlace',attacking:'A',seed:19,ai:false,plans,initial:initial as any,script:[{at:0,actor:'A0',decision:{kind:'cast',slot:0,sector:'A'}}]});
 casting.units.filter(u=>u.id!=='A0').forEach(u=>u.readyAt=200000);casting.advance(499);
 assert.ok(casting.events.some(e=>e.kind==='cast_start'&&e.actor==='A0'));assert.ok(!casting.events.some(e=>e.kind==='shot'&&e.actor==='A0'));
});
test('containment, retake and reading hold instead of pursuing spawn; feint never plants its diversion',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});
 const sim=new TacticalRound(ps,{map:'enlace',attacking:'A',seed:19,ai:false,autoFire:false,plans});
 const v=sim.observeFor('B0');v.self.sector='A';v.visible=[];v.known=[{id:'A0',sector:'attack'}];
 for(const defense of ['balanced','retake','reading'] as const){v.plan.defense=defense;assert.deepEqual(decide(v,new Random(1)),{kind:'wait'});}
 v.plan.defense='aggressive';assert.deepEqual(decide(v,new Random(1)),{kind:'move',to:'mid'});
 const a=sim.observeFor('A0');a.plan.attack='feint';a.attackTarget='A';a.self.sector='B';a.now=8000;a.visible=[];a.known=[];
 assert.deepEqual(decide(a,new Random(1)),{kind:'wait'});
});
test('renaming IDs preserves mixed shot, blast and area event ordering across maps and seeds',()=>{
 for(const map of ['patio','horizonte','enlace'] as const)for(const seed of [42017,90371,6]){
  const ps=profiles(),rename=Object.fromEntries(ps.map((p,i)=>[p.id,`unit-${19-i}`]));
  const mapValue=(v:any):any=>typeof v==='string'?rename[v]??v:Array.isArray(v)?v.map(mapValue):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[rename[k]??k,mapValue(x)])):v;
  const o={map,seed,attacking:'A' as const,plans};
  assert.deepEqual(simulateRound(ps.map(p=>({...p,id:rename[p.id]})),o),mapValue(simulateRound(ps,o)));
 }
});
test('all mixed buy instructions conserve credits and the explanation matches the delivered package',()=>{
 let count=0;
 for(const credits of [0,1000,3000,6000,12000])for(let code=0;code<243;code++){
  const accounts=Array.from({length:5},(_,i)=>({id:'p'+i,credits,weapon:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
  let n=code;const buy=Object.fromEntries(accounts.map(a=>{const p=(['eco','semi','full'] as const)[n%3];n=Math.floor(n/3);return[a.id,p];}));
  const q=quoteBuy(accounts,buy,{help:true});assert.equal(q.accounts.reduce((n,a)=>n+a.credits,0)+q.total,credits*5);
  for(const a of q.accounts){assert.ok(a.credits>=0&&a.credits<=12000);assert.equal(packageGaps(a,buy[a.id]).length>0,q.missing.includes(a.id));}
  count++;
 }
 assert.equal(count,1215);
});
test('first contact and a registered trade are included in the chronological review',()=>{
 const result=simulateRound(profiles(),{map:'patio',seed:19,attacking:'A',plans});assert.equal(result.events.filter(e=>e.kind==='first_contact'&&e.team==='A').length,1);
 const events=[{at:1000,kind:'eliminated',actor:'A0',target:'B0'},{at:2000,kind:'eliminated',actor:'B0',target:'A1'}];
 const review=reviewRound({profiles:profiles(),names:{A0:'Um',A1:'Dois',B0:'Três'}} as any,{command:{revision:0,plans},result:{...result,events},purchases:{A:[],B:[]}} as any);
 assert.ok(review.timeline.some(x=>x.event.kind==='trade'&&x.text?.includes('Dois')));
});
