import {MECHANICS,mechanicsMatch} from '../src/content.ts';
import {validateEquipment} from './equipment.ts';
import type {EquipmentByTeam} from './equipment.ts';
import {OPPONENTS,opponentProfiles} from './opponents.ts';
import {clubFinance} from './club-finance.ts';
import type {ClubFinance,Sponsorship} from './club-finance.ts';
import type {Career} from './career-state.ts';
import type {Profile,TeamPlan} from '../src/tactical-types.ts';
import type {Purchase} from '../src/economy.ts';
import {sha256} from '../src/hash.ts';
import {matchSeed,roundSeed} from '../src/seed.ts';
import {integer} from '../src/rules.ts';
import {clubPlan} from './club-policy.ts';
import {validateStrategy} from '../src/strategies.ts';

export const CLUB_IDS=['user',...OPPONENTS.map(t=>t.id)];
const PAIRS=[
 [['user','pzr'],['crn','frv'],['mra','blt'],['fsk','vrt']],
 [['frv','user'],['pzr','mra'],['crn','vrt'],['blt','fsk']],
 [['user','mra'],['vrt','frv'],['fsk','pzr'],['crn','blt']],
 [['vrt','user'],['mra','fsk'],['frv','blt'],['pzr','crn']],
 [['user','fsk'],['blt','vrt'],['mra','crn'],['frv','pzr']],
 [['blt','user'],['fsk','crn'],['vrt','pzr'],['mra','frv']],
 [['user','crn'],['pzr','blt'],['fsk','frv'],['vrt','mra']],
];
export interface CircuitRound {seed:number;winner:'A'|'B';reason:string;plans:{A:TeamPlan;B:TeamPlan};purchases:{A:Purchase[];B:Purchase[]};equipment:EquipmentByTeam;}
export interface CircuitStat {id:string;team:'A'|'B';name:string;agent:string;kills:number;deaths:number;firstKills:number;firstDeaths:number;trades:number;utility:number;plants:number;defuses:number;spent:number;}
export interface CircuitResult {mechanics:typeof MECHANICS;score:{A:number;B:number};winner:'A'|'B'|null;seed:number;rounds:number;profiles:Profile[];stats:CircuitStat[];receipts:CircuitRound[];}
export interface CircuitMatch {id:string;day:number;map:'doca-v2';a:string;b:string;initialAttack:'A'|'B';seed:number;result?:CircuitResult;}
export interface TieDraw {teams:string[];order:string[];seed:number;}
export interface Circuit {sponsor?:Sponsorship;version:1;matches:CircuitMatch[];draws:TieDraw[];closed:boolean;finance:ClubFinance;}
export function circuitSchedule(id:string,seed:number):CircuitMatch[]{return PAIRS.flatMap((pairs,i)=>pairs.map(([attack,defense],slot)=>{const own=slot===0,matchId=own?`${id}:jogo:${i+1}`:`${id}:npc:${i+1}:${slot}`;return {id:matchId,day:(i+1)*4,map:'doca-v2',a:own?'user':attack,b:own?(attack==='user'?defense:attack):defense,initialAttack:own?(attack==='user'?'A':'B'):'A',seed:matchSeed(id,seed,matchId)};}));}
export function newCircuit(id:string,seed:number,roster:string[]):Circuit{return {version:1,matches:circuitSchedule(id,seed),draws:[],closed:false,finance:clubFinance(roster,0)};}
export const completedDay=(c:Circuit)=>{let day=0;for(const d of [4,8,12,16,20,24,28]){if(c.matches.filter(m=>m.day===d).every(m=>m.result))day=d;else break;}return day;};
export const pendingNpc=(c:Career)=>c.circuit?.matches.find(m=>m.day===c.day&&m.a!=='user'&&!m.result&&c.fixtures.find(f=>f.day===c.day)?.result);
export interface Standing {id:string;played:number;wins:number;drawn:number;lost:number;points:number;won:number;against:number;difference:number;head:number;}
/** Head-to-head is calculated once for the whole group tied on points AND wins. */
export function standings(matches:CircuitMatch[],draws:TieDraw[]=[],through=28):Standing[]{
 const rows=CLUB_IDS.map(id=>({id,played:0,wins:0,drawn:0,lost:0,points:0,won:0,against:0,difference:0,head:0}));const by=Object.fromEntries(rows.map(r=>[r.id,r]));
 const games=matches.filter(m=>m.result&&m.day<=through);
 for(const m of games){const r=m.result!;for(const [id,own,other] of [[m.a,r.score.A,r.score.B],[m.b,r.score.B,r.score.A]] as const){const row=by[id];row.played++;row.won+=own;row.against+=other;row.difference+=own-other;if(own>other){row.wins++;row.points+=3;}else if(own===other){row.drawn++;row.points++;}else row.lost++;}}
 for(const row of rows){const group=rows.filter(r=>r.points===row.points&&r.wins===row.wins).map(r=>r.id);for(const m of games.filter(m=>group.includes(m.a)&&group.includes(m.b)&&(m.a===row.id||m.b===row.id))){const r=m.result!,own=m.a===row.id?r.score.A:r.score.B,other=m.a===row.id?r.score.B:r.score.A;row.head+=own>other?3:own===other?1:0;}}
 const position=(id:string)=>{const d=draws.find(d=>d.teams.includes(id));return d?d.order.indexOf(id):0;};
 return rows.sort((a,b)=>b.points-a.points||b.wins-a.wins||b.head-a.head||b.difference-a.difference||b.won-a.won||position(a.id)-position(b.id)||CLUB_IDS.indexOf(a.id)-CLUB_IDS.indexOf(b.id));
}
export function finalDraws(matches:CircuitMatch[],seed:number):TieDraw[]{
 const groups=new Map<string,string[]>();for(const r of standings(matches)){const key=[r.points,r.wins,r.head,r.difference,r.won].join(':');groups.set(key,[...(groups.get(key)??[]),r.id]);}
 return [...groups.values()].filter(g=>g.length>1).map(teams=>({teams:[...teams].sort(),seed,order:[...teams].sort((a,b)=>sha256(`${seed}:draw:${a}`).localeCompare(sha256(`${seed}:draw:${b}`)))}));
}
export function offersAvailable(c?:Career){return !!c?.circuit&&!c.circuit.closed&&!c.circuit.sponsor&&!!c.fixtures[0]?.result;}
export function signSponsor(c:Career,brand:Sponsorship['brand']):Career {
 if(!offersAvailable(c))throw new Error('Propostas indisponíveis neste circuito.');
 const next=structuredClone(c),x=next.circuit!;x.sponsor={brand,day:c.day};
 x.finance=clubFinance(c.roster,x.finance.closedThrough,undefined,x.sponsor);return next;
}
export function finishCircuit(c:Career){const x=c.circuit;if(!x)return;if(x.matches.every(m=>m.result)){x.draws=finalDraws(x.matches,c.seed);x.closed=true;const place=standings(x.matches,x.draws).findIndex(r=>r.id==='user')+1;x.finance=clubFinance(c.roster,28,place,x.sponsor);c.agendaCompleted=true;}}
export function validateCircuit(c:Career){
 const x=c.circuit;if(!x||x.version!==1||!Array.isArray(x.matches)||x.matches.length!==28||typeof x.closed!=='boolean'||!Array.isArray(x.draws))throw new Error('Circuito salvo inválido.');
 const expected=circuitSchedule(c.id,c.seed);
 for(let i=0;i<28;i++){
  const m=x.matches[i],e=expected[i];if(!m||['id','day','map','a','b','initialAttack','seed'].some(k=>m[k as keyof CircuitMatch]!==e[k as keyof CircuitMatch]))throw new Error('Grade do circuito alterada.');
  if(m.day<c.day&&!m.result||m.day>c.day&&m.result)throw new Error('Resultado fora do dia do circuito.');
  if(!m.result)continue;const r=m.result;if(!mechanicsMatch(r.mechanics))throw new Error('Revisão do resultado incompatível.');
  if(m.a!=='user'&&!c.fixtures.find(f=>f.day===m.day)?.result)throw new Error('Jogo NPC anterior ao confronto do usuário.');
  integer(r.rounds,13,30,'circuit rounds');if(r.seed!==m.seed||!Array.isArray(r.receipts)||r.receipts.length!==r.rounds||!Array.isArray(r.profiles)||r.profiles.length!==10||!Array.isArray(r.stats)||r.stats.length!==10)throw new Error('Evidência do circuito incompleta.');
  integer(r.score.A,0,30,'circuit score');integer(r.score.B,0,30,'circuit score');
  const totals={A:0,B:0},spent:Record<string,number>={};
  for(let n=0;n<r.receipts.length;n++){const receipt=r.receipts[n];if(!receipt||!['A','B'].includes(receipt.winner)||receipt.seed!==roundSeed(m.id,m.seed,n)||typeof receipt.reason!=='string')throw new Error('Rodada do circuito inválida.');totals[receipt.winner]++;validateEquipment(receipt.equipment,r.profiles);
   for(const team of ['A','B'] as const){validateStrategy(receipt.plans[team]);if((m.a!=='user'||team==='B')&&JSON.stringify(receipt.plans[team])!==JSON.stringify(clubPlan(team==='A'?m.a:m.b,m.seed,n)))throw new Error('Plano NPC diverge da política registrada.');if(!Array.isArray(receipt.purchases[team]))throw new Error('Compras de circuito ausentes.');for(const p of receipt.purchases[team]){integer(p.cost,0,12000,'purchase');if(!r.profiles.some(a=>a.id===p.from&&a.team===team)||!r.profiles.some(a=>a.id===p.to&&a.team===team))throw new Error('Compra fora do elenco.');spent[p.from]=(spent[p.from]??0)+p.cost;}}
  }
  const high=Math.max(r.score.A,r.score.B),low=Math.min(r.score.A,r.score.B),validWin=high===13&&low<=11||high>=14&&high-low===2&&r.rounds%2===0;
  if(totals.A!==r.score.A||totals.B!==r.score.B||r.score.A+r.score.B!==r.rounds||r.winner!==(r.score.A===r.score.B?null:r.score.A>r.score.B?'A':'B')||r.winner===null&&(r.rounds!==30||r.score.A!==15)||r.winner!==null&&!validWin)throw new Error('Placar do circuito inconsistente.');
  if(new Set(r.profiles.map(p=>p.id)).size!==10||new Set(r.stats.map(p=>p.id)).size!==10)throw new Error('Atletas repetidos no circuito.');
  for(const team of ['A','B'] as const){const id=team==='A'?m.a:m.b;if(id!=='user'){const base=opponentProfiles(id).map(p=>({...p,id:`${team}:${p.id.slice(2)}`,team}));if(JSON.stringify(r.profiles.filter(p=>p.team===team))!==JSON.stringify(base))throw new Error('Atributos NPC alterados no circuito.');}}
  for(const p of r.stats){if(!r.profiles.some(a=>a.id===p.id&&a.team===p.team&&a.agent===p.agent)||typeof p.name!=='string')throw new Error('Estatística sem atleta.');for(const key of ['kills','deaths','firstKills','firstDeaths','trades','utility','plants','defuses','spent'] as const)integer(p[key],0,10000000,'circuit statistic');if(p.spent!==(spent[p.id]??0)||p.kills>r.rounds*5||p.deaths>r.rounds||p.firstKills>r.rounds||p.firstDeaths>r.rounds||p.plants>r.rounds||p.defuses>r.rounds)throw new Error('Estatística do circuito inconsistente.');}
  if(m.a==='user'){const f=c.fixtures.find(f=>f.day===m.day)!;if(f.sessionId!==m.id||!f.result||JSON.stringify(f.result.score)!==JSON.stringify(r.score)||f.result.seed!==r.seed||f.result.rounds!==r.rounds||f.result.winner!==r.winner)throw new Error('Partida do usuário diverge do circuito.');}
 }
 for(const f of c.fixtures)if(!!f.result!==!!x.matches.find(m=>m.id===f.sessionId)?.result)throw new Error('Resultado do usuário ausente no circuito.');
 const closed=x.matches.every(m=>m.result);if(x.closed!==closed||c.agendaCompleted!==closed||closed&&c.day!==28)throw new Error('Fechamento de circuito inconsistente.');
 const draws=closed?finalDraws(x.matches,c.seed):[];if(JSON.stringify(x.draws)!==JSON.stringify(draws))throw new Error('Sorteio final inconsistente.');
 const place=closed?standings(x.matches,draws).findIndex(r=>r.id==='user')+1:undefined;
 if(x.sponsor!==undefined&&(!x.sponsor||!['wynx','skx'].includes(x.sponsor.brand)||!c.fixtures[0]?.result||!Number.isInteger(x.sponsor.day)||x.sponsor.day<c.fixtures[0].day||x.sponsor.day>c.day))throw new Error('Patrocínio inconsistente.');
 if(JSON.stringify(x.finance)!==JSON.stringify(clubFinance(c.roster,closed?28:c.day-1,place,x.sponsor)))throw new Error('Extrato ou contratos inconsistentes.');
}
