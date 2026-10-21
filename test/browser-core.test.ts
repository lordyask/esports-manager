import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sha256} from '../src/hash.ts';
import {quoteBuy} from '../src/economy.ts';
import {PLAYERS,defaultDraft,suggestAssignments,createSession,advanceSession,encodeSave,decodeSave,automaticBuys,previewRound,stats} from '../lib/game.ts';
import type {RoundCommand,Session} from '../lib/game.ts';
import {TacticalRound} from '../src/simulation.ts';
import {decide} from '../src/ai.ts';
import {Random} from '../src/random.ts';
import {profiles,plans} from './fixtures.ts';
const draft=()=>suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']});
const command=(s:Session,id=`cmd-${s.state.rounds}`):RoundCommand=>({id,revision:s.state.rounds,buys:automaticBuys(s),plans});
test('portable SHA-256 matches Node for standard, Unicode, padding and multi-block inputs',()=>{
 for(const text of ['', 'abc', 'Bruma, Véu, Ímpeto, Bastião 🔰', 'a'.repeat(55),'a'.repeat(56),'a'.repeat(64),'x'.repeat(30000)])assert.equal(sha256(text),createHash('sha256').update(text).digest('hex'));
});
test('mixed purchases preserve individual caps and reserve own kits before gifts',()=>{
 const accounts=[{id:'one',credits:6000,weapon:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0},{id:'two',credits:3000,weapon:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0},{id:'three',credits:1000,weapon:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}];
 const q=quoteBuy(accounts,{one:'full',two:'semi',three:'eco'},{help:true});
 assert.equal(q.total,9800);assert.equal(q.accounts[0].credits,0);assert.equal(q.accounts[0].shield,50);assert.equal(q.accounts[1].credits,0);assert.ok(q.accounts.every(a=>a.credits>=0));assert.equal(accounts[0].credits,6000);
 assert.throws(()=>quoteBuy(accounts,{one:'full'}));
});
test('uniform per-player purchase plans equal the established team contract',()=>{
 const accounts=Array.from({length:5},(_,i)=>({id:'p'+i,credits:8000,weapon:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 for(const p of ['eco','semi','full'] as const)assert.deepEqual(quoteBuy(accounts,p,{help:true}),quoteBuy(accounts,Object.fromEntries(accounts.map(a=>[a.id,p])),{help:true}));
});
test('draft enforces five contracts, salary cap and unique match agents',()=>{
 const d=draft();assert.equal(d.selected.reduce((s,id)=>s+PLAYERS.find(p=>p.id===id)!.salary,0),11900);const s=createSession(d,'one');assert.equal(s.profiles.length,10);assert.equal(s.profiles.filter(p=>p.team==='A'&&p.igl).length,1);
 assert.throws(()=>createSession({...d,selected:d.selected.slice(1)},'bad'));
 const high=suggestAssignments({...d,selected:['J15','J16','J17','J18','J23']});assert.throws(()=>createSession(high,'bad'));
 d.assignments[d.selected[0]].agent=d.assignments[d.selected[1]].agent;assert.throws(()=>createSession(d,'bad'));
});
test('round checkpoints resume exactly and duplicate commands never consume another round',()=>{
 const d=draft();let a=createSession(d,'resume');for(let i=0;i<4;i++)a=advanceSession(a,command(a));
 const bytes=encodeSave({draft:d,session:a}),b=decodeSave(bytes).session!;
 const c=command(a);assert.deepEqual(advanceSession(a,c),advanceSession(b,c));
 const next=advanceSession(a,c);assert.deepEqual(advanceSession(next,c),next);
 assert.throws(()=>advanceSession(next,{...c,buys:'full'}));assert.throws(()=>advanceSession(next,{...c,id:'different'}));
});
test('save detects incompatible versions and damaged content',()=>{
 const d=draft(),session=createSession(d,'import'),raw=encodeSave({draft:d,session});
 const version=JSON.parse(raw);version.engine='0.2.0';assert.throws(()=>decodeSave(JSON.stringify(version)),/incompatível/);
 const corrupt=JSON.parse(raw);corrupt.data.session.state.score.A=10;assert.throws(()=>decodeSave(JSON.stringify(corrupt)),/modificado/);
 assert.throws(()=>decodeSave('{broken'),/JSON válido/);
});
test('manual credits and the second-half reset preview match committed round purchases',()=>{
 const d=draft();let s=createSession(d,'economy');
 for(let i=0;i<12&&s.state.phase!=='finished';i++)s=advanceSession(s,command(s));
 assert.equal(s.state.rounds,12);assert.equal(automaticBuys(s),'eco');const before=structuredClone(s);
 const q=previewRound(s,'eco');assert.ok(q.state.teams.A.every(a=>a.credits===200));assert.deepEqual(s,before);
 const c={...command(s),buys:'eco' as const},after=advanceSession(s,c);assert.deepEqual(after.records.at(-1)!.purchases,q.purchases);
});
test('individual step and accelerated loops produce identical full matches and statistics',()=>{
 const d=draft();let a=createSession(d,'playback'),b=createSession(d,'playback');
 while(a.state.phase!=='finished'&&a.state.rounds<200)a=advanceSession(a,command(a));
 for(let i=0;i<a.state.rounds;i++){b=decodeSave(encodeSave({draft:d,session:b})).session!;b=advanceSession(b,command(b));}
 assert.equal(a.state.phase,'finished');assert.deepEqual(a,b);
 const rows=stats(a);assert.equal(rows.reduce((n,p)=>n+p.kills,0),rows.reduce((n,p)=>n+p.deaths,0));assert.ok(rows.some(p=>p.utility>0));
});
test('attack executes a clear route despite contact on another route, but holds threatened crossings',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});
 const sim=new TacticalRound(ps,{map:'enlace',attacking:'A',seed:9,plans:{A:{attack:'fast',defense:'balanced',site:'A'},B:plans.B},ai:false,autoFire:false});
 const view=sim.observeFor('A0');view.visible=[{id:'B0',sector:'B',action:null}];view.known=[];
 assert.deepEqual(decide(view,new Random(1)),{kind:'move',to:'A'});
 view.visible=[{id:'B0',sector:'A',action:null}];assert.deepEqual(decide(view,new Random(1)),{kind:'wait'});
});
test('control staging waits in mid instead of issuing an invalid plant',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});const sim=new TacticalRound(ps,{map:'patio',attacking:'A',seed:1,ai:false,autoFire:false,plans});
 const view=sim.observeFor('A0');view.self.sector='mid';view.now=9000;view.visible=[];view.known=[];
 assert.deepEqual(decide(view,new Random(1)),{kind:'wait'});
});
test('the manager designated IGL makes the control call without a duplicated attribute bonus',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});
 ps.filter(p=>p.team==='A').forEach(p=>{p.attrs=[60,60,60,100,60,100,100,100];p.igl=p.id==='A4';});ps.find(p=>p.id==='A4')!.attrs=[60,60,60,100,60,1,1,1];
 const sim=new TacticalRound(ps,{map:'patio',attacking:'A',seed:19,plans,autoFire:false,initial:{B4:{sector:'A'}}});sim.units.filter(u=>u.team==='B').forEach(u=>u.readyAt=200000);sim.advance(10000);
 assert.equal(sim.events.find(e=>e.kind==='igl_call')?.actor,'A4');
});
test('a structurally inconsistent imported history is rejected even with a recalculated checksum',()=>{
 const d=draft();let s=createSession(d,'damaged-history');s=advanceSession(s,command(s));
 s.records[0].result.actors=[];
 assert.throws(()=>decodeSave(encodeSave({draft:d,session:s})),/Histórico salvo inválido/);
});
