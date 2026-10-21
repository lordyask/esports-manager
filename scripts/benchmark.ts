import {writeFileSync} from 'node:fs';
import {simulateMap} from '../src/autonomous.ts';
import {profiles} from '../test/fixtures.ts';
import type {AttackPlan,DefensePlan} from '../src/tactical-types.ts';
import type {Agent} from '../src/abilities.ts';
import {ENGINE_VERSION} from '../src/rules.ts';
const attacks:AttackPlan[]=['fast','control','split'],defenses:DefensePlan[]=['aggressive','balanced','retake'];
const comps:Record<AttackPlan,Agent[]>={fast:['Estalo','Farol','Bruma','Trava','Bastião'],control:['Ímpeto','Farol','Véu','Trava','Bastião'],split:['Estalo','Pulso','Bruma','Véu','Trava']};
const cells:any[]=[];let total=0,errors=0,plants=0,defuses=0,rounds=0,slowest=0;
const extendedOvertime:any[]=[];
const abilityUses:Record<string,number>={};
const started=performance.now();
for(const map of ['patio','horizonte','enlace'] as const)for(const attack of attacks)for(const defense of defenses){
  const cell={map,attack,defense,maps:0,A:0,B:0,attackRounds:0,defenseRounds:0,rounds:0,plants:0,defuses:0,errors:[] as string[]};
  for(let n=1;n<=20;n++)for(const initialAttack of ['A','B'] as const){
    const ps=profiles();ps.forEach((p,i)=>{p.agent=comps[attack][i%5];if(p.agent==='Trava')p.weapon='precision';});
    const plan={attack,defense,site:'A' as const},start=performance.now();
    try{
      const opts={map,seed:20261016+n,initialAttack,plans:{A:plan,B:plan}};
      let game:ReturnType<typeof simulateMap>;
      try{game=simulateMap(ps,opts);}catch(e){
        if(!String(e).includes('Overtime safety limit'))throw e;
        game=simulateMap(ps,{...opts,maxRounds:2000});
        extendedOvertime.push({map,attack,defense,seed:opts.seed,initialAttack,rounds:game.summary.rounds});
      }
      cell.maps++;cell[game.summary.winner!]++;cell.rounds+=game.summary.rounds;cell.plants+=game.summary.plants;cell.defuses+=game.summary.defuses;
      for(let i=0;i<game.rounds.length;i++){
        const swapped=i>=24?(i-24)%2===1:i>=12,attacker=swapped?(initialAttack==='A'?'B':'A'):initialAttack;
        if(game.rounds[i].winner===attacker)cell.attackRounds++;else cell.defenseRounds++;
      }
      for(const [key,n] of Object.entries(game.summary.abilityUses))abilityUses[key]=(abilityUses[key]??0)+n;
    }catch(e){const failure={seed:20261016+n,initialAttack,error:String(e)};errors++;cell.errors.push(JSON.stringify(failure));console.error(JSON.stringify({map,attack,defense,...failure}));}
    slowest=Math.max(slowest,performance.now()-start);total++;
  }
  cells.push(cell);plants+=cell.plants;defuses+=cell.defuses;rounds+=cell.rounds;
  writeFileSync(new URL('../benchmark-progress.json',import.meta.url),JSON.stringify({cells,total,errors},null,2));
  console.log(JSON.stringify({progress:total,cell:cells.length,map,attack,defense,errors,elapsedMs:Math.round(performance.now()-started)}));
}
const result={engineVersion:ENGINE_VERSION,scope:'Comparações espelhadas de equipes sintéticas iguais. 27 cenários; 20 pares de seeds com lados iniciais trocados por cenário. O limite de processamento é ampliado a 2.000 rodadas apenas quando uma prorrogação ultrapassa 200; não há vitória forçada. Não é validação final de balanceamento.',mapsRequested:total,mapsCompleted:total-errors,errors,rounds,plants,defuses,elapsedMs:Math.round(performance.now()-started),slowestMapMs:Math.round(slowest),extendedOvertime,abilityUses,cells};
writeFileSync(new URL('../benchmark-result.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({complete:true,...result,cells:undefined,abilityUses:undefined}));
if(errors)process.exitCode=1;
