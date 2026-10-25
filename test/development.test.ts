import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/hash.ts';
import {newDevelopment,growthFor,previewTraining,xpPerSession,validateDevelopment} from '../lib/development.ts';
import {freshWorkspace,defaultDraft,suggestAssignments,beginMatch,nextMatch,createSession,advanceSession,decodeSave,encodeSave,prepareImport,automaticBuys} from '../lib/game.ts';
import {simulateRound} from '../src/simulation.ts';
import {validateStrategy} from '../src/strategies.ts';
import {profiles,plans} from './fixtures.ts';
import type {Workspace} from '../lib/game.ts';
const ids=['J02','J24','J22','J05','J03'];
const draft=()=>suggestAssignments({...defaultDraft(),selected:ids});
test('one collective session persists XP and prevents a second confirmation after export/reload',()=>{
 const base=newDevelopment(),x=previewTraining(base,ids,{kind:'attribute',attribute:0});assert.equal(base.used,false);
 assert.equal(x.development.used,true);assert.equal(x.gains.length,5);assert.ok(x.gains.every(g=>g.gainedXP>=100&&g.gainedXP<=150));
 const restored=decodeSave(encodeSave({draft:draft(),session:null,development:x.development}));
 assert.throws(()=>previewTraining(restored.development!,ids,{kind:'attribute',attribute:1}),/já foi/);
 const s=beginMatch(restored,'one');assert.equal(s.session!.profiles[0].attrs[0],growthFor(x.development,ids[0]).attrs[0]);
 assert.throws(()=>nextMatch(s),/Conclua/);assert.throws(()=>beginMatch(s,'two'),/Conclua/);
});
test('progression depends on current tier, preserves excess and respects both ceilings',()=>{
 let d=newDevelopment();for(let n=0;n<4;n++){d=previewTraining(d,ids,{kind:'attribute',attribute:0}).development;d.used=false;delete d.receipt;}
 const g=growthFor(d,'J02');assert.equal(g.attrs[0],55);assert.equal(g.attributeXP[0],16);assert.equal(xpPerSession(95),150);
 for(const id of ids){const g=growthFor(d,id);g.attrs=[100,100,100,100,100,100,100,100];d.players[id]=g;}
 assert.throws(()=>validateDevelopment(d),/Potencial/);
 const capped=newDevelopment();for(const id of ids){const g=growthFor(capped,id);g.attrs[0]=100;capped.players[id]=g;}
 assert.throws(()=>previewTraining(capped,ids,{kind:'attribute',attribute:0}),/Todos atingiram/);
});
test('agent XP is personal, faster in low tiers and separate from attributes',()=>{
 const base=newDevelopment(),choice={kind:'agent' as const,agents:Object.fromEntries(ids.map(id=>[id,'Estalo' as const]))};
 const x=previewTraining(base,ids,choice);assert.equal(growthFor(x.development,'J22').familiarities.Estalo,12);
 assert.deepEqual(growthFor(x.development,'J22').attrs,growthFor(base,'J22').attrs);
 assert.equal(growthFor(x.development,'J22').agentXP.Bruma,0);
 assert.throws(()=>previewTraining(base,ids,{kind:'agent',agents:{}}),/cada titular/);
});
test('import rejects malformed training receipts before they can reach the training screen',()=>{
 const trained=previewTraining(newDevelopment(),ids,{kind:'attribute',attribute:0}).development;
 trained.receipt!.choice.attribute=10;
 assert.throws(()=>decodeSave(encodeSave({draft:draft(),session:null,development:trained})),/trained attribute index/);
 trained.receipt!.choice.attribute=0;trained.receipt!.gains[0].id='unknown';
 assert.throws(()=>decodeSave(encodeSave({draft:draft(),session:null,development:trained})),/Foco registrado/);
});
test('finishing a match unlocks a new opportunity without rewriting the historical profiles',()=>{
 const d=draft();let w:Workspace={draft:d,session:null,development:previewTraining(newDevelopment(),ids,{kind:'attribute',attribute:0}).development};w=beginMatch(w,'rounds');
 while(w.session!.state.phase!=='finished'&&w.session!.state.rounds<200){const s=w.session!;w.session=advanceSession(s,{id:'cmd'+s.state.rounds,revision:s.state.rounds,plans,buys:automaticBuys(s)});}
 assert.equal(w.session!.state.phase,'finished');const snapshot=structuredClone(w.session!.profiles);w=nextMatch(w);
 assert.equal(w.development!.used,false);assert.equal(w.development!.completed,1);assert.equal(w.session,null);
 w.development=previewTraining(w.development!,ids,{kind:'attribute',attribute:0}).development;assert.deepEqual(w.previous!.profiles,snapshot);
 assert.deepEqual(decodeSave(encodeSave(w)),w);
});
test('explicit legacy import preserves read-only results, starts XP at zero and rejects corruption',()=>{
 const d=draft(),session=createSession(d,'legacy');const data={draft:d,session};
 const envelope={format:'esports-manager-beta',schema:1,beta:'1.0.0',engine:'0.3.0',rules:'gdd-1.3',digest:sha256(JSON.stringify(data)),data};
 const text=JSON.stringify(envelope);assert.throws(()=>decodeSave(text),/incompatível/);
 const migrated=prepareImport(text);assert.equal(migrated.data.session,null);assert.equal(migrated.data.development!.used,false);assert.deepEqual(migrated.data.legacyReport!.session,session);assert.match(migrated.notice,/não continuará/);
 assert.deepEqual(decodeSave(encodeSave(migrated.data)),migrated.data);
 envelope.data.draft.seed++;assert.throws(()=>prepareImport(JSON.stringify(envelope)),/modificado/);
 assert.equal(freshWorkspace().development!.used,false);
});
test('new plans and valid complements are accepted; contradictory instructions are rejected',()=>{
 assert.doesNotThrow(()=>validateStrategy({attack:'feint',defense:'reading',site:'B',attackInstruction:'trade',defenseInstruction:'cautious'}));
 assert.throws(()=>validateStrategy({...plans.A,attack:'fast',attackInstruction:'preserve'}),/Execução/);
 assert.throws(()=>validateStrategy({...plans.A,defense:'aggressive',defenseInstruction:'resources'}),/Pressão/);
});
test('renaming all player IDs preserves events, decisions and outcomes for the same tactical situation',()=>{
 const ps=profiles(),rename=Object.fromEntries(ps.map((p,i)=>[p.id,`unit-${19-i}`]));
 const renamed=ps.map(p=>({...p,id:rename[p.id]}));
 const settings={map:'patio' as const,attacking:'A' as const,seed:42017,plans};
 const a=simulateRound(ps,settings),b=simulateRound(renamed,settings);
 const map=(v:any):any=>typeof v==='string'?rename[v]??v:Array.isArray(v)?v.map(map):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[rename[k]??k,map(x)])):v;
 assert.deepEqual(b,map(a));
});

