import type {Workspace} from './game.ts';
import type {CircuitMatch} from './circuit-state.ts';
import type {Analyst} from './staff.ts';
import {attackingTeam} from '../src/map.ts';
import {ATTACKS,DEFENSES} from '../src/strategies.ts';

export function staffReport(w:Workspace,m:CircuitMatch,id:Analyst){
 const session=[w.session,w.previous,...(w.history??[])].find(s=>s?.id===m.id);
 const rounds=(m.result?.receipts??[]).map((r,i)=>{
  const rec=session?.records[i],events=rec?.seed===r.seed?rec.result.events:undefined;
  const first=events?.find(e=>e.kind==='eliminated'),plant=events?.find(e=>e.kind==='planted');
  const ownOpen=first?.target?first.target.startsWith('A:'):undefined;
  const opening=!events?'Primeira eliminação sem registro detalhado.':first?.target?'Primeira eliminação por '+(session?.names[first.target]??first.target)+'.':'Sem primeira eliminação identificada.';
  const objective=!events?'Plantio sem registro detalhado.':plant?'Plantio em '+(plant.sector??'ponto não identificado')+'.':'Sem plantio.';
  const attack=attackingTeam({initialAttack:m.initialAttack,rounds:i})==='A';
  const plan=attack?ATTACKS[r.plans.A.attack].name:DEFENSES[r.plans.A.defense].name;
  const strategy=(attack?'Ataque':'Defesa')+' · '+plan;
  const detail={lia:objective,caio:opening,rafael:strategy,helena:[strategy,opening,objective].join(' · ')}[id];
  return {opener:ownOpen&&first?.target?(session?.names[first.target]??first.target):undefined,number:i+1,detail,win:r.winner==='A',plant:events?!!plant:undefined,ownOpen,plan};
 });
 const planted=rounds.filter(r=>r.plant),opened=rounds.filter(r=>r.ownOpen);
 const byPlan=new Map<string,number>();
 for(const r of rounds)byPlan.set(r.plan,(byPlan.get(r.plan)??0)+1);
 const frequent=[...byPlan].sort((a,b)=>b[1]-a[1])[0];
 const openings=new Map<string,number>();
 for(const r of opened)if(r.opener)openings.set(r.opener,(openings.get(r.opener)??0)+1);
 const leader=[...openings].sort((a,b)=>b[1]-a[1])[0];
 const linked=rounds.filter(r=>r.plan===frequent?.[0]&&r.plant);
 const summary={lia:rounds.some(r=>r.plant!==undefined)?planted.length+' rounds com plantio registrado; a organização venceu '+planted.filter(r=>r.win).length+' deles.':'Sem eventos de objetivo disponíveis.',
 caio:leader?leader[0]+' conseguiu a primeira eliminação em '+leader[1]+' rounds. A organização venceu '+opened.filter(r=>r.opener===leader[0]&&r.win).length+' desses rounds.':rounds.some(r=>r.ownOpen!==undefined)?'A organização conseguiu a primeira eliminação em '+opened.length+' rounds e venceu '+opened.filter(r=>r.win).length+' deles.':'Sem autoria das primeiras eliminações disponível.',
 rafael:frequent?frequent[0]+' foi usado em '+frequent[1]+' rounds, com '+rounds.filter(r=>r.plan===frequent[0]&&r.win).length+' vitórias.':'Sem plano registrado.',
 helena:frequent?'Com '+frequent[0]+', a organização venceu '+rounds.filter(r=>r.plan===frequent[0]&&r.win).length+' de '+frequent[1]+' rounds. '+(rounds.some(r=>r.plant!==undefined)?'Nesse plano, houve plantio em '+linked.length+' rounds e vitória em '+linked.filter(r=>r.win).length+' deles.':'Eventos de abertura e plantio indisponíveis.'):'Sem plano registrado.'}[id];
 const supporting=id==='lia'?planted:id==='caio'?opened.filter(r=>r.opener===leader?.[0]):rounds.filter(r=>r.plan===frequent?.[0]);
 return {summary,rounds,sample:(supporting.length?supporting:rounds).slice(0,2)};
}
