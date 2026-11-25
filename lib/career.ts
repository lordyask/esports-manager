import type {Workspace,Session} from './game.ts';
import {validateDraft,createSession,randomSeed,normalizedWorkspace} from './game.ts';
import {newDevelopment,previewTraining} from './development.ts';
import type {TrainingChoice} from './development.ts';
import {matchSeed} from '../src/seed.ts';
import {fixtureSchedule,currentFixture,nextFixture,dayClosed,careerDevelopment,validateCareer} from './career-state.ts';
import {opponentFor,opponentProfiles} from './opponents.ts';
import {createMap} from '../src/map.ts';
import {initializeHistory,archiveResult,HISTORY_LIMIT} from './history.ts';
import {newCircuit,pendingNpc,finishCircuit} from './circuit-state.ts';
import {clubFinance} from './club-finance.ts';
import {circuitResult} from './circuit.ts';

function startCareerBase(w:Workspace,id:string,seed=randomSeed()):Workspace{
 if(w.career)throw new Error('O ciclo atual já foi iniciado. Exporte antes de reiniciar a organização.');
 if(w.session?.state.phase==='buy')throw new Error('Conclua ou preserve a partida anterior antes de iniciar um novo ciclo.');
 validateDraft(w.draft);if(!id)throw new Error('Identificação de ciclo obrigatória.');
 const prior=initializeHistory(w),career={version:1 as const,id,seed,day:1,roster:[...w.draft.selected],days:[],fixtures:fixtureSchedule(),agendaCompleted:false};
 const next=normalizedWorkspace({...prior,career,draft:{...w.draft,map:'doca-v2'},session:null,development:newDevelopment(),previous:undefined,buyPreparation:undefined,trainingPreparation:undefined});validateCareer(next);return next;
}
/** New competitive campaigns begin fresh; old calendar saves are never charged retroactively. */
export function startCircuitCareer(w:Workspace,id:string,seed=randomSeed()):Workspace {
 const next=startCareerBase(w,id,seed),c=next.career!;c.version=2;c.circuit=newCircuit(id,seed,c.roster);validateCareer(next);return next;
}
export function advancePreview(w:Workspace,mode:'day'|'event'){
 if(!w.career)throw new Error('Inicie o calendário.');validateCareer(w);
 const c=w.career;if(c.agendaCompleted||c.day>=28)throw new Error('O calendário chegou ao dia 28.');
 if(w.session?.state.phase==='buy')throw new Error('Conclua a partida ativa antes de avançar.');
 if(currentFixture(c))throw new Error('Dispute o confronto de hoje antes de avançar.');
 if(pendingNpc(c))throw new Error('Conclua o processamento dos jogos da rodada antes de avançar.');
 const event=nextFixture(c),target=Math.min(mode==='day'?c.day+1:event?.day??28,event?.day??28);
 return {target,lost:target-c.day-(dayClosed(c)?1:0)};
}
export function advanceCareer(w:Workspace,mode:'day'|'event'):Workspace{
 const {target}=advancePreview(w,mode),next=structuredClone(w),c=next.career!;
 if(next.session){next.previous=next.session;next.session=null;}
 for(let day=c.day;day<target;day++)if(!c.days.some(d=>d.day===day))c.days.push({day,status:'forfeited'});
 c.day=target;next.draft.map=nextFixture(c)?.map??next.draft.map;next.development=careerDevelopment(c,null);delete next.trainingPreparation;delete next.buyPreparation;
 if(c.circuit)c.circuit.finance=clubFinance(c.roster,c.day-1,undefined,c.circuit.sponsor,c.circuit.staff?.hire);
 validateCareer(next);return next;
}
export function trainCareer(w:Workspace,choice:TrainingChoice):Workspace{
 validateCareer(w);const c=w.career;if(!c||c.agendaCompleted||w.session||dayClosed(c))throw new Error('A oportunidade de hoje está encerrada.');
 const trained=previewTraining(w.development??newDevelopment(),c.roster,choice),next=structuredClone(w);
 next.career!.days.push({day:c.day,status:'trained',receipt:{choice:structuredClone(choice),gains:trained.gains}});next.development=trained.development;delete next.trainingPreparation;validateCareer(next);return next;
}
export function skipCareerTraining(w:Workspace):Workspace{
 validateCareer(w);const c=w.career;if(!c||c.agendaCompleted||w.session||dayClosed(c))throw new Error('A oportunidade de hoje está encerrada.');
 const next=structuredClone(w);next.career!.days.push({day:c.day,status:'skipped'});next.development=careerDevelopment(next.career!,null);delete next.trainingPreparation;validateCareer(next);return next;
}
export function startCareerMatch(w:Workspace):Workspace{
 validateCareer(w);if(!w.career||w.session)throw new Error('Conclua a partida atual antes de iniciar outra.');
 const f=currentFixture(w.career);if(!f||f.sessionId)throw new Error('Não há confronto disponível hoje.');
 const next=structuredClone(initializeHistory(w)),c=next.career!;
 if(c.version===1&&next.history!.length>=HISTORY_LIMIT)throw new Error('Exporte e libere uma vaga no histórico antes de iniciar o confronto.');
 const fixture=currentFixture(c)!,index=c.fixtures.indexOf(fixture),matchId=`${c.id}:jogo:${index+1}`,seed=matchSeed(c.id,c.seed,matchId);
 next.draft.map=fixture.map;next.draft.seed=seed;
 const id=matchId,s=createSession(next.draft,id,next.development),opponent=opponentFor(fixture.opponentId);
 s.profiles=[...s.profiles.filter(p=>p.team==='A'),...opponentProfiles(opponent.id)];
 for(const key of Object.keys(s.names))if(key.startsWith('B:'))delete s.names[key];for(const p of opponent.players)s.names[`B:${p.id}`]=p.name;
 const accounts=(t:'A'|'B')=>s.profiles.filter(p=>p.team===t).map(p=>({id:p.id,credits:1000,weapon:p.weapon,shield:0,charges:p.charges,ult:0}));
 s.state=createMap(accounts('A'),accounts('B'),fixture.initialAttack,3);
 s.metadata={startedAt:new Date().toISOString(),organization:next.draft.org,opponent:next.draft.opponent,careerId:c.id,careerDay:c.day,opponentId:opponent.id};
 fixture.sessionId=id;next.session=s;
 if(!dayClosed(c))c.days.push({day:c.day,status:'match'});next.development=careerDevelopment(c,s);delete next.trainingPreparation;delete next.buyPreparation;validateCareer(next);return next;
}
/** Commit a result once; repeated checkpoints cannot replay or duplicate a fixture. */
export function acceptCareerResult(w:Workspace,session:Session):Workspace{
 if(!w.career||w.session?.id!==session.id)throw new Error('Resultado não corresponde ao confronto ativo.');
 const next=structuredClone(w);next.session=session;const c=next.career!,f=c.fixtures.find(f=>f.sessionId===session.id)!;
 if(session.state.phase==='finished'){
  const result={score:structuredClone(session.state.score),winner:session.state.winner,seed:session.seed,rounds:session.state.rounds};
  if(f.result&&JSON.stringify(f.result)!==JSON.stringify(result))throw new Error('Confronto já possui outro resultado.');f.result=result;
  if(c.circuit){const match=c.circuit.matches.find(m=>m.id===session.id)!;const result=circuitResult(session);if(match.result&&JSON.stringify(match.result)!==JSON.stringify(result))throw new Error('Resultado do circuito já registrado.');match.result=result;finishCircuit(c);}else c.agendaCompleted=c.day===28&&c.fixtures.every(f=>!!f.result);
 }
 next.development=careerDevelopment(c,session);validateCareer(next);return c.circuit&&next.history&&next.history.length>=HISTORY_LIMIT&&!next.history.some(s=>s.id===session.id)?next:archiveResult(next);
}
export function releaseCareerMatch(w:Workspace):Workspace{
 validateCareer(w);if(!w.career||!w.session||w.session.state.phase!=='finished')throw new Error('Conclua o confronto atual.');
 const next=normalizedWorkspace({...w,previous:w.session,session:null,buyPreparation:undefined,trainingPreparation:undefined});next.development=careerDevelopment(next.career!,null);validateCareer(next);return next;
}

export const startCareer=startCircuitCareer;
