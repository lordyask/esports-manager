import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMap,beginRound,completeRound,attackingTeam} from '../src/map.ts';
import type {MapState} from '../src/map.ts';
import type {Account} from '../src/economy.ts';
import type {RoundResult} from '../src/round.ts';
import type {Team} from '../src/rules.ts';
const team=(prefix:string):Account[]=>Array.from({length:5},(_,i)=>({id:prefix+i,credits:6000,weapon:'main',shield:50,charges:[true,true,true],ult:8}));
function result(s:MapState,winner:Team):RoundResult {
  return {winner,reason:'fixture',at:20000,events:[],actors:(['A','B'] as const).flatMap(t=>s.teams[t].map(a=>({id:a.id,team:t,sector:'A' as const,vital:{life:t===winner?10000:0,shield:t===winner?a.shield*100:0,temporary:0,reduction:0},charges:a.charges,ult:a.ult,usedUlt:false})))};
}
function next(s:MapState,winner:Team){const ready=beginRound(s,'eco','eco').state;return completeRound(ready,result(ready,winner));}
test('maps start with opening economy and reset ultimate points',()=>{
  const s=createMap(team('a'),team('b'));assert.equal(s.teams.A[0].credits,1000);assert.equal(s.teams.A[0].ult,0);
  assert.throws(()=>createMap(team('a').slice(1),team('b')));
});
test('13 regulation wins end map and invalid phases reject repeated settlement',()=>{
  let s=createMap(team('a'),team('b'));for(let i=0;i<13;i++)s=next(s,'A');
  assert.equal(s.winner,'A');assert.equal(s.phase,'finished');assert.throws(()=>beginRound(s,'eco','eco'));
  assert.throws(()=>completeRound(s,result(s,'A')));
});
test('side switch occurs after 12 rounds and preserves ultimate points',()=>{
  let s=createMap(team('a'),team('b'));for(let i=0;i<12;i++)s=next(s,i%2?'A':'B');
  assert.equal(attackingTeam(s),'B');s.teams.A[0].ult=7;
  const ready=beginRound(s,'eco','eco').state;assert.equal(ready.teams.A[0].ult,7);
  // Eco buys from the reset opening budget, not accumulated first-half money.
  assert.ok(ready.teams.A[0].credits<=1000);assert.equal(s.teams.A[0].ult,7);
});
test('overtime evaluates complete side pairs and supplies full equipment',()=>{
  let s=createMap(team('a'),team('b'));for(let i=0;i<24;i++)s=next(s,i%2?'A':'B');
  assert.deepEqual(s.score,{A:12,B:12});assert.equal(s.winner,null);
  const ready=beginRound(s,'eco','eco');assert.equal(ready.attacking,'A');assert.equal(ready.state.teams.A[0].shield,50);
  assert.equal(ready.state.teams.A[0].weapon,'main');assert.deepEqual(ready.state.teams.B[0].charges,[true,true,true]);
  s=completeRound(ready.state,result(ready.state,'A'));assert.equal(s.winner,null);assert.equal(attackingTeam(s),'B');
  s=next(s,'B');assert.equal(s.winner,null);s=next(s,'A');assert.equal(s.winner,null);s=next(s,'A');
  assert.equal(s.winner,'A');assert.deepEqual(s.score,{A:15,B:13});
});
test('the proposed beta format ends level after three side pairs and preserves a two-win finish',()=>{
 let draw=createMap(team('a'),team('b'),'A',3),win=createMap(team('a'),team('b'),'A',3);
 for(let i=0;i<30;i++){draw=next(draw,i%2?'B':'A');win=next(win,i>=28?'A':i%2?'B':'A');}
 assert.equal(draw.phase,'finished');assert.equal(draw.winner,null);assert.deepEqual(draw.score,{A:15,B:15});
 assert.equal(win.phase,'finished');assert.equal(win.winner,'A');assert.deepEqual(win.score,{A:16,B:14});
 assert.throws(()=>beginRound(draw,'eco','eco'));
});
