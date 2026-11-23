import assert from 'node:assert/strict';
import {test} from 'node:test';
import {opponentStrategies,previousClubMatches} from '../lib/opponent-preview.ts';
import type {CircuitMatch,CircuitRound} from '../lib/circuit-state.ts';
import type {AttackPlan,DefensePlan} from '../src/tactical-types.ts';

const opposingPlan={attack:'feint',defense:'reading',site:'B'} as const;
function round(team:'A'|'B',attack:AttackPlan,defense:DefensePlan){
 const plans={A:opposingPlan,B:opposingPlan,[team]:{attack,defense,site:'A'}};
 return {plans} as CircuitRound;
}
function match(a:string,b:string,initialAttack:'A'|'B',day:number,receipts?:CircuitRound[]){
 return {id:a+'-'+b,day,a,b,initialAttack,...(receipts?{result:{receipts}}:{})} as CircuitMatch;
}

test('reads each active side once, switching before rounds 7, 13 and 19',()=>{
 // Club B starts on attack. Give the inactive side misleading tactics in every receipt.
 const attack=(s:AttackPlan)=>round('B',s,'reading');
 const defense=(s:DefensePlan)=>round('B','feint',s);
 const receipts=[
  ...['fast','control','control','fast','split','feint'].map(s=>attack(s as AttackPlan)),
  ...['balanced','aggressive','retake','balanced','retake','balanced'].map(s=>defense(s as DefensePlan)),
  ...['fast','split','control','fast','feint','fast'].map(s=>attack(s as AttackPlan)),
  defense('balanced'),defense('aggressive'),
 ];
 const played=[match('crn','frv','B',4,receipts)];
 assert.deepEqual(opponentStrategies(played,'frv','attack'),{total:12,ranked:[
  {id:'fast',name:'Execução rápida',count:5},{id:'control',name:'Controle e leitura',count:3},{id:'split',name:'Pressão dividida',count:2},
 ]});
 assert.deepEqual(opponentStrategies(played,'frv','defense'),{total:8,ranked:[
  {id:'balanced',name:'Contenção',count:4},{id:'aggressive',name:'Pressão avançada',count:2},{id:'retake',name:'Retomada',count:2},
 ]});
});

test('combines NPC and coach receipts and excludes scheduled, future and unrelated matches',()=>{
 const games=[
  match('user','frv','A',4,[round('B','feint','reading')]),
  match('frv','mra','A',8,[round('A','split','retake')]),
  match('blt','frv','A',8),match('frv','vrt','A',12,[round('A','control','balanced')]),
  match('pzr','crn','B',4,[round('A','control','balanced')]),
 ];
 const played=previousClubMatches(games,'frv',8);
 assert.deepEqual(played,games.slice(0,2));
 assert.deepEqual(opponentStrategies(played,'frv','attack'),{total:1,ranked:[{id:'split',name:'Pressão dividida',count:1}]});
 assert.deepEqual(opponentStrategies(played,'frv','defense'),{total:1,ranked:[{id:'reading',name:'Leitura e resposta',count:1}]});
 assert.deepEqual(previousClubMatches(games,'frv',1),[]);
});

test('counts only recorded plans and keeps the original index across gaps and overtime',()=>{
 const receipts=Array.from({length:30},()=>({}) as CircuitRound);
 receipts[23]=round('A','feint','balanced'); // R24: initial attacking team is defending
 receipts[24]=round('A','split','retake');
 receipts[25]=round('A','fast','reading');
 receipts[27]=round('A','fast','reading');
 receipts[28]=round('A','split','retake');
 receipts[29]=round('A','fast','aggressive');
 const games=[match('frv','mra','A',4,receipts)];
 assert.equal(opponentStrategies(games,'frv','attack').total,2);
 assert.equal(opponentStrategies(games,'frv','attack').ranked[0].count,2);
 assert.deepEqual(opponentStrategies(games,'frv','defense'),{total:4,ranked:[
  {id:'reading',name:'Leitura e resposta',count:2},{id:'balanced',name:'Contenção',count:1},{id:'aggressive',name:'Pressão avançada',count:1},
 ]});
 const onlyScore={...games[0],result:{score:{A:13,B:6}}} as CircuitMatch;
 const played=previousClubMatches([onlyScore],'frv',8);
 assert.equal(played.length,1);
 assert.deepEqual(opponentStrategies(played,'frv','attack'),{total:0,ranked:[]});
});
