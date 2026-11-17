import {BETA_VERSION} from '../lib/release.ts';
import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapEdges,shortestPath,edgeKey,mobilityTime} from '../src/rules.ts';
import type {Sector} from '../src/rules.ts';
import {rangeFor} from '../src/tactical-types.ts';
import {MAP_CATALOG,isMapId} from '../src/maps.ts';
import {TacticalRound,simulateRound} from '../src/simulation.ts';
import {profiles,plans,scenario} from './fixtures.ts';
import {defaultDraft,suggestAssignments,createSession,advanceSession,automaticBuys,encodeSave,decodeSave} from '../lib/game.ts';
import {newDevelopment} from '../lib/development.ts';
import {commitWorkspace,loadWorkspace} from '../lib/storage.ts';
import {historyJSON,readHistory} from '../lib/history.ts';
import {eventText} from '../lib/insights.ts';

for(const [map,legacy,times] of [['doca','patio',[12,12,8,6,6,7,7,9]],['cume','enlace',[16,16,8,6,6,9,9,8]]] as const){
 test(`${map}: approved graph, shortest routes, disconnections and legacy combat ranges`,()=>{
  const edges=mapEdges(map);assert.equal(edges.length,8);assert.equal(new Set(edges.map(([a,b])=>edgeKey(a,b))).size,8);
  assert.deepEqual(edges.map(e=>e[2]),times.map(t=>t*1000));assert.deepEqual(edges,mapEdges(legacy));
  for(const s of ['attack','defense','A','B','mid'] as Sector[]){assert.equal(rangeFor(map,s),rangeFor(legacy,s));for(const t of ['attack','defense','A','B','mid'] as Sector[]){assert.ok(shortestPath(map,s,t));assert.equal(shortestPath(map,s,t)!.ms,shortestPath(map,t,s)!.ms);}}
  assert.equal(edges.some(([a,b])=>edgeKey(a,b)==='A:B'||edgeKey(a,b)==='attack:defense'),false);
  const block=edges.filter(([a,b])=>a==='A'||b==='A').map(([a,b])=>edgeKey(a,b));assert.equal(shortestPath(map,'attack','A',block),null);
  assert.deepEqual(shortestPath(map,'attack','A'),map==='doca'?{path:['attack','A'],ms:12000}:{path:['attack','mid','A'],ms:14000});
 });
 test(`${map}: all eight edges move in both directions at their approved cost`,()=>{
  for(const [a,b,ms] of mapEdges(map))for(const [from,to] of [[a,b],[b,a]]){
   const f=scenario('Estalo');f.options.map=map;f.options.initial!.A0={sector:from};
   const sim=new TacticalRound(f.ps,f.options);assert.equal(sim.issue('A0',{kind:'move',to}),true);
   sim.advance(ms-1);assert.equal(sim.get('A0')!.sector,from);sim.advance(ms);assert.equal(sim.get('A0')!.sector,to);
  }
 });
 test(`${map}: illegal shortcuts rejected, covers preserve movement and mobility uses edge duration`,()=>{
  const f=scenario('Bastião');f.options.map=map;f.options.initial!.B0={sector:'mid'};const sim=new TacticalRound(f.ps,f.options);
  assert.equal(sim.issue('A0',{kind:'move',to:'B'}),false);
  assert.ok(sim.issue('B0',{kind:'move',to:'A'}));sim.advance(1000);
  assert.ok(sim.issue('A0',{kind:'cast',slot:0,sector:'A',edge:['A','mid']}));sim.advance(1500);
  assert.notEqual(sim.get('B0')!.movement,null);assert.equal(sim.issue('A0',{kind:'move',to:'mid'}),true);
  const g=scenario('Estalo');g.options.map=map;g.options.initial!.A0={sector:'attack'};const dash=new TacticalRound(g.ps,g.options);
  assert.ok(dash.issue('A0',{kind:'cast',slot:1,sector:'A'}));const arrival=500+mobilityTime(mapEdges(map)[0][2],'dash');dash.advance(arrival-1);assert.equal(dash.get('A0')!.sector,'attack');dash.advance(arrival);assert.equal(dash.get('A0')!.sector,'A');
 });
 test(`${map}: plant/defuse timers at both objectives and both attacking sides`,()=>{
  for(const site of ['A','B'] as const)for(const attacking of ['A','B'] as const){
   const ps=profiles(),attacker=ps.find(p=>p.team===attacking)!,defender=ps.find(p=>p.team!==attacking)!;
   const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p===attacker||p===defender?site:p.team===attacking?'attack':'defense'}]));
   const sim=new TacticalRound(ps,{map,seed:17,attacking,plans,initial:initial as any,ai:false,autoFire:false});
   assert.ok(sim.issue(attacker.id,{kind:'plant'}));sim.advance(4000);assert.equal(sim.planted?.sector,site);
   assert.ok(sim.issue(defender.id,{kind:'defuse'}));assert.equal(sim.run().reason,'defused');assert.equal(sim.result!.at,11000);
  }
 });
 test(`${map}: seeded outcomes exactly reuse ${legacy} and ignore profile input order`,()=>{
  const ps=profiles(),opts={map,seed:891,attacking:'B' as const,plans};const a=simulateRound(ps,opts);
  assert.deepEqual(a,simulateRound(ps,opts));assert.deepEqual(a,simulateRound([...ps].reverse(),opts));assert.deepEqual(a,simulateRound(ps,{...opts,map:legacy}));
 });
 test(`${map}: old map cannot start; Doca V2 checkpoints and history round-trip`,async()=>{
  assert.throws(()=>createSession(suggestAssignments({...defaultDraft(),map,selected:['J12','J09','J02','J05','J24']}),map),/Cenário/);
  const d=suggestAssignments({...defaultDraft(),map:'doca-v2',selected:['J12','J09','J02','J05','J24']});let a=createSession(d,map),b=createSession(d,map);
  const development=newDevelopment();development.used=true;development.matchId=map;
  while(a.state.phase!=='finished'){
   const c={id:`r${a.state.rounds}`,revision:a.state.rounds,plans,buys:automaticBuys(a)};
   a=advanceSession(a,c);b=advanceSession(decodeSave(encodeSave({draft:d,session:b,development})).session!,c);assert.deepEqual(a,b);
  }
  assert.deepEqual(readHistory(historyJSON([a])),[a]);
  const w={draft:d,session:a,development,history:[a]},loaded=await loadWorkspace();
  await commitWorkspace(w,loaded?.revision??0);assert.deepEqual((await loadWorkspace() as any).data,w);
 });
}
test('legacy map IDs and exports stay readable, new maps use development label, unknown IDs fail',()=>{
 for(const map of ['patio','horizonte','enlace','doca','cume'] as const){const w={draft:{...defaultDraft(),map},session:null,development:newDevelopment()};assert.throws(()=>decodeSave(encodeSave(w)),/Configuração salva inválida/);}const current={draft:defaultDraft(),session:null,development:newDevelopment()};assert.deepEqual(decodeSave(encodeSave(current)),current);assert.equal(JSON.parse(encodeSave(current)).beta,BETA_VERSION);
 for(const id of ['constructor','__proto__','missing',null]){assert.equal(isMapId(id),false);assert.throws(()=>mapEdges(id as any));}
 assert.ok(MAP_CATALOG.doca.image);assert.ok(eventText({kind:'arrived',at:1,actor:'a',sector:'A'},{a:'Teste'},'cume')?.includes('Observatório'));
});