import {TacticalRound} from '../src/simulation.ts';
import {decide} from '../src/ai.ts';
import {Random} from '../src/random.ts';
import {reviewRound} from '../lib/insights.ts';
test('Second follows an Entry instead of opening while the Entry remains behind',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});ps[0].role='Entry';ps[1].role='Second';
 const sim=new TacticalRound(ps,{map:'patio',attacking:'A',seed:9,plans:{A:{attack:'fast',defense:'balanced',site:'A'},B:plans.B},ai:false,autoFire:false});
 const view=sim.observeFor('A1');view.visible=[];view.known=[];assert.deepEqual(decide(view,new Random(1)),{kind:'wait'});
 view.allies.find(a=>a.id==='A0')!.sector='A';assert.deepEqual(decide(view,new Random(1)),{kind:'move',to:'A'});
});
test('feint and reading defense change routes and rotation decisions without hidden state',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});
 const sim=new TacticalRound(ps,{map:'patio',attacking:'A',seed:9,plans:{A:{attack:'feint',defense:'reading',site:'A'},B:{attack:'fast',defense:'reading',site:'A'}},ai:false,autoFire:false});
 const a=sim.observeFor('A0');a.visible=[];a.known=[];assert.deepEqual(decide(a,new Random(1)),{kind:'move',to:'B'});a.now=19000;assert.deepEqual(decide(a,new Random(1)),{kind:'move',to:'A'});
 const b=sim.observeFor('B0');b.self.sector='B';b.visible=[];b.known=[{id:'A0',sector:'mid'}];b.now=10000;assert.deepEqual(decide(b,new Random(1)),{kind:'wait'});b.plan.defense='aggressive';assert.deepEqual(decide(b,new Random(1)),{kind:'move',to:'mid'});
});
test('round review reports registered facts, preserves the confirmed plan and identifies the half reset',()=>{
 const d=draft();let s=createSession(d,'review');s=advanceSession(s,{id:'review-0',revision:0,plans,buys:'eco'});
 const r=reviewRound(s,s.records[0]);assert.equal(r.plan,'Controle e leitura');assert.ok(r.timeline.length>0);assert.ok(r.facts.some(f=>f.includes('Gasto confirmado')));assert.equal(r.ending,{'defenders_eliminated':'defesa eliminada','attackers_eliminated':'ataque eliminado','defused':'dispositivo desarmado','detonation':'dispositivo detonado','time_expired':'tempo esgotado','mutual_elimination':'eliminação simultânea'}[s.records[0].result.reason]);
});
test('Entry contests an observed route with support while an unassigned unit holds the same fire',()=>{
 const ps=profiles();ps.forEach(p=>{p.charges=[false,false,false];p.ult=0;});ps[0].role='Entry';
 const sim=new TacticalRound(ps,{map:'patio',attacking:'A',seed:9,plans:{A:{attack:'fast',defense:'balanced',site:'A'},B:plans.B},ai:false,autoFire:false});
 const v=sim.observeFor('A0');v.now=7000;v.visible=[{id:'B0',sector:'A',action:null}];v.known=[];assert.deepEqual(decide(v,new Random(1)),{kind:'move',to:'A'});v.self.role=undefined;assert.deepEqual(decide(v,new Random(1)),{kind:'wait'});
});
