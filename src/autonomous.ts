import {sha256} from './hash.ts';
import {beginRound,completeRound,createMap} from './map.ts';
import {quoteBuy} from './economy.ts';
import type {Account,Plan} from './economy.ts';
import {ENGINE_VERSION,RULES_VERSION,integer} from './rules.ts';
import type {MapId,Team} from './rules.ts';
import {simulateRound} from './simulation.ts';
import type {Profile,SimulationResult,TeamPlan} from './tactical-types.ts';

export interface AutonomousOptions {map:MapId;seed:number;initialAttack?:Team;plans:Record<Team,TeamPlan>;maxRounds?:number;}
export function economicPlan(accounts:Account[]):Plan {
  // Quotes consider retained equipment, rather than requiring 6,000 cash every round.
  if(quoteBuy(accounts,'full',{help:true}).missing.length===0)return 'full';
  if(quoteBuy(accounts,'semi',{help:true}).missing.length<=1)return 'semi';
  return 'eco';
}
export function simulateMap(profiles:Profile[],options:AutonomousOptions){
  const accounts=(t:Team):Account[]=>profiles.filter(p=>p.team===t).map(p=>({id:p.id,credits:1000,weapon:p.weapon,shield:p.shield,charges:p.charges,ult:p.ult}));
  let state=createMap(accounts('A'),accounts('B'),options.initialAttack??'A');
  const rounds:SimulationResult[]=[],purchases:{A:Plan;B:Plan}[]=[];
  const limit=integer(options.maxRounds??200,26,2000,'round safety limit');
  while(state.phase!=='finished'&&rounds.length<limit){
    const planA=state.rounds===12?'eco':economicPlan(state.teams.A),planB=state.rounds===12?'eco':economicPlan(state.teams.B);
    const precision={A:profiles.filter(p=>p.team==='A'&&p.weapon==='precision').map(p=>p.id),B:profiles.filter(p=>p.team==='B'&&p.weapon==='precision').map(p=>p.id)};
    const ready=beginRound(state,planA,planB,{precision});purchases.push({A:planA,B:planB});
    const roundProfiles=profiles.map(p=>{
      const a=ready.state.teams[p.team].find(a=>a.id===p.id)!;
      return {...p,weapon:a.weapon,shield:a.shield,charges:a.charges,ult:a.ult};
    });
    // Stable seed per round avoids dependence on UI playback and call timing.
    const seed=((options.seed+Math.imul(state.rounds+1,0x9e3779b9))>>>0)||1;
    const result=simulateRound(roundProfiles,{map:options.map,attacking:ready.attacking,seed,plans:options.plans});
    state=completeRound(ready.state,result,result.kills);rounds.push(result);
  }
  if(state.phase!=='finished')throw new Error(`Overtime safety limit (${limit}); no partial winner persisted`);
  const contentHash=sha256(JSON.stringify(profiles));
  return {engineVersion:ENGINE_VERSION,rulesVersion:RULES_VERSION,contentHash,initialProfiles:structuredClone(profiles),options:structuredClone(options),state,purchases,rounds,
    summary:{winner:state.winner,score:state.score,rounds:rounds.length,plants:rounds.flatMap(r=>r.events).filter(e=>e.kind==='planted').length,
      defuses:rounds.filter(r=>r.reason==='defused').length,events:rounds.reduce((s,r)=>s+r.processed,0),
      abilityUses:rounds.reduce((all,r)=>{for(const [key,n] of Object.entries(r.abilityUses))all[key]=(all[key]??0)+n;return all;},{} as Record<string,number>)}};
}
