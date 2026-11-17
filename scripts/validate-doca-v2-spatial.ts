import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {sha256} from '../src/hash.ts';
import type {TeamPlan,Profile} from '../src/tactical-types.ts';

// NEXUS_SPATIAL_ENGINE_ROOT can point to a frozen checkout of the previous candidate.
const root=resolve(process.env.NEXUS_SPATIAL_ENGINE_ROOT??'.'),load=(file:string)=>import(pathToFileURL(resolve(root,file)).href);
const {simulateRound}=await load('src/simulation.ts'),{profiles}=await load('test/fixtures.ts'),{DOCA_V2_REVISION}=await load('src/doca-v2.ts');
const attacks=['fast','control','split','feint'] as const,defenses=['aggressive','balanced','reading','retake'] as const;
const seeds=Array.from({length:8},(_,i)=>parseInt(sha256(`doca-v2-spatial-independent:${i}`).slice(0,8),16)||1);
const result={scope:'8 hashed synthetic seeds, reused across all 16 strategy pairs, both attacking identities and both sites. Results within a seed are correlated; sample is diagnostic, not global balance.',mapRevision:DOCA_V2_REVISION,seeds,rounds:0,attackingWins:0,teamAWins:0,plants:0,defuses:0,firstContactBeforeAction:0,firstContactMinMs:Infinity,firstContactMaxMs:0,abilityUses:0,cells:{} as Record<string,{rounds:number;attackingWins:number;plants:number;defuses:number}>};
for(const seed of seeds)for(const attack of attacks)for(const defense of defenses)for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const){
 const plan:TeamPlan={attack,defense,site},base=profiles() as Profile[],ps=base.map((p,n)=>({...p,agent:base[n%5].agent,ult:0}));
 const r=simulateRound(ps,{map:'doca-v2',attacking,seed,plans:{A:plan,B:plan}});result.rounds++;result.attackingWins+=Number(r.winner===attacking);result.teamAWins+=Number(r.winner==='A');
 const planted=Number(r.events.some((e:any)=>e.kind==='planted')),defused=Number(r.reason==='defused');result.plants+=planted;result.defuses+=defused;
 result.abilityUses+=Object.values(r.abilityUses as Record<string,number>).reduce((a,b)=>a+b,0);
 const c=r.events.find((e:any)=>e.kind==='first_contact');if(c){result.firstContactBeforeAction+=Number(c.at<5000);result.firstContactMinMs=Math.min(result.firstContactMinMs,c.at);result.firstContactMaxMs=Math.max(result.firstContactMaxMs,c.at);}
 const cell=result.cells[`${attack}/${defense}`]??={rounds:0,attackingWins:0,plants:0,defuses:0};cell.rounds++;cell.attackingWins+=Number(r.winner===attacking);cell.plants+=planted;cell.defuses+=defused;
}
const target=process.env.NEXUS_SPATIAL_OUTPUT??'validation/doca-v2/spatial-sample.json';mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
