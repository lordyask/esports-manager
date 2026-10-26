import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {simulateMap} from '../src/autonomous.ts';
import {ENGINE_VERSION} from '../src/rules.ts';
import {attackingTeam} from '../src/map.ts';
import {profiles} from '../test/fixtures.ts';
import {ATTACKS,DEFENSES} from '../src/strategies.ts';
import type {AttackPlan,DefensePlan,TacticalRole} from '../src/tactical-types.ts';
const holdout=process.argv.includes('--holdout'),pairs=holdout?1:2;
const coreSHA256=createHash('sha256').update(readdirSync('src').filter(p=>p.endsWith('.ts')).sort().map(p=>'src/'+p).map(p=>p+'\n'+readFileSync(p,'utf8')).join('\n')).digest('hex');
const policySHA256=createHash('sha256').update(readFileSync('src/ai.ts')).digest('hex');
const compositions=[['Estalo','Farol','Bruma','Trava','Bastião'],['Ímpeto','Pulso','Véu','Trava','Bastião']] as const;
const roles:TacticalRole[][]=[['Entry','Support','Support','Main OP','Anchor'],['Entry','Support','Lurker','Main OP','Anchor']];
const results:any[]=[],errors:any[]=[],start=performance.now();
for(const map of ['patio','horizonte','enlace'] as const)for(const attack of Object.keys(ATTACKS) as AttackPlan[])for(const defense of Object.keys(DEFENSES) as DefensePlan[])for(let c=0;c<compositions.length;c++){
 for(let n=1;n<=pairs;n++)for(const initialAttack of ['A','B'] as const){
  const ps=profiles();ps.forEach((p,i)=>{p.agent=compositions[c][i%5];p.role=roles[c][i%5];p.weapon=p.role==='Main OP'?'precision':'main';p.igl=i%5===1;});
  const seed=(holdout?20270221:20261101)+n,plan={attack,defense,site:'A' as const};
  try{const game=simulateMap(ps,{map,seed,initialAttack,plans:{A:plan,B:plan},maxRounds:500,overtimePairLimit:3});let wins=0;for(let i=0;i<game.rounds.length;i++)if(game.rounds[i].winner===attackingTeam({rounds:i,initialAttack} as any))wins++;
   results.push({map,attack,defense,composition:c,seed,initialAttack,winner:game.state.winner,rounds:game.rounds.length,attackRounds:wins,plants:game.summary.plants,defuses:game.summary.defuses});
  }catch(error){errors.push({map,attack,defense,composition:c,seed,initialAttack,error:String(error)});}
 }
 console.log(JSON.stringify({map,attack,defense,composition:c,done:results.length,errors:errors.length}));
}
const summary={engine:ENGINE_VERSION,overtimePairLimit:3,holdout,policySHA256,coreSHA256,pairsPerCell:pairs,compositions,conditions:'Equal attributes 60, familiarities 85, fixed conditions; same plan on paired sides. No win-rate target. Core plans only; complements covered separately.',elapsedMs:Math.round(performance.now()-start),errors,totalMaps:results.length,totalRounds:results.reduce((n,r)=>n+r.rounds,0),maxRounds:Math.max(...results.map(r=>r.rounds)),byMap:Object.fromEntries(['patio','horizonte','enlace'].map(map=>{const rs=results.filter(r=>r.map===map);return [map,{maps:rs.length,rounds:rs.reduce((n,r)=>n+r.rounds,0),attackWinRate:rs.reduce((n,r)=>n+r.attackRounds,0)/rs.reduce((n,r)=>n+r.rounds,0)}];})),maps:results};
mkdirSync('validation/beta11/rc1',{recursive:true});writeFileSync(`validation/beta11/rc1/${holdout?'holdout':'exploratory'}.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,maps:undefined}));if(errors.length)process.exitCode=1;
