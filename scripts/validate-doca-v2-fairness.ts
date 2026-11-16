import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {simulateRound} from '../src/simulation.ts';
import {sha256} from '../src/hash.ts';
import {profiles} from '../test/fixtures.ts';
import type {TeamPlan} from '../src/tactical-types.ts';
const results={scope:'2000 distinct hashed seeds, equal teams and equipment, stationary exposed 5v5, both sites and attacking sides. Reversed input is checked for every run.',rounds:0,teamAWins:0,attackingWins:0,mutualEliminations:0,teamAWinsWhenAttacking:0,teamAWinsWhenDefending:0,reversedInputChecks:0};
for(let i=0;i<2000;i++){
 const seed=parseInt(sha256(`doca-v2-fairness:${i}`).slice(0,8),16)||1,attacking=i%2===0?'A':'B',site=i%4<2?'A':'B';
 const plan:TeamPlan={attack:'fast',defense:'balanced',site};
 const ps=profiles().map((p,n)=>({...p,agent:profiles()[n%5].agent,weapon:'intermediate' as const,shield:25,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:site}])),options={map:'doca-v2' as const,attacking,seed,plans:{A:plan,B:plan},initial,ai:false};
 const r=simulateRound(ps,options);assert.deepEqual(simulateRound([...ps].reverse(),options),r);results.reversedInputChecks++;
 results.rounds++;results.teamAWins+=Number(r.winner==='A');results.attackingWins+=Number(r.winner===attacking);results.mutualEliminations+=Number(r.reason==='mutual_elimination');
 if(r.winner==='A')results[attacking==='A'?'teamAWinsWhenAttacking':'teamAWinsWhenDefending']++;
}
mkdirSync('validation/doca-v2',{recursive:true});writeFileSync('validation/doca-v2/fairness.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
