import type {Session,Workspace} from './game.ts';
import {validateSession,stats} from './game.ts';
import {sha256} from '../src/hash.ts';
import {ENGINE_VERSION,RULES_VERSION} from '../src/rules.ts';
import {attackingTeam} from '../src/map.ts';
export const HISTORY_LIMIT=20;
export const SAVE_LIMIT=64*1024*1024;
export interface MatchMetadata {startedAt:string;finishedAt?:string;organization:string;opponent:'development'|'balanced'|'experienced';}
export function validateMetadata(m:MatchMetadata){
 if(!m||typeof m.organization!=='string'||m.organization.length>40||!['development','balanced','experienced'].includes(m.opponent)||typeof m.startedAt!=='string'||!Number.isFinite(Date.parse(m.startedAt))||m.finishedAt!==undefined&&(typeof m.finishedAt!=='string'||!Number.isFinite(Date.parse(m.finishedAt))||Date.parse(m.finishedAt)<Date.parse(m.startedAt)))throw new Error('Identificação histórica inválida.');
}
export function validateHistory(history:Session[]){
 if(!Array.isArray(history)||history.length>HISTORY_LIMIT||new Set(history.map(s=>s?.id)).size!==history.length)throw new Error('Histórico inválido ou acima de 20 partidas.');
 for(const s of history){validateSession(s);if(s.state.phase!=='finished')throw new Error('Histórico aceita apenas partidas concluídas.');}
}
export function addHistory(history:Session[],s:Session):Session[]{
 validateHistory(history);validateSession(s);
 if(s.state.phase!=='finished')return history;
 const existing=history.find(x=>x.id===s.id);
 if(existing){if(sha256(JSON.stringify(existing))!==sha256(JSON.stringify(s)))throw new Error('Duas partidas diferentes usam o mesmo identificador.');return history;}
 if(history.length>=HISTORY_LIMIT)throw new Error('Histórico cheio (20 partidas). Exporte e exclua uma partida antes de continuar.');
 return [...history,structuredClone(s)];
}
/** One-time migration; an explicitly deleted entry is never silently recreated. */
export function initializeHistory(w:Workspace):Workspace {
 if(w.history!==undefined)return w;
 let history:Session[]=[];
 for(const s of [w.previous,w.session])if(s?.state.phase==='finished')history=addHistory(history,s);
 return {...w,history};
}
export function archiveResult(w:Workspace):Workspace {
 const next=initializeHistory(w);return w.session?.state.phase==='finished'?{...next,history:addHistory(next.history!,w.session)}:next;
}
export function deleteHistory(w:Workspace,id:string):Workspace {
 const next=initializeHistory(w);
 return {...next,history:next.history!.filter(s=>s.id!==id),...(next.previous?.id===id?{previous:undefined}:{})};
}
export function difficultyLabel(s:Session){
 const labels={development:'Desenvolvimento',balanced:'Referência (médio)',experienced:'Experiente'};
 if(s.metadata)return labels[s.metadata.opponent];
 const enemy=s.profiles.filter(p=>p.team==='B');
 for(const [level,name] of [[45,labels.development],[60,labels.balanced],[75,labels.experienced]] as const)if(enemy.length===5&&enemy.every(p=>p.attrs.every(a=>a===level)))return name+' · inferido dos atributos';
 return 'Não registrada';
}
export function historyJSON(sessions:Session[]):string {
 validateHistory(sessions);const data=structuredClone(sessions);
 return JSON.stringify({format:'esports-manager-history',schema:1,engine:ENGINE_VERSION,rules:RULES_VERSION,digest:sha256(JSON.stringify(data)),data});
}
export function readHistory(text:string):Session[]{
 if(new TextEncoder().encode(text).length>SAVE_LIMIT)throw new Error('Arquivo maior que 64 MB.');
 let e:any;try{e=JSON.parse(text);}catch{throw new Error('Histórico JSON inválido.');}
 if(e?.format!=='esports-manager-history'||e.schema!==1||e.engine!==ENGINE_VERSION||e.rules!==RULES_VERSION||e.digest!==sha256(JSON.stringify(e.data)))throw new Error('Histórico incompatível ou incompleto.');
 validateHistory(e.data);return e.data;
}
export function mergeHistory(w:Workspace,sessions:Session[]):Workspace {
 validateHistory(sessions);const next=initializeHistory(w);let history=next.history!;
 for(const s of sessions)history=addHistory(history,s);
 if(next.session&&next.session.state.phase!=='finished'&&history.length>=HISTORY_LIMIT)throw new Error('Reserve uma vaga no histórico para a partida em andamento.');
 return {...next,history};
}
const cell=(v:unknown)=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
const csv=(rows:unknown[][])=>'\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
export function playersCSV(sessions:Session[]){return csv([
 ['partida','inicio','fim','dificuldade','cenario','semente','placar_time','placar_rival','jogador_id','nome','equipe','agente','funcao','familiaridade','mira','movimentacao','posicionamento','leitura','utilitarios_atributo','comunicacao','disciplina','emocional','eliminacoes','mortes','primeiras_eliminacoes','primeiras_mortes','trades','utilitarios_usados','plants','desarmes','gasto'],
 ...sessions.flatMap(s=>stats(s).map(row=>{const p=s.profiles.find(p=>p.id===row.id)!;return [s.id,s.metadata?.startedAt,s.metadata?.finishedAt,difficultyLabel(s),s.map,s.seed,s.state.score.A,s.state.score.B,p.id,row.name,p.team,p.agent,p.role,p.agentFamiliarity,...p.attrs,row.kills,row.deaths,row.firstKills,row.firstDeaths,row.trades,row.utility,row.plants,row.defuses,row.spent];}))]);}
export function roundsCSV(sessions:Session[]){return csv([
 ['partida','semente','rodada','lado_time','vencedor','motivo','duracao_ms','ataque_time','defesa_time','ponto_time','complemento_ataque','complemento_defesa','compras_solicitadas_time','compras_realizadas_time','compras_realizadas_rival','gasto_time','gasto_rival'],
 ...sessions.flatMap(s=>s.records.map((r,i)=>[s.id,s.seed,i+1,attackingTeam({...s.state,rounds:i})==='A'?'Ataque':'Defesa',r.result.winner,r.result.reason,r.result.at,r.command.plans.A.attack,r.command.plans.A.defense,r.command.plans.A.site,r.command.plans.A.attackInstruction,r.command.plans.A.defenseInstruction,JSON.stringify(r.command.buys),JSON.stringify(r.purchases.A),JSON.stringify(r.purchases.B),r.purchases.A.reduce((n,p)=>n+p.cost,0),r.purchases.B.reduce((n,p)=>n+p.cost,0)]))]);}
