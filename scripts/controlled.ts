import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {profiles} from '../test/fixtures.ts';
import type {AttackPlan,DefensePlan} from '../src/tactical-types.ts';
import {attackingTeam} from '../src/map.ts';
const baseline=process.argv.includes('--baseline'),holdout=process.argv.includes('--holdout');
const {simulateMap}=await import(baseline?pathToFileURL('/tmp/esports-baseline/src/autonomous.ts').href:'../src/autonomous.ts');
const perCell=baseline||holdout?5:20;
const all:any[]=[],started=performance.now(),errors:any[]=[];
for(const map of ['patio','horizonte','enlace'] as const)for(const attack of ['fast','control','split'] as AttackPlan[])for(const defense of ['aggressive','balanced','retake'] as DefensePlan[]){
 for(let n=1;n<=perCell;n++)for(const initialAttack of ['A','B'] as const){
  const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Estalo','Farol','Bruma','Trava','Bastião'] as const)[i%5];p.weapon=p.agent==='Trava'?'precision':'main';});
  const seed=(holdout?20261121:20261021)+n,plan={attack,defense,site:'A' as const};
  try{
   const g=simulateMap(ps,{map,seed,initialAttack,plans:{A:plan,B:plan},maxRounds:2000});
   let attacking=0;
   g.rounds.forEach((r:any,i:number)=>{if(r.winner===attackingTeam({rounds:i,initialAttack} as any))attacking++;});
   all.push({map,attack,defense,seed,initialAttack,winner:g.state.winner,rounds:g.rounds.length,attackRounds:attacking,plants:g.summary.plants,defuses:g.summary.defuses,abilityUses:g.summary.abilityUses});
  }catch(e){errors.push({map,attack,defense,seed,initialAttack,error:String(e)});}
 }
 console.log(JSON.stringify({baseline,map,attack,defense,done:all.length,errors:errors.length}));
}
const filename=baseline?'validation/controlled-baseline.json':holdout?'validation/controlled-holdout.json':'validation/controlled-current.json';
writeFileSync(filename,JSON.stringify({version:baseline?'0.2.0':'0.3.0',composition:['Estalo','Farol','Bruma','Trava','Bastião'],scope:holdout?'Independent additional seeds, frozen policy after exploratory calibration. Fixed composition, equal attributes 60, paired sides.':'Exploratory fixed-composition calibration; equal attributes 60, same conditions and paired initial sides. The 20 seed pairs were inspected during development and are not a blind holdout.',seedPairsPerCell:perCell,elapsedMs:Math.round(performance.now()-started),errors,maps:all},null,2));
if(errors.length)process.exitCode=1;
