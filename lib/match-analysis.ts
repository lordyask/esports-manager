import {stats,previewRound,ATTRS} from './game.ts';
import type {Session} from './game.ts';
import {createMap,completeRound,attackingTeam} from '../src/map.ts';
export function matchAnalysis(s:Session){
 const rows=stats(s),own=rows.filter(p=>p.team==='A'),enemy=s.profiles.filter(p=>p.team==='B');
 const accounts=(t:'A'|'B')=>s.profiles.filter(p=>p.team===t).map(p=>({id:p.id,credits:1000,weapon:p.weapon,shield:p.shield,charges:p.charges,ult:p.ult}));
 let state=createMap(accounts('A'),accounts('B'),s.state.initialAttack,s.state.overtimePairLimit);
 let weaker=0,partial=0,attacks=0,plants=0,lostOpening=0,wonOpening=0,wonAfterLoss=0;
 const rank={basic:0,intermediate:1,main:2,precision:2};
 for(const r of s.records){
  const ready=previewRound({...s,state},r.command.buys);
  if(ready.warnings.A.length)partial++;
  if(ready.state.teams.A.reduce((n,a)=>n+rank[a.weapon],0)<ready.state.teams.B.reduce((n,a)=>n+rank[a.weapon],0))weaker++;
  const first=r.result.events.find(e=>e.kind==='eliminated');
  if(first?.actor?.startsWith('A:')){lostOpening++;if(r.result.winner==='A')wonAfterLoss++;}
  if(first?.actor?.startsWith('B:'))wonOpening++;
  if(attackingTeam(state)==='A'){attacks++;if(r.result.events.some(e=>e.kind==='planted'&&e.actor?.startsWith('A:')))plants++;}
  state=completeRound(ready.state,r.result,r.result.kills);
 }
 const priorities:{title:string;evidence:string;action:string}[]=[];
 if(weaker>0)priorities.push({title:'Desvantagem de equipamento',evidence:`Em ${weaker} de ${s.records.length} rodadas, a soma das categorias de armamento do time foi inferior à adversária.`,action:'Revise o planejamento das compras e a possibilidade de guardar recursos para uma rodada Forte. Gasto maior não significa equipamento superior.'});
 if(lostOpening>wonOpening)priorities.push({title:'Aberturas desfavoráveis',evidence:`O time sofreu a primeira baixa em ${lostOpening} rodadas e conseguiu a primeira eliminação em ${wonOpening}.`,action:'Revise a entrada, o apoio e as rotas dos jogadores. Primeira morte não identifica sozinha um problema de mira.'});
 if(priorities.length<2&&attacks&&plants===0)priorities.push({title:'Ataque sem plant concluído',evidence:`Nenhum plant em ${attacks} rodadas de ataque. Eliminar a defesa também pode vencer a rodada.`,action:'Revise como o plano abre espaço e mantém jogadores vivos para concluir o objetivo.'});
 const positives:string[]=[];
 if(wonOpening)positives.push(`A equipe conquistou a primeira eliminação em ${wonOpening} rodadas.`);
 if(wonAfterLoss)positives.push(`Mesmo após sofrer a primeira baixa, venceu ${wonAfterLoss} rodada(s).`);
 const trades=own.reduce((n,p)=>n+p.trades,0);if(trades)positives.push(`${trades} trade(s) registrado(s) em até 5 segundos.`);
 const players=s.profiles.filter(p=>p.team==='A').map(p=>{
  if(p.agentFamiliarity<85)return {id:p.id,name:s.names[p.id],suggestion:`Treinar ${p.agent}: familiaridade ${p.agentFamiliarity}/100 na partida. É uma oportunidade de desenvolvimento, não uma causa comprovada do resultado.`};
  const focus=p.role==='Support'?4:p.role==='Anchor'||p.role==='Lurker'?2:p.igl?5:0;
  const average=enemy.reduce((n,e)=>n+e.attrs[focus],0)/enemy.length;
  return {id:p.id,name:s.names[p.id],suggestion:p.attrs[focus]<average?`Considerar ${ATTRS[focus]}: ${p.attrs[focus]} contra média adversária ${average.toFixed(1)} nesse atributo; foco relacionado à responsabilidade ${p.igl&&focus===5?'IGL':p.role??'do jogador'}. Essa comparação não isola a causa das mortes.`:'Sem prioridade individual sustentada por esta regra de análise. Revise as rodadas antes de escolher o treino.'};
 });
 return {partial,priorities:priorities.slice(0,2),positives:positives.slice(0,2),players};
}
