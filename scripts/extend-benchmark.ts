// Resume the saved batch for seeds stopped by the initial computational limit.
// No successful cell is rerolled and no incomplete winner is fabricated.
import {readFileSync,writeFileSync} from 'node:fs';
import {simulateMap} from '../src/autonomous.ts';
import {profiles} from '../test/fixtures.ts';
import type {Agent} from '../src/abilities.ts';
const path=new URL('../benchmark-result.json',import.meta.url);
const b=JSON.parse(readFileSync(path,'utf8'));
const compositions:Record<string,Agent[]>={fast:['Estalo','Farol','Bruma','Trava','Bastião'],control:['Ímpeto','Farol','Véu','Trava','Bastião'],split:['Estalo','Pulso','Bruma','Véu','Trava']};
const extended:any[]=b.extendedOvertime??[];const start=performance.now();
for(const cell of b.cells){
  const failures=[...cell.errors];cell.errors=[];
  for(const raw of failures){
    const f=JSON.parse(raw);
    if(!f.error.includes('Overtime safety limit')){cell.errors.push(raw);continue;}
    const ps=profiles();ps.forEach((p,i)=>{p.agent=compositions[cell.attack][i%5];if(p.agent==='Trava')p.weapon='precision';});
    const plan={attack:cell.attack,defense:cell.defense,site:'A' as const};
    try{
      const g=simulateMap(ps,{map:cell.map,seed:f.seed,initialAttack:f.initialAttack,maxRounds:2000,plans:{A:plan,B:plan}});
      cell.maps++;cell[g.summary.winner!]++;cell.rounds+=g.summary.rounds;cell.plants+=g.summary.plants;cell.defuses+=g.summary.defuses;
      for(let i=0;i<g.rounds.length;i++){
        const swapped=i>=24?(i-24)%2===1:i>=12,attacker=swapped?(f.initialAttack==='A'?'B':'A'):f.initialAttack;
        if(g.rounds[i].winner===attacker)cell.attackRounds++;else cell.defenseRounds++;
      }
      for(const [key,n] of Object.entries(g.summary.abilityUses))b.abilityUses[key]=(b.abilityUses[key]??0)+n;
      extended.push({map:cell.map,attack:cell.attack,defense:cell.defense,seed:f.seed,initialAttack:f.initialAttack,rounds:g.summary.rounds});
      console.log(JSON.stringify(extended.at(-1)));
    }catch(e){cell.errors.push(JSON.stringify({...f,error:String(e)}));console.error(String(e));}
  }
}
b.extendedOvertime=extended;b.mapsCompleted=b.cells.reduce((s:number,c:any)=>s+c.maps,0);b.errors=b.mapsRequested-b.mapsCompleted;
for(const field of ['rounds','plants','defuses'])b[field]=b.cells.reduce((s:number,c:any)=>s+c[field],0);
b.extensionElapsedMs=Math.round(performance.now()-start);
b.scope+=' Os casos retidos pelo limite computacional inicial foram retomados com as mesmas seeds e limite 2.000; não houve vitória forçada. Ver extendedOvertime.';
writeFileSync(path,JSON.stringify(b,null,2));
console.log(JSON.stringify({completed:b.mapsCompleted,errors:b.errors,extended:extended.length}));
if(b.errors)process.exitCode=1;
