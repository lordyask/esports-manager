import {attackingTeam} from '../src/map.ts';
import {ATTACKS,DEFENSES} from '../src/strategies.ts';
import type {CircuitMatch} from './circuit-state.ts';

export function previousClubMatches(matches:CircuitMatch[],club:string,day:number){
 return matches.filter(match=>match.result&&match.day<=day&&(match.a===club||match.b===club));
}

export function opponentStrategies(matches:CircuitMatch[],club:string,side:'attack'|'defense'){
 const catalog=side==='attack'?ATTACKS:DEFENSES;
 const counts=new Map<string,number>();
 let total=0;
 for(const match of matches){
  const team=match.a===club?'A':match.b===club?'B':undefined;
  if(!team)continue;
  for(const [rounds,receipt] of (match.result?.receipts??[]).entries()){
   const attacking=attackingTeam({initialAttack:match.initialAttack,rounds});
   const playedSide=attacking===team?'attack':'defense';
   if(playedSide!==side)continue;
   const strategy=receipt?.plans?.[team]?.[side];
   if(!strategy||!Object.hasOwn(catalog,strategy))continue;
   counts.set(strategy,(counts.get(strategy)??0)+1);
   total++;
  }
 }
 // Stable sort preserves the strategy selector's catalog order on a tie.
 const ranked=Object.entries(catalog)
  .map(([id,strategy])=>({id,name:strategy.name,count:counts.get(id)??0}))
  .filter(strategy=>strategy.count>0)
  .sort((a,b)=>b.count-a.count)
  .slice(0,3);
 return {total,ranked};
}
