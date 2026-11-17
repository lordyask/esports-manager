import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {simulateRound} from '../src/simulation.ts';
import {simulateRound as simulateOld} from '../legacy/v0_5_1/src/simulation.ts';
import {quoteBuy} from '../src/economy.ts';
import type {Plan} from '../src/economy.ts';
import type {TeamPlan,Profile} from '../src/tactical-types.ts';
import {profiles} from '../test/fixtures.ts';
import {WEAPONS} from '../src/rules.ts';

// Synthetic and reproducible; never uses the user's historical matches.
const experimental=process.argv.includes('--experimental-damage'),holdout=process.argv.includes('--holdout');
if(experimental){WEAPONS.basic.damage=29;WEAPONS.main.damage=42;}
const offset=holdout?2100000:0;
const plans=['eco','semi','full'] as const;
const kits=Object.fromEntries(plans.map(plan=>{
 const quote=quoteBuy([{id:'p',credits:9000,weapon:'basic',shield:0,charges:[false,false,false],ult:0}],plan);
 return [plan,{...quote.accounts[0],spent:quote.total}];
})) as Record<Plan,ReturnType<typeof quoteBuy>['accounts'][number]&{spent:number}>;
type Totals={n:number;leftWins:number;rightWins:number;teamAWins:number;attackingWins:number;leftKills:number;rightKills:number;leftDamage:number;rightDamage:number;leftSurvivors:number;rightSurvivors:number;durationMs:number};
const empty=():Totals=>({n:0,leftWins:0,rightWins:0,teamAWins:0,attackingWins:0,leftKills:0,rightKills:0,leftDamage:0,rightDamage:0,leftSurvivors:0,rightSurvivors:0,durationMs:0});
const output:Record<string,Totals>={};let reverseChecks=0;
for(const engine of ['0.5.1','0.6.0'] as const)for(const attrs of ['equal','left-plus-8'] as const)for(let i=0;i<plans.length;i++)for(let j=i;j<plans.length;j++){
 const left=plans[i],right=plans[j],key=`${engine}/${attrs}/${left}-${right}`,t=output[key]=empty();
 for(let seed=1;seed<=15;seed++)for(const leftTeam of ['A','B'] as const)for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const){
  const ps=profiles().map((p,n)=>{const kit=kits[p.team===leftTeam?left:right];return {...p,agent:profiles()[n%5].agent,attrs:p.attrs.map(x=>x+(attrs==='left-plus-8'&&p.team===leftTeam?8:0)) as Profile['attrs'],weapon:kit.weapon,shield:kit.shield,charges:[false,false,false] as [boolean,boolean,boolean],ult:0};});
  const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:site}]));
  const plan:TeamPlan={attack:'fast',defense:'balanced',site};
  const options={map:engine==='0.6.0'?'doca-v2' as const:'doca' as const,attacking,seed:400000+offset+seed,plans:{A:plan,B:plan},initial,ai:false};
  const sim=engine==='0.6.0'?simulateRound:simulateOld;
  const result=sim(ps as any,options as any);
  if(seed===1&&site==='A'&&attacking==='A'){assert.deepEqual(sim([...ps].reverse() as any,options as any),result);reverseChecks++;}
  t.n++;if(result.winner===leftTeam)t.leftWins++;else t.rightWins++;t.teamAWins+=Number(result.winner==='A');t.attackingWins+=Number(result.winner===attacking);
  for(const p of result.actors){const leftSide=p.team===leftTeam;if(p.vital.life>0)t[leftSide?'leftSurvivors':'rightSurvivors']++;t[leftSide?'leftKills':'rightKills']+=result.kills[p.id]??0;}
  for(const e of result.events)if(e.kind==='weapon_damage'&&e.actor)t[e.actor[0]===leftTeam?'leftDamage':'rightDamage']+=(e.amount??0)/100;
  t.durationMs+=result.at-(engine==='0.6.0'?5000:0);
 }
}
// Hold armour constant to isolate the weapons; hold weapon constant to isolate armour.
const components:Record<string,Totals>={};
for(const [name,lw,ls,rw,rs] of [['basic-intermediate','basic',25,'intermediate',25],['intermediate-main','intermediate',25,'main',25],['shield-25-50','basic',25,'basic',50]] as const){
 const t=components[name]=empty();
 for(let seed=1;seed<=15;seed++)for(const leftTeam of ['A','B'] as const)for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const){
  const ps=profiles().map((p,n)=>({...p,agent:profiles()[n%5].agent,weapon:p.team===leftTeam?lw:rw,shield:p.team===leftTeam?ls:rs,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
  const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:site}])),plan:TeamPlan={attack:'fast',defense:'balanced',site};
  const r=simulateRound(ps,{map:'doca-v2',attacking,seed:510000+offset+seed,plans:{A:plan,B:plan},initial,ai:false});
  t.n++;if(r.winner===leftTeam)t.leftWins++;else t.rightWins++;t.teamAWins+=Number(r.winner==='A');t.attackingWins+=Number(r.winner===attacking);t.durationMs+=r.at-5000;
  for(const p of r.actors){const isLeft=p.team===leftTeam;if(p.vital.life>0)t[isLeft?'leftSurvivors':'rightSurvivors']++;t[isLeft?'leftKills':'rightKills']+=r.kills[p.id]??0;}
  for(const e of r.events)if(e.kind==='weapon_damage'&&e.actor)t[e.actor[0]===leftTeam?'leftDamage':'rightDamage']+=(e.amount??0)/100;
 }
}
// Full map, AI and abilities: bounded smoke test, not an estimate of global balance.
const spatial:Record<string,number>={rounds:0,firstContactZero:0,firstContactDuringPreparation:0,plants:0,defuses:0,abilityUses:0,attackingWins:0,durationMs:0};
let firstContactMin=Infinity,firstContactMax=0;
const strategyCells:Record<string,{rounds:number;attackingWins:number;plants:number;defuses:number}>={};
const attacks=['fast','control','split','feint'] as const,defenses=['aggressive','balanced','reading','retake'] as const;
for(const attack of attacks)for(const defense of defenses)for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const)for(let seed=1;seed<=2;seed++){
 const plan:TeamPlan={attack,defense,site},ps=profiles().map((p,n)=>({...p,agent:profiles()[n%5].agent,ult:0}));
 const r=simulateRound(ps,{map:'doca-v2',attacking,seed:810000+offset+seed,plans:{A:plan,B:plan}});
 spatial.rounds++;spatial.attackingWins+=Number(r.winner===attacking);spatial.plants+=r.events.filter(e=>e.kind==='planted').length;spatial.defuses+=Number(r.reason==='defused');spatial.abilityUses+=Object.values(r.abilityUses).reduce((a,b)=>a+b,0);spatial.durationMs+=r.at-5000;
 const key=`${attack}/${defense}`;const cell=strategyCells[key]??={rounds:0,attackingWins:0,plants:0,defuses:0};cell.rounds++;cell.attackingWins+=Number(r.winner===attacking);cell.plants+=Number(r.events.some(e=>e.kind==='planted'));cell.defuses+=Number(r.reason==='defused');
 const contact=r.events.find(e=>e.kind==='first_contact');if(contact){firstContactMin=Math.min(firstContactMin,contact.at);firstContactMax=Math.max(firstContactMax,contact.at);spatial.firstContactZero+=Number(contact.at===0);spatial.firstContactDuringPreparation+=Number(contact.at<5000);}
}
const skillSample={rounds:0,withSkillsWins:0,withoutSkillsWins:0,withSkillsUses:0,withoutSkillsUses:0,plants:0,defuses:0};
for(let seed=1;seed<=8;seed++)for(const skillTeam of ['A','B'] as const)for(const attacking of ['A','B'] as const)for(const site of ['A','B'] as const){
 const plan:TeamPlan={attack:attacks[(seed-1)%4],defense:defenses[(seed-1)%4],site};
 const ps=profiles().map((p,n)=>({...p,agent:profiles()[n%5].agent,weapon:'intermediate' as const,shield:25,charges:(p.team===skillTeam?[true,true,true]:[false,false,false]) as [boolean,boolean,boolean],ult:0}));
 const r=simulateRound(ps,{map:'doca-v2',attacking,seed:910000+offset+seed,plans:{A:plan,B:plan}});skillSample.rounds++;if(r.winner===skillTeam)skillSample.withSkillsWins++;else skillSample.withoutSkillsWins++;
 for(const e of r.events)if(e.kind==='cast_complete'&&e.actor)skillSample[e.actor.startsWith(skillTeam)?'withSkillsUses':'withoutSkillsUses']++;
 skillSample.plants+=Number(r.events.some(e=>e.kind==='planted'));skillSample.defuses+=Number(r.reason==='defused');
}
const result={scope:'Synthetic isolated 5v5 crossfire with fixed actual equipment, no movement, no abilities, 15 seeds per cell. The same seeds recur across paired conditions; outcomes are not independent. Full-map samples are functional smoke tests.',experimental,holdout,damage:{basic:WEAPONS.basic.damage,main:WEAPONS.main.damage},kits,isolated:output,components,reverseInputChecks:reverseChecks,spatial:{...spatial,firstContactMinMs:firstContactMin,firstContactMaxMs:firstContactMax,strategyCells},skillSample,damageChanged:experimental,economyRulesChanged:false};
const suffix=`${experimental?'-experimental':''}${holdout?'-holdout':''}`;mkdirSync('validation/doca-v2',{recursive:true});writeFileSync(`validation/doca-v2/economy${suffix}.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
