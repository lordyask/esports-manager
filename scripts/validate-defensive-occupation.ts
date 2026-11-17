import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {profiles} from '../test/fixtures.ts';
import type {Profile,TeamPlan} from '../src/tactical-types.ts';
import type {Team} from '../src/rules.ts';

// Sixteen small 5v5 rounds per run: two plans, two seeds, both sites and team identities.
// No abilities, equal attributes and equipment; two defenders at each site and one mid.
const root=resolve(process.env.NEXUS_DEFENSE_ENGINE_ROOT??'.'),load=(file:string)=>import(pathToFileURL(resolve(root,file)).href);
const {TacticalRound}=await load('src/simulation.ts'),{AGENTS}=await load('src/abilities.ts'),{docaSight}=await load('src/doca-v2.ts'),{MECHANICS}=await load('src/content.ts');
const seeds=process.argv.includes('--holdout')?[83,97]:[7,19],cases:unknown[]=[];
const lines=Object.fromEntries((['A','B'] as const).map(site=>{
 const entrances=site==='A'?['corridor_a','link_a','gallery_a']:['corridor_b','link_b','gallery_b'],cover=site==='A'?'cover_a':'cover_b';
 return [site,{entrances,siteSees:entrances.filter(e=>docaSight({sector:site},{sector:e}).visible),coverSees:entrances.filter(e=>docaSight({sector:cover},{sector:e}).visible)}];
}));
for(const seed of seeds)for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const)for(const strategy of ['fast','control'] as const){
 const defending:Team=attacking==='A'?'B':'A',base=profiles();
 const ps:Profile[]=base.map((p,n)=>({...p,agent:AGENTS[n%5],weapon:'main',shield:50,charges:[false,false,false],ult:0}));
 const defenders=ps.filter(p=>p.team===defending).sort((a,b)=>AGENTS.indexOf(a.agent)-AGENTS.indexOf(b.agent));
 const assignments=Object.fromEntries(defenders.map((p,i)=>[p.id,(['A','B','A','B','mid'] as const)[i]]));
 const attackPlan:TeamPlan={attack:strategy,defense:'balanced',site},defensePlan:TeamPlan={attack:'fast',defense:'balanced',site:'A',defenseAssignments:assignments};
 const plans=attacking==='A'?{A:attackPlan,B:defensePlan}:{A:defensePlan,B:attackPlan};
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking,seed,plans});
 const details=Object.fromEntries(defenders.map(p=>[p.id,{id:p.id,agent:p.agent,assigned:assignments[p.id],arrivedAt:null as number|null,coverAt:null as number|null,leftSite:[] as unknown[],visibleWhileRecoveringAt:null as number|null,firstShotAt:null as number|null,eliminatedAt:null as number|null}]));
 let cursor=0,previous:Record<string,{sector:string;known:unknown[];visible:unknown[]}>={};
 for(let t=0;t<=60000&&!sim.result&&!sim.planted;t+=250){
  for(const p of defenders){const u=sim.get(p.id)!;const view=sim.observeFor(p.id);previous[p.id]={sector:u.sector,known:view.known,visible:view.visible};}
  sim.advance(t);
  for(const event of sim.events.slice(cursor)){
   if(!event.actor||!details[event.actor])continue;
   const d=details[event.actor],prev=previous[event.actor];
   if(event.kind==='arrived'&&event.sector===d.assigned&&d.arrivedAt===null)d.arrivedAt=event.at;
   if(event.kind==='arrived'&&event.sector===`cover_${String(d.assigned).toLowerCase()}`&&d.coverAt===null)d.coverAt=event.at;
   if(event.kind==='move_start'&&['A','B'].includes(prev.sector))d.leftSite.push({at:event.at,from:prev.sector,to:event.sector,knownBefore:prev.known,visibleBefore:prev.visible});
   if(event.kind==='shot'&&d.firstShotAt===null)d.firstShotAt=event.at;
   if(event.kind==='eliminated'&&d.eliminatedAt===null)d.eliminatedAt=event.at;
  }
  cursor=sim.events.length;
  for(const p of defenders){const u=sim.get(p.id)!;if(u.vital.life>0&&!u.movement&&u.readyAt>sim.now&&sim.observeFor(p.id).visible.length&&details[p.id].visibleWhileRecoveringAt===null)details[p.id].visibleWhileRecoveringAt=sim.now;}
 }
 const contact=sim.events.find((e:any)=>e.kind==='first_contact'),firstElimination=sim.events.find((e:any)=>e.kind==='eliminated'),plant=sim.events.find((e:any)=>e.kind==='planted');
 cases.push({seed,attacking,defending,site,strategy,assignments,defenders:Object.values(details),firstContact:contact??null,firstElimination:firstElimination??null,firstPlant:plant??null,stop:{at:sim.now,reason:sim.planted?'plant':sim.result?'round-ended':'time-limit',winner:sim.result?.winner??null},prePlantDefenderShots:sim.events.filter((e:any)=>e.kind==='shot'&&e.actor?.startsWith(defending)).length,prePlantDefenderEliminations:sim.events.filter((e:any)=>e.kind==='eliminated'&&e.target?.startsWith(defending)).length});
}
const result={scope:'Synthetic equal-equipped 5v5; 2-2-1 defensive assignments; 250 ms observation sampling; timestamps include 5 s preparation. Counts stop at first completed plant, round end or 60 s. Repeated seeds across sites and sides are paired, not independent. In an eliminated event actor is the victim and target is the killer.',mechanics:MECHANICS,seeds,lines,cases};
const target=process.env.NEXUS_DEFENSE_OUTPUT??`validation/defensive-occupation/${process.argv.includes('--holdout')?'holdout':'exploratory'}.json`;
mkdirSync(dirname(resolve(target)),{recursive:true});writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
