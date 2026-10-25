import rawCatalog from '../data/catalog.json' with {type:'json'};
import {AGENTS} from '../src/abilities.ts';
import type {Agent} from '../src/abilities.ts';
import type {Attributes,MapId,Team} from '../src/rules.ts';
import {ENGINE_VERSION,RULES_VERSION,integer} from '../src/rules.ts';
import {beginRound,completeRound,createMap,attackingTeam} from '../src/map.ts';
import type {MapState} from '../src/map.ts';
import {economicPlan} from '../src/autonomous.ts';
import {simulateRound} from '../src/simulation.ts';
import type {Profile,SimulationResult,TeamPlan} from '../src/tactical-types.ts';
import type {Plan,BuyPlan,Purchase} from '../src/economy.ts';
import {halfReset,validateAccount} from '../src/economy.ts';
import {sha256} from '../src/hash.ts';
import {validateStrategy} from '../src/strategies.ts';
import {newDevelopment,growthFor,validateDevelopment} from './development.ts';
import type {Development} from './development.ts';
export {AGENTS,ENGINE_VERSION,RULES_VERSION};
export const PLAYERS=rawCatalog.players;
export function newId(){const values=new Uint32Array(4);globalThis.crypto.getRandomValues(values);return Array.from(values,n=>n.toString(16).padStart(8,'0')).join('');}
export const ROLES=['Entry','Second','Support','Anchor','Lurker','Main OP'] as const;
export const ROLE_NAMES:Record<string,string>={Entry:'Entry Fragger',Second:'Second Entry',Support:'Support',Anchor:'Anchor',Lurker:'Lurker','Main OP':'Main OP'};
export const ATTRS=['Mira','Movimentação','Posicionamento','Leitura','Utilitários','Comunicação','Disciplina','Controle emocional'];
export const MAP_NAMES={patio:'Pátio',horizonte:'Horizonte',enlace:'Enlace'};
export const CLASS:Record<string,string>={Estalo:'Duelista','Ímpeto':'Duelista',Farol:'Iniciador',Pulso:'Iniciador',Bruma:'Controlador','Véu':'Controlador',Trava:'Sentinela','Bastião':'Sentinela'};
export const PLAN_NAMES:Record<Plan,string>={eco:'Eco',semi:'Semi',full:'Forte'};
export type Role=typeof ROLES[number];
export type Player=typeof PLAYERS[number];
export interface Assignment {agent:Agent;role:Role;}
export interface Draft {org:string;tag:string;color:string;crest:number;selected:string[];assignments:Record<string,Assignment>;igl:string;map:MapId;opponent:'development'|'balanced'|'experienced';seed:number;plan:TeamPlan;}
export interface RoundRecord {command:RoundCommand;seed:number;result:SimulationResult;purchases:Record<Team,Purchase[]>;}
export interface Session {id:string;map:MapId;seed:number;profiles:Profile[];names:Record<string,string>;state:MapState;records:RoundRecord[];}
export interface RoundCommand {id:string;revision:number;plans:Record<Team,TeamPlan>;buys:BuyPlan;}
export interface Workspace {draft:Draft;session:Session|null;development?:Development;buyPreparation?:Record<string,Plan>;previous?:Session;legacyReport?:{engine:string;session:Session};}
export function defaultDraft():Draft{return {org:'Minha organização',tag:'ORG',color:'#62e5ba',crest:0,selected:[],assignments:{},igl:'',map:'patio',opponent:'balanced',seed:20261021,plan:{attack:'fast',defense:'balanced',site:'A'}};}
export const salary=(d:Draft)=>d.selected.reduce((s,id)=>s+(PLAYERS.find(p=>p.id===id)?.salary??0),0);
export const familiarity=(p:Player,agent:string)=>agent===p.main?85:agent===p.second?65:agent===p.third?45:10;
export function validateDraft(d:Draft){
 if(!d||typeof d.org!=='string'||!d.org.trim()||d.org.length>40||typeof d.tag!=='string'||!d.tag.trim()||d.tag.length>5||!/^#[0-9a-f]{6}$/i.test(d.color)||!Number.isInteger(d.crest)||d.crest<0||d.crest>2)throw new Error('Revise nome, sigla e identidade da organização.');
 if(d.selected.length!==5||new Set(d.selected).size!==5||d.selected.some(id=>!PLAYERS.some(p=>p.id===id))||salary(d)>12000)throw new Error('Escolha cinco jogadores com salário total de até 12.000.');
 if(!d.selected.includes(d.igl))throw new Error('Defina um IGL entre os cinco titulares.');
 const assignments=d.selected.map(id=>d.assignments[id]);
 if(assignments.some(a=>!a||!AGENTS.includes(a.agent)||!ROLES.includes(a.role))||new Set(assignments.map(a=>a.agent)).size!==5)throw new Error('Escolha cinco agentes diferentes e uma responsabilidade para cada jogador.');
 if(!['patio','horizonte','enlace'].includes(d.map)||!['development','balanced','experienced'].includes(d.opponent))throw new Error('Cenário de teste inválido.');
 integer(d.seed,1,0xffffffff,'seed');validatePlan(d.plan);
}
export const validatePlan=validateStrategy;
export function suggestAssignments(d:Draft,development?:Development):Draft {
 const next=structuredClone(d),used=new Set<Agent>();
 for(const id of next.selected){const p=PLAYERS.find(p=>p.id===id)!;const familiarities=growthFor(development,id).familiarities;const agent=[...AGENTS].sort((a,b)=>familiarities[b]-familiarities[a]).find(a=>!used.has(a))!;used.add(agent);next.assignments[id]={agent,role:(ROLES.includes(p.style as Role)?p.style:'Support') as Role};}
 const iglScore=(id:string)=>{const a=growthFor(development,id).attrs;return a[3]*.35+a[5]*.30+a[6]*.20+a[7]*.15;};next.igl=[...next.selected].sort((a,b)=>iglScore(b)-iglScore(a))[0]??'';return next;
}
export function createSession(d:Draft,id:string,development?:Development):Session {
 validateDraft(d);if(!id)throw new Error('Identificador de partida obrigatório.');
 const names:Record<string,string>={};
 const own=d.selected.map(id=>{const p=PLAYERS.find(p=>p.id===id)!,a=d.assignments[id],pid=`A:${id}`;names[pid]=p.name;
 const growth=growthFor(development,id);return {id:pid,team:'A' as const,agent:a.agent,role:a.role,attrs:growth.attrs,agentFamiliarity:growth.familiarities[a.agent],mapFamiliarity:50,morale:70,fatigue:10,weapon:a.role==='Main OP'?'precision' as const:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0,igl:id===d.igl};});
 const level={development:45,balanced:60,experienced:75}[d.opponent];
 const agents:Agent[]=['Estalo','Farol','Bruma','Trava','Bastião'];
 const opponents=agents.map((agent,i)=>{const id=`B:${i}`;names[id]=`Teste ${i+1}`;return {id,team:'B' as const,agent,role:(['Entry','Support','Support','Main OP','Anchor'] as const)[i],attrs:Array(8).fill(level) as Attributes,agentFamiliarity:85,mapFamiliarity:50,morale:70,fatigue:10,weapon:i===3?'precision' as const:'basic' as const,shield:0,charges:[false,false,false] as [boolean,boolean,boolean],ult:0,igl:i===1};});
 const profiles=[...own,...opponents],accounts=(t:Team)=>profiles.filter(p=>p.team===t).map(p=>({id:p.id,credits:1000,weapon:p.weapon,shield:p.shield,charges:p.charges,ult:p.ult}));
 return {id,map:d.map,seed:d.seed,profiles,names,state:createMap(accounts('A'),accounts('B')),records:[]};
}
export function automaticBuys(s:Session):Plan {return s.state.rounds===12?'eco':economicPlan(s.state.teams.A);}
export function previewRound(s:Session,buys:BuyPlan){
 const precision={A:s.profiles.filter(p=>p.team==='A'&&p.weapon==='precision').map(p=>p.id),B:s.profiles.filter(p=>p.team==='B'&&p.weapon==='precision').map(p=>p.id)};
 return beginRound(s.state,buys,s.state.rounds===12?'eco':economicPlan(s.state.teams.B),{precision});
}
export function spendable(s:Session){return s.state.rounds===12?s.state.teams.A.map(halfReset):s.state.teams.A;}
export function advanceSession(input:Session,command:RoundCommand):Session {
 validateSession(input);validatePlan(command.plans.A);validatePlan(command.plans.B);
 if(!command.id)throw new Error('Comando sem identificação.');
 const prior=input.records.find(r=>r.command.id===command.id);
 if(prior){if(sha256(JSON.stringify(prior.command))!==sha256(JSON.stringify(command)))throw new Error('Comando repetido com conteúdo diferente.');return structuredClone(input);}
 if(command.revision!==input.state.rounds)throw new Error('A partida avançou em outra operação. Recarregue o progresso.');
 if(input.state.phase!=='buy')throw new Error('Esta partida já terminou.');
 const ready=previewRound(input,command.buys);
 const ps=input.profiles.map(p=>{const a=ready.state.teams[p.team].find(a=>a.id===p.id)!;return {...p,weapon:a.weapon,shield:a.shield,charges:a.charges,ult:a.ult};});
 const seed=((input.seed+Math.imul(input.state.rounds+1,0x9e3779b9))>>>0)||1;
 const result=simulateRound(ps,{map:input.map,attacking:ready.attacking,seed,plans:command.plans});
 return {...input,state:completeRound(ready.state,result,result.kills),records:[...input.records,{command:structuredClone(command),seed,result,purchases:ready.purchases}]};
}
export function validateSession(s:Session){
 if(!s||typeof s.id!=='string'||!s.id||!['patio','horizonte','enlace'].includes(s.map)||!Array.isArray(s.records)||s.records.length!==s.state?.rounds||!['buy','finished'].includes(s.state.phase))throw new Error('Progresso de partida inválido.');
 integer(s.seed,1,0xffffffff,'seed');
 if(!Array.isArray(s.profiles)||s.profiles.length!==10||new Set(s.profiles.map(p=>p.id)).size!==10)throw new Error('Elenco salvo inválido.');
 for(const team of ['A','B'] as const){if(s.state.teams[team].length!==5||s.profiles.filter(p=>p.team===team).length!==5)throw new Error('Equipe salva inválida.');s.state.teams[team].forEach(validateAccount);integer(s.state.score[team],0,s.records.length,'score');}
 if(s.state.score.A+s.state.score.B!==s.records.length)throw new Error('Placar salvo inconsistente.');
 const ids=s.profiles.map(p=>p.id).sort();if(JSON.stringify([...s.state.teams.A,...s.state.teams.B].map(p=>p.id).sort())!==JSON.stringify(ids))throw new Error('IDs salvos inconsistentes.');
 for(const p of s.profiles){if(!AGENTS.includes(p.agent)||p.attrs.length!==8||p.attrs.some(v=>!Number.isFinite(v)||v<1||v>100)||[p.agentFamiliarity,p.mapFamiliarity,p.morale,p.fatigue].some(v=>!Number.isFinite(v)||v<0||v>100)||typeof s.names[p.id]!=='string')throw new Error('Perfil salvo inválido.');}
 if(!['A','B'].includes(s.state.initialAttack)||['A','B'].some(t=>new Set(s.profiles.filter(p=>p.team===t).map(p=>p.agent)).size!==5))throw new Error('Composição salva inválida.');
 const score={A:0,B:0},commands=new Set<string>();
 for(let i=0;i<s.records.length;i++){
  const r=s.records[i];
  if(!r?.command?.id||commands.has(r.command.id)||r.command.revision!==i||!r.result||!['A','B'].includes(r.result.winner)||!Array.isArray(r.result.events)||!Array.isArray(r.result.actors)||r.result.actors.length!==10||JSON.stringify(r.result.actors.map(a=>a.id).sort())!==JSON.stringify(ids))throw new Error('Histórico salvo inválido.');
  commands.add(r.command.id);validatePlan(r.command.plans.A);validatePlan(r.command.plans.B);score[r.result.winner]++;
  integer(r.result.at,0,140001,'round time');
  for(const a of r.result.actors){integer(a.vital.life,0,10000,'life');integer(a.vital.shield,0,5000,'shield');}
  for(const team of ['A','B'] as const)if(!Array.isArray(r.purchases?.[team])||r.purchases[team].some(p=>!ids.includes(p.from)||!ids.includes(p.to)||!Number.isSafeInteger(p.cost)||p.cost<0))throw new Error('Compras salvas inválidas.');
 }
 if(score.A!==s.state.score.A||score.B!==s.state.score.B)throw new Error('Histórico e placar não correspondem.');
 if(s.state.phase==='finished'&&!['A','B'].includes(s.state.winner??''))throw new Error('Vencedor salvo inválido.');
}
export function normalizedWorkspace(data:Workspace):Workspace {const out={...data,development:data.development??{...newDevelopment(),used:!!data.session,matchId:data.session?.id??null}};for(const k of Object.keys(out) as (keyof Workspace)[])if(out[k]===undefined)delete out[k];return out;}
export function freshWorkspace():Workspace{return {draft:defaultDraft(),session:null,development:newDevelopment()};}
export function encodeSave(input:Workspace):string {
 const data=normalizedWorkspace(input),payload=JSON.stringify(data);
 return JSON.stringify({format:'esports-manager-beta',schema:2,beta:'1.1.0',engine:ENGINE_VERSION,rules:RULES_VERSION,digest:sha256(payload),data});
}
export function decodeSave(text:string):Workspace {
 if(text.length>20*1024*1024)throw new Error('Arquivo maior que o limite de 20 MB.');
 let e:any;try{e=JSON.parse(text);}catch{throw new Error('O arquivo não contém um salvamento JSON válido.');}
 if(e?.format!=='esports-manager-beta'||e.schema!==2||e.engine!==ENGINE_VERSION||e.rules!==RULES_VERSION)throw new Error('Versão incompatível. Preserve o arquivo original para uma futura migração.');
 if(e.digest!==sha256(JSON.stringify(e.data)))throw new Error('O arquivo está incompleto ou foi modificado.');
 const w=e.data as Workspace;
 if(!w?.draft||!Array.isArray(w.draft.selected)||w.draft.selected.length>5||new Set(w.draft.selected).size!==w.draft.selected.length||w.draft.selected.some(id=>!PLAYERS.some(p=>p.id===id))||typeof w.draft.org!=='string'||w.draft.org.length>40||typeof w.draft.tag!=='string'||w.draft.tag.length>5||typeof w.draft.igl!=='string'||!w.draft.assignments||typeof w.draft.assignments!=='object'||!/^#[0-9a-f]{6}$/i.test(w.draft.color)||![0,1,2].includes(w.draft.crest)||!['patio','horizonte','enlace'].includes(w.draft.map)||!['development','balanced','experienced'].includes(w.draft.opponent))throw new Error('Configuração salva inválida.');
 integer(w.draft.seed,1,0xffffffff,'seed');validatePlan(w.draft.plan);
 for(const a of Object.values(w.draft.assignments))if(!a||!AGENTS.includes(a.agent)||!ROLES.includes(a.role))throw new Error('Escalação salva inválida.');
 if(w.session){validateDraft(w.draft);validateSession(w.session);}
 if(!w.development)throw new Error('Registro de desenvolvimento ausente.');validateDevelopment(w.development);
 if(w.session&&w.development.matchId!==w.session.id)throw new Error('Preparação e partida não correspondem.');
 if(w.buyPreparation&&Object.entries(w.buyPreparation).some(([id,p])=>!w.session?.profiles.some(a=>a.id===id&&a.team==='A')||!['eco','semi','full'].includes(p)))throw new Error('Preparação de compra inválida.');
 if(w.previous)validateSession(w.previous);
 if(w.legacyReport){if(w.legacyReport.engine!=='0.3.0')throw new Error('Relatório histórico incompatível.');validateSession(w.legacyReport.session);}
 return structuredClone(w);
}
export function stats(s:Session){
 const rows=s.profiles.map(p=>({id:p.id,team:p.team,name:s.names[p.id],agent:p.agent,kills:0,deaths:0,firstKills:0,firstDeaths:0,trades:0,utility:0,plants:0,defuses:0,spent:0}));
 const byId=Object.fromEntries(rows.map(p=>[p.id,p]));
 for(const round of s.records){
  const deaths=round.result.events.filter(e=>e.kind==='eliminated');
  for(let i=0;i<deaths.length;i++){const e=deaths[i],victim=byId[e.actor!],killer=byId[e.target!];if(victim)victim.deaths++;if(killer){killer.kills++;if(i===0)killer.firstKills++;}if(i===0&&victim)victim.firstDeaths++;
   if(killer&&deaths.slice(0,i).some(d=>d.target===e.actor&&byId[d.actor!]?.team===killer.team&&e.at-d.at<=5000))killer.trades++;
  }
  for(const e of round.result.events){const p=byId[e.actor!];if(!p)continue;if(e.kind==='cast_complete')p.utility++;if(e.kind==='planted')p.plants++;if(e.kind==='defused')p.defuses++;}
  for(const buys of Object.values(round.purchases))for(const p of buys)if(byId[p.from])byId[p.from].spent+=p.cost;
 }
 return rows;
}
export function nextSide(s:Session){return attackingTeam(s.state)==='A'?'Ataque':'Defesa';}

export function beginMatch(w:Workspace,id:string):Workspace {
 const dev=structuredClone(w.development??newDevelopment());
 if(w.session||dev.matchId)throw new Error('Conclua a partida atual e escolha Nova partida.');
 if(!dev.used)throw new Error('Confirme ou pule o treino antes da partida.');
 const session=createSession(w.draft,id,dev);dev.matchId=id;return {...w,session,development:dev};
}
export function nextMatch(w:Workspace):Workspace {
 if(!w.session||w.session.state.phase!=='finished')throw new Error('Conclua a partida atual antes de preparar outra.');
 const dev=structuredClone(w.development??newDevelopment());dev.used=false;dev.matchId=null;dev.completed++;delete dev.receipt;
 return normalizedWorkspace({...w,previous:structuredClone(w.session),session:null,development:dev,buyPreparation:undefined});
}
/** Explicit import; old results remain a read-only snapshot, never simulated by new rules. */
export function prepareImport(text:string):{data:Workspace;notice:string}{
 let e:any;try{e=JSON.parse(text);}catch{throw new Error('O arquivo não contém um salvamento JSON válido.');}
 if(e?.engine===ENGINE_VERSION)return {data:decodeSave(text),notice:'Salvamento Beta 1.1. O progresso atual será substituído.'};
 if(text.length>20*1024*1024||e?.format!=='esports-manager-beta'||e.engine!=='0.3.0'||e.schema!==1||e.rules!==RULES_VERSION)throw new Error('Versão incompatível. Preserve o arquivo original.');
 if(e.digest!==sha256(JSON.stringify(e.data)))throw new Error('O arquivo está incompleto ou foi modificado.');
 const old=e.data as Workspace;const next=normalizedWorkspace({...old,session:null,development:newDevelopment(),buyPreparation:undefined,previous:undefined,legacyReport:undefined});
 // Validate configuration through the new format before trusting imported fields.
 decodeSave(encodeSave(next));
 if(old.session){validateDraft(old.draft);validateSession(old.session);next.legacyReport={engine:'0.3.0',session:structuredClone(old.session)};}
 return {data:next,notice:old.session?.state.phase==='buy'?'Partida Beta 1.0 em andamento: não continuará no novo motor. Importe só a organização, com XP zero, e preserve o arquivo original para concluir no Beta 1.0.':'Importar organização do Beta 1.0 com XP zero. O relatório antigo será preservado para consulta; não será recalculado.'};
}
