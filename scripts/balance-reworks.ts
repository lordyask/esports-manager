import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {quoteBuy} from '../src/economy.ts';
import {simulateRound} from '../src/simulation.ts';
import {simulateRound as beforeRound} from '../legacy/v0_5_0/src/simulation.ts';
import {MECHANICS as beforeMechanics} from '../legacy/v0_5_0/src/content.ts';
import {MECHANICS} from '../src/content.ts';
import {OPPONENTS} from '../lib/opponents.ts';
import {sha256} from '../src/hash.ts';
import type {Agent} from '../src/abilities.ts';
import type {Profile,SimulationOptions,TeamPlan,SimulationResult} from '../src/tactical-types.ts';
const directory=process.env.NEXUS_BALANCE_DIRECTORY??'validation/balance/exploration';
const count=Number(process.env.NEXUS_BALANCE_SEEDS??12),offset=Number(process.env.NEXUS_BALANCE_OFFSET??10001);
assert.ok(Number.isInteger(count)&&count>0&&Number.isInteger(offset)&&offset>0);
const formation=process.env.NEXUS_BALANCE_FORMATION??'spread';
assert.ok(['spread','grouped'].includes(formation));
const engine=process.env.NEXUS_BALANCE_ENGINE??'after';assert.ok(['before','after'].includes(engine));
const runRound=engine==='before'?beforeRound:simulateRound,mechanics=engine==='before'?beforeMechanics:MECHANICS;
const defenses=process.env.NEXUS_BALANCE_DEFENSE==='all'?(['balanced','reading','aggressive','retake'] as const):(['balanced'] as const);
const masks=process.env.NEXUS_BALANCE_MASKS==='both'?['both']:['none','prisma','bastiao','both'];
const npcHash=sha256(JSON.stringify(OPPONENTS)),rows:any[]=[],started=performance.now();
const sets:Agent[][]=[['Estalo','Farol','Trava','Prisma','Bastião'],['Ímpeto','Pulso','Bruma','Prisma','Bastião']];
export function roster(composition:number,kit:'eco'|'semi'|'full'|'ultimate',mask:string,roles=true):Profile[]{
 return (['A','B'] as const).flatMap(team=>{
  const accounts=quoteBuy(Array.from({length:5},(_,i)=>({id:team+i,credits:kit==='eco'?1000:kit==='semi'?3000:6000,weapon:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:kit==='ultimate'?8:0})),kit==='ultimate'?'full':kit).accounts;
  return accounts.map((a,i)=>({id:a.id,team,agent:sets[composition][i],attrs:[60,60,60,60,60,60,60,60] as Profile['attrs'],agentFamiliarity:85,mapFamiliarity:50,morale:70,fatigue:10,weapon:a.weapon,shield:a.shield,charges:(i===3&&!['prisma','both'].includes(mask)||i===4&&!['bastiao','both'].includes(mask))?[false,false,false]:a.charges,ult:(i===3&&!['prisma','both'].includes(mask)||i===4&&!['bastiao','both'].includes(mask))?0:a.ult,...roles?{role:(formation==='grouped'?(['Entry','Support','Second','Support','Anchor'] as const):(['Entry','Support','Lurker','Support','Anchor'] as const))[i],igl:i===1}:{}}));
 });
}
function metrics(result:SimulationResult,attacking:'A'|'B'){
 const es=result.events;return {attackWon:result.winner===attacking,reason:result.reason,at:result.at,plant:es.some(e=>e.kind==='planted'),casts:result.abilityUses,protection:es.filter(e=>e.kind==='damage_prevented').reduce((n,e)=>n+(e.amount??0),0),attackArrivals:es.filter(e=>e.kind==='arrived'&&e.actor?.startsWith(attacking)).length,attackShots:es.filter(e=>e.kind==='shot'&&e.actor?.startsWith(attacking)).length,defenseShots:es.filter(e=>e.kind==='shot'&&!e.actor?.startsWith(attacking)).length,neutralizations:es.filter(e=>e.kind==='destroyed').length,usesNew:es.filter(e=>e.kind==='effect_deployed').length};
}
for(const map of ['doca','cume'] as const)for(const composition of [0,1])for(const kit of ['eco','semi','full','ultimate'] as const)for(const attack of ['fast','control','split','feint'] as const)for(const mask of masks)for(const defense of defenses)for(let i=0;i<count;i++)for(const attacking of ['A','B'] as const){
 const seed=offset+i*7919,plan:TeamPlan={attack,defense,site:'A'},options:SimulationOptions={map,attacking,seed,plans:{A:plan,B:plan}},p=roster(composition,kit,mask),result=runRound(p,options);
 assert.ok(!result.events.some(e=>e.kind==='role_notice'));assert.ok(result.actors.every(u=>u.vital.life>=0&&u.vital.life<=10000));
 rows.push({map,composition,kit,attack,defense,mask,seed,attacking,...metrics(result,attacking)});
}
const roleRows:any[]=[];
for(const map of ['doca','cume'] as const)for(const roles of [false,true])for(const kit of ['full','ultimate'] as const)for(let i=0;i<count;i++)for(const attacking of ['A','B'] as const){
 const plan:TeamPlan={attack:'control',defense:'balanced',site:'A'},seed=offset+i*7919,result=runRound(roster(0,kit,'both',roles),{map,seed,attacking,plans:{A:plan,B:plan}});roleRows.push({map,roles,kit,seed,attacking,...metrics(result,attacking)});
}
assert.equal(sha256(JSON.stringify(OPPONENTS)),npcHash);
const summary:any[]=[];
for(const kit of ['eco','semi','full','ultimate'])for(const mask of ['none','prisma','bastiao','both']){const x=rows.filter(r=>r.kit===kit&&r.mask===mask);summary.push({kit,mask,rounds:x.length,attackWins:x.filter(r=>r.attackWon).length,plants:x.filter(r=>r.plant).length,defenseWins:x.filter(r=>!r.attackWon).length,meanSeconds:Math.round(x.reduce((n,r)=>n+r.at,0)/x.length)/1000,protection:x.reduce((n,r)=>n+r.protection,0)});}
const roleSummary=[];for(const roles of [false,true])for(const kit of ['full','ultimate']){const x=roleRows.filter(r=>r.roles===roles&&r.kit===kit);roleSummary.push({roles,kit,rounds:x.length,attackWins:x.filter(r=>r.attackWon).length,plants:x.filter(r=>r.plant).length});}
const report={scope:'Mirrored same-roster profiles, equal attributes 60, roles, same attack/defense plan on both teams, paired starting sides and seeds; four attack plans; defense subset and kit masks explicitly recorded below. Masking a kit disables only its charges/ultimate for both teams without replacing agent/profile. This is an ablation experiment, not an alternate playable mode or causal proof of a particular coefficient.',mechanics,engine,formation,defenses,masks,npcHash,npcUnchanged:true,seedsPerCell:count,offset,rows:rows.length,diagnosticRounds:roleRows.length,summary,roleSummary,elapsedMs:Math.round(performance.now()-started)};
mkdirSync(directory,{recursive:true});writeFileSync(directory+'/summary.json',JSON.stringify(report,null,2)+'\n');writeFileSync(directory+'/rows.json',JSON.stringify({rows,roleRows})+'\n');console.log(JSON.stringify(report));
