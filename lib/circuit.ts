import {MECHANICS} from '../src/content.ts';
import type {Workspace,Session,RoundCommand} from './game.ts';
import {stats,advanceSession,automaticBuys,validateSession} from './game.ts';
import {validateCareer} from './career-state.ts';
import {pendingNpc,finishCircuit} from './circuit-state.ts';
import type {CircuitMatch,CircuitResult} from './circuit-state.ts';
import {opponentFor,opponentProfiles} from './opponents.ts';
import {clubPlan} from './club-policy.ts';
import {createMap} from '../src/map.ts';

export function circuitResult(s:Session):CircuitResult {
 validateSession(s);if(s.state.phase!=='finished')throw new Error('Partida incompleta.');
 return {mechanics:structuredClone(s.mechanics),score:structuredClone(s.state.score),winner:s.state.winner??null,seed:s.seed,rounds:s.state.rounds,profiles:structuredClone(s.profiles),stats:stats(s),receipts:s.records.map(r=>({seed:r.seed,winner:r.result.winner,reason:r.result.reason,plans:structuredClone(r.command.plans),purchases:structuredClone(r.purchases),equipment:structuredClone(r.equipment)}))};
}
export function createNpcSession(m:CircuitMatch):Session {
 if(m.a==='user'||m.b==='user')throw new Error('O confronto do usuário precisa de preparação.');
 const profiles=[...opponentProfiles(m.a).map(p=>({...p,id:`A:${p.id.slice(2)}`,team:'A' as const})),...opponentProfiles(m.b)];
 const names=Object.fromEntries(profiles.map(p=>[p.id,opponentFor(p.team==='A'?m.a:m.b).players.find(x=>x.id===p.id.slice(2))!.name]));
 const accounts=(t:'A'|'B')=>profiles.filter(p=>p.team===t).map(p=>({id:p.id,credits:1000,weapon:p.weapon,shield:0,charges:p.charges,ult:0}));
 return {mechanics:structuredClone(MECHANICS),id:m.id,map:m.map,seed:m.seed,profiles,names,state:createMap(accounts('A'),accounts('B'),m.initialAttack,3),records:[]};
}
export function npcCommand(m:CircuitMatch,s:Session):RoundCommand{return {id:`${m.id}:round:${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:clubPlan(m.a,m.seed,s.state.rounds),B:clubPlan(m.b,m.seed,s.state.rounds)}};}
/** Shared engine; used in the worker-driven UI and deterministic verification. */
export function simulateNpc(m:CircuitMatch):Session {let s=createNpcSession(m);while(s.state.phase!=='finished')s=advanceSession(s,npcCommand(m,s));return s;}
export function acceptNpcResult(w:Workspace,id:string,s:Session):Workspace {
 validateCareer(w);const c=w.career;if(!c?.circuit)throw new Error('Circuito indisponível.');
 const existing=c.circuit.matches.find(m=>m.id===id);if(!existing||existing.a==='user'||s.id!==id||s.map!==existing.map||s.seed!==existing.seed||s.state.initialAttack!==existing.initialAttack)throw new Error('Jogo NPC não corresponde à grade.');
 const result=circuitResult(s);
 if(existing.result){if(JSON.stringify(existing.result)!==JSON.stringify(result))throw new Error('Resultado NPC já possui outro conteúdo.');return structuredClone(w);}
 if(pendingNpc(c)?.id!==id)throw new Error('Jogo NPC fora da sequência da rodada.');
 const next=structuredClone(w);next.career!.circuit!.matches.find(m=>m.id===id)!.result=result;finishCircuit(next.career!);validateCareer(next);return next;
}
