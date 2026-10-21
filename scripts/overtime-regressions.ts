import {writeFileSync} from 'node:fs';
import {simulateMap} from '../src/autonomous.ts';
import {profiles} from '../test/fixtures.ts';
const cases=[{seed:20261028,defense:'aggressive',before:366},{seed:20261031,defense:'aggressive',before:230},{seed:20261025,defense:'balanced',before:248},{seed:20261032,defense:'balanced',before:218}] as const;
const results=[];
for(const c of cases){const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Ímpeto','Farol','Véu','Trava','Bastião'] as const)[i%5];if(p.agent==='Trava')p.weapon='precision';});const plan={attack:'control' as const,defense:c.defense,site:'A' as const};
 try{const g=simulateMap(ps,{map:'enlace',seed:c.seed,initialAttack:'B',plans:{A:plan,B:plan},maxRounds:2000});results.push({...c,after:g.summary.rounds,score:g.state.score,winner:g.state.winner});}
 catch(e){results.push({...c,error:String(e)});}
 console.log(JSON.stringify(results.at(-1)));
}
writeFileSync('validation/overtime-regressions.json',JSON.stringify({engine:'0.3.0',scope:'Same four original seeds, initial side, composition and tactical plans. Computational guard 2000 is not a victory rule.',results},null,2));
if(results.some(r=>'error' in r))process.exitCode=1;
