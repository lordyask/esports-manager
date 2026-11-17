import type {Workspace,Session} from './game.ts';
import {newDevelopment,previewTraining,growthFor} from './development.ts';
import type {TrainingChoice,TrainingGain} from './development.ts';
import {integer} from '../src/rules.ts';
import {opponentProfiles,OPPONENTS} from './opponents.ts';
import {validateCircuit} from './circuit-state.ts';
import type {Circuit} from './circuit-state.ts';
import {payroll} from './club-finance.ts';

export interface CareerDay {day:number;status:'trained'|'skipped'|'forfeited'|'match';receipt?:{choice:TrainingChoice;gains:TrainingGain[]};}
export interface CareerFixture {day:number;map:'doca-v2';opponentId:string;initialAttack:'A'|'B';sessionId:string|null;result?:{score:{A:number;B:number};winner:'A'|'B'|null;seed:number;rounds:number};}
export interface Career {version:1|2;circuit?:Circuit;id:string;seed:number;day:number;roster:string[];days:CareerDay[];fixtures:CareerFixture[];agendaCompleted:boolean;}
export const fixtureSchedule=():CareerFixture[]=>OPPONENTS.map((team,i)=>({day:(i+1)*4,map:'doca-v2' as const,opponentId:team.id,initialAttack:i%2?'B':'A',sessionId:null}));
export const currentFixture=(c:Career)=>c.fixtures.find(f=>f.day===c.day&&!f.result);
export const nextFixture=(c:Career)=>c.fixtures.find(f=>!f.result);
export const dayClosed=(c:Career)=>c.days.some(d=>d.day===c.day);

/** Reconstruct only training/accounting state, never replay combat or draw randomness. */
export function careerDevelopment(c:Career,session:Session|null){
 let dev=newDevelopment();
 for(const day of c.days){
  if(day.status==='trained'){
   if(!day.receipt)throw new Error('Comprovante diário ausente.');
   dev.used=false;delete dev.receipt;dev.matchId=null;
   const trained=previewTraining(dev,c.roster,day.receipt.choice);
   if(JSON.stringify(trained.gains)!==JSON.stringify(day.receipt.gains))throw new Error('Evolução diária não corresponde ao treino registrado.');
   dev=trained.development;
  }else if(day.receipt)throw new Error('Dia sem treino contém evolução.');
 }
 dev.used=dayClosed(c);dev.matchId=session?.id??null;dev.completed=c.fixtures.filter(f=>f.result).length;
 const today=c.days.find(d=>d.day===c.day);if(today?.receipt)dev.receipt=structuredClone(today.receipt);else delete dev.receipt;
 return dev;
}
export function validateCareer(w:Workspace){
 const c=w.career;if(!c)return;
 if(![1,2].includes(c.version)||(c.version===2)!==!!c.circuit||typeof c.id!=='string'||!c.id||typeof c.agendaCompleted!=='boolean'||!Array.isArray(c.roster)||c.roster.length!==5||JSON.stringify(c.roster)!==JSON.stringify(w.draft.selected)||!Array.isArray(c.days)||!Array.isArray(c.fixtures)||c.fixtures.length!==7)throw new Error('Calendário salvo inválido.');
 integer(c.seed,1,0xffffffff,'campaign seed');integer(c.day,1,28,'campaign day');
 if(new Set(c.roster).size!==5||payroll(c.roster)>12000)throw new Error('Elenco contratado inválido.');
 if(c.days.length!==c.day-1+(dayClosed(c)?1:0)||c.days.some((d,i)=>d.day!==i+1||!['trained','skipped','forfeited','match'].includes(d.status)))throw new Error('Oportunidades diárias inconsistentes.');
 const expected=fixtureSchedule();
 for(let i=0;i<7;i++){
  const f=c.fixtures[i],e=expected[i];
  if(!f||f.day!==e.day||f.map!==e.map||f.opponentId!==e.opponentId||f.initialAttack!==e.initialAttack||f.sessionId!==null&&(typeof f.sessionId!=='string'||!f.sessionId)||f.day<c.day&&!f.result||f.day>c.day&&(f.sessionId!==null||f.result))throw new Error('Agenda de partidas inconsistente.');
  if(f.sessionId&&!f.result&&w.session?.id!==f.sessionId)throw new Error('Confronto iniciado sem checkpoint ativo.');
  if(f.result){
   if(!f.sessionId||f.day>c.day)throw new Error('Resultado fora do calendário.');
   integer(f.result.rounds,13,30,'fixture rounds');integer(f.result.seed,1,0xffffffff,'fixture seed');
   integer(f.result.score.A,0,30,'fixture score');integer(f.result.score.B,0,30,'fixture score');
   if(f.result.score.A+f.result.score.B!==f.result.rounds||!['A','B',null].includes(f.result.winner))throw new Error('Resultado de calendário inválido.');
  }
 }
 const ids=c.fixtures.map(f=>f.sessionId).filter(Boolean);if(new Set(ids).size!==ids.length)throw new Error('Partida duplicada no calendário.');
 if(c.version===1&&c.agendaCompleted!==(c.day===28&&c.fixtures.every(f=>!!f.result)))throw new Error('Encerramento da agenda inconsistente.');
 if(c.version===2)validateCircuit(c);
 if(w.session){
  const f=c.fixtures.find(f=>f.sessionId===w.session!.id);
  if(!f||f.day!==c.day||f.map!==w.session.map||w.session.state.initialAttack!==f.initialAttack||!dayClosed(c)||w.session.metadata?.careerId!==c.id||w.session.metadata?.careerDay!==c.day||w.session.metadata?.opponentId!==f.opponentId)throw new Error('Partida não corresponde ao calendário.');
  if((w.session.state.phase==='finished')!==!!f.result||f.result&&(JSON.stringify(f.result.score)!==JSON.stringify(w.session.state.score)||f.result.seed!==w.session.seed||f.result.winner!==w.session.state.winner||f.result.rounds!==w.session.state.rounds))throw new Error('Resultado e partida divergem.');
  if(c.circuit&&w.session.seed!==c.circuit.matches.find(m=>m.id===w.session!.id)?.seed)throw new Error('Semente do confronto alterada.');
  const actual=w.session.profiles.filter(p=>p.team==='B'),base=opponentProfiles(f.opponentId);
  for(const p of base){const a=actual.find(a=>a.id===p.id);if(!a||JSON.stringify(a)!==JSON.stringify(p))throw new Error('Perfil adversário alterado: este beta utiliza equipes fixas.');}
  for(const p of w.session.profiles.filter(p=>p.team==='A')){const g=growthFor(w.development,p.id.slice(2));if(JSON.stringify(p.attrs)!==JSON.stringify(g.attrs)||p.agentFamiliarity!==g.familiarities[p.agent])throw new Error('Elenco da partida não corresponde ao desenvolvimento diário.');}
 }
 if(!w.development)throw new Error('Desenvolvimento de calendário ausente.');
 const reconstructed=careerDevelopment(c,w.session);
 if(w.development.used!==reconstructed.used||w.development.matchId!==reconstructed.matchId||w.development.completed!==reconstructed.completed||JSON.stringify(w.development.receipt)!==JSON.stringify(reconstructed.receipt))throw new Error('Disponibilidade de treino inconsistente.');
 for(const id of c.roster)if(JSON.stringify(growthFor(w.development,id))!==JSON.stringify(growthFor(reconstructed,id)))throw new Error('Evolução fora das oportunidades do calendário.');
 if(Object.keys(w.development.players).some(id=>!c.roster.includes(id)))throw new Error('Treino fora do elenco contratado.');
}
