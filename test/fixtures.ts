import {AGENTS} from '../src/abilities.ts';
import type {Agent} from '../src/abilities.ts';
import type {Profile,SimulationOptions} from '../src/tactical-types.ts';
export function profiles():Profile[]{
  return (['A','B'] as const).flatMap(team=>Array.from({length:5},(_,i)=>({id:team+i,team,agent:AGENTS[i+(team==='B'?3:0)],attrs:[60,60,60,60,60,60,60,60] as Profile['attrs'],agentFamiliarity:85,mapFamiliarity:50,morale:70,fatigue:10,weapon:'main' as const,shield:50,charges:[true,true,true] as [boolean,boolean,boolean],ult:8})));
}
export const plans={A:{attack:'control' as const,defense:'balanced' as const,site:'A' as const},B:{attack:'split' as const,defense:'balanced' as const,site:'B' as const}};
export function scenario(agent:Agent,sector:'A'|'mid'='A'){
  const ps=profiles();ps[0].agent=agent;
  const used=new Set([agent]);for(let i=1;i<5;i++){ps[i].agent=AGENTS.find(a=>!used.has(a))!;used.add(ps[i].agent);}
  const initial=Object.fromEntries(ps.map(p=>[p.id,{sector:p.id==='A0'?sector:p.team==='A'?'attack':'defense'}]));
  return {ps,options:{map:'patio',attacking:'A',seed:19,ai:false,autoFire:false,plans,initial} as SimulationOptions};
}
