import type {Account,Plan,BuyPlan,Purchase} from './economy.ts';
import {validateAccount,quoteBuy,settleRound,halfReset,overtimeKit} from './economy.ts';
import type {RoundResult} from './round.ts';
import type {Team} from './rules.ts';
import {integer} from './rules.ts';
export interface MapState {teams: {A: Account[]; B: Account[]}; score: {A:number;B:number}; rounds: number; loss: {A:number;B:number}; initialAttack: Team; phase: 'buy'|'play'|'finished'; winner: Team|null;}
export function createMap(A:Account[],B:Account[],initialAttack:Team='A'):MapState {
  if(A.length!==5||B.length!==5||new Set([...A,...B].map(a=>a.id)).size!==10||!['A','B'].includes(initialAttack))throw new Error('Map requires ten unique players');
  [...A,...B].forEach(validateAccount);
  const reset=(a:Account)=>({...halfReset(a),ult:0});
  return {teams:{A:A.map(reset),B:B.map(reset)},score:{A:0,B:0},rounds:0,loss:{A:0,B:0},initialAttack,phase:'buy',winner:null};
}
export function attackingTeam(s:MapState):Team {
  const swap=s.rounds>=24 ? (s.rounds-24)%2===1 : s.rounds>=12;
  return swap?(s.initialAttack==='A'?'B':'A'):s.initialAttack;
}
export function beginRound(input:MapState,A:BuyPlan,B:BuyPlan,options:{precision?:Partial<Record<Team,string[]>>}={}) {
  if(input.phase!=='buy')throw new Error('Invalid map phase');
  const s=structuredClone(input);
  if(s.rounds===12){s.teams.A=s.teams.A.map(halfReset);s.teams.B=s.teams.B.map(halfReset);s.loss={A:0,B:0};}
  const purchases:Record<Team,Purchase[]>={A:[],B:[]};
  const warnings:{A:string[];B:string[]}={A:[],B:[]};
  for(const team of ['A','B'] as const){
    if(s.rounds>=24)s.teams[team]=s.teams[team].map(a=>overtimeKit(a,options.precision?.[team]?.includes(a.id)??a.weapon==='precision'));
    else {const q=quoteBuy(s.teams[team],team==='A'?A:B,{help:true,precision:options.precision?.[team]});s.teams[team]=q.accounts;warnings[team]=q.missing;purchases[team]=q.purchases;}
  }
  s.phase='play';return {state:s,attacking:attackingTeam(s),warnings,purchases};
}
export function completeRound(input:MapState,result:RoundResult,kills:Record<string,number>={}) {
  if(input.phase!=='play')throw new Error('Invalid map phase');
  const s=structuredClone(input),ids=new Set([...s.teams.A,...s.teams.B].map(a=>a.id));
  if(!['A','B'].includes(result.winner)||result.actors.length!==10||new Set(result.actors.map(a=>a.id)).size!==10||result.actors.some(a=>!ids.has(a.id)))throw new Error('Round roster mismatch');
  for(const team of ['A','B'] as const){
    const won=team===result.winner;s.loss[team]=won?0:s.loss[team]+1;
    s.teams[team]=s.teams[team].map(a=>{
      const end=result.actors.find(p=>p.id===a.id)!;
      if(end.team!==team)throw new Error('Team mismatch');
      integer(kills[a.id]??0,0,5,'kills');
      return settleRound({...a,shield:end.vital.shield/100,charges:end.charges,ult:end.ult},won,s.loss[team],end.vital.life>0,(kills[a.id]??0)>0);
    });
  }
  s.score[result.winner]++;s.rounds++;
  if((s.rounds<=24&&s.score[result.winner]>=13)||(s.rounds>24&&s.rounds%2===0&&Math.abs(s.score.A-s.score.B)>=2)){
    s.winner=result.winner;s.phase='finished';
  }else s.phase='buy';
  return s;
}
