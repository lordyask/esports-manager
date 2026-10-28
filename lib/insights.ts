import type {Session,RoundRecord} from './game.ts';
import {attackingTeam} from '../src/map.ts';
import type {SimEvent} from '../src/tactical-types.ts';
import {ATTACKS,DEFENSES,ATTACK_INSTRUCTIONS,DEFENSE_INSTRUCTIONS} from '../src/strategies.ts';
export const reasonText=(r:string)=>({defenders_eliminated:'defesa eliminada',attackers_eliminated:'ataque eliminado',mutual_elimination:'eliminação simultânea',defused:'dispositivo desarmado',detonation:'dispositivo detonado',time_expired:'tempo esgotado'}[r]??r);
const sector=(s:string|undefined)=>({attack:'base de ataque',defense:'base de defesa',mid:'meio',A:'ponto A',B:'ponto B'}[s??'']??s??'');
const location=(s:string|undefined)=>(s==='attack'||s==='defense'?'na ':'no ')+sector(s);
export function eventText(e:SimEvent,names:Record<string,string>){
 const who=names[e.actor??'']??'Equipe',target=names[e.target??'']??'adversário';
 switch(e.kind){
  case 'first_contact':return `${who} observou ${target} ${location(e.sector)}: primeiro contato registrado da equipe.`;
  case 'eliminated':return `${who} foi eliminado por ${target}.`;
  case 'planted':return `${who} plantou o dispositivo no ${sector(e.sector)}.`;
  case 'plant_start':return `${who} iniciou o plant.`;
  case 'defuse_start':return `${who} iniciou o desarme.`;
  case 'defused':return `${who} concluiu o desarme.`;
  case 'cast_complete':return `${who} concluiu ${e.ability}.`;
  case 'cast_start':return `${who} preparou ${e.ability}.`;
  case 'igl_call':return `${who} chamou o ${sector(e.sector)} com base na informação observada.`;
  case 'strategy_shift':return `Ordem de rotação para o ${sector(e.sector)} após a finta.`;
  case 'role_notice':return e.detail??'Composição sem função designada.';
  case 'move_start':return `${who} iniciou deslocamento ${e.sector==='attack'||e.sector==='defense'?'para a':'para o'} ${sector(e.sector)}.`;
  case 'arrived':return `${who} chegou ${e.sector==='attack'||e.sector==='defense'?'à':'ao'} ${sector(e.sector)}.`;
  case 'move_blocked':return `Uma barreira interrompeu o deslocamento de ${who}.`;
  case 'move_cancelled':return `${who} cancelou o deslocamento anterior.`;
  case 'interrupted':return `${who} interrompeu a ação de ${target}.`;
  case 'weapon_damage':return `${who} atingiu ${target}.`;
  case 'blast_damage':case 'zone_damage':return `${who} atingiu ${target} com dano de área.`;
  case 'revealed':return `${who} foi detectado ${location(e.sector)}.`;
  case 'round_end':return `Encerramento: ${reasonText(e.detail??'')}.`;
  case 'plan_start':return 'Plano da equipe registrado antes da rodada.';
  default:return null;
 }
}
export function reviewRound(s:Session,r:RoundRecord){
 const index=r.command.revision,attacking=attackingTeam({...s.state,initialAttack:s.state?.initialAttack??'A',rounds:index});
 const deaths=r.result.events.filter(e=>e.kind==='eliminated'),facts:string[]=[];
 const first=deaths[0];if(first)facts.push(`Primeira eliminação: ${s.names[first.target??'']??'adversário'} sobre ${s.names[first.actor??'']??'jogador'}, aos ${(first.at/1000).toFixed(1)} s.`);
 const ownDeaths=deaths.filter(e=>e.actor?.startsWith('A:'));
 const untraded=ownDeaths.filter(e=>!deaths.some(d=>d.actor===e.target&&d.target?.startsWith('A:')&&d.at>=e.at&&d.at-e.at<=5000));
 if(untraded.length)facts.push(`${untraded.length} eliminação(ões) da sua equipe sem trade registrado em até 5 s.`);
 for(const e of r.result.events.filter(e=>e.kind==='planted'||e.kind==='defused')){
  const past=deaths.filter(d=>d.at<=e.at),count=(t:string)=>5-past.filter(d=>d.actor?.startsWith(t+':')).length;
  facts.push(`${e.kind==='planted'?'Plant':'Desarme'} aos ${(e.at/1000).toFixed(1)} s; situação após os eventos desse instante: ${count('A')} × ${count('B')}.`);
 }
 if(attacking==='A'&&!r.result.events.some(e=>e.kind==='planted'))facts.push('Sua equipe não concluiu o plant nesta rodada.');
 if(index===12)facts.push('Primeira rodada após a troca de lados: economia e equipamento reiniciados.');
 const total=(t:'A'|'B')=>r.purchases[t].reduce((n,p)=>n+p.cost,0);
 facts.push(`Gasto confirmado: sua equipe ${total('A').toLocaleString('pt-BR')} cr.; adversário ${total('B').toLocaleString('pt-BR')} cr.`);
 const ours=r.command.plans.A;
 const timeline=r.result.events.map(e=>({event:e,text:eventText(e,s.names)})).filter(x=>x.text&&x.event.kind!=='plan_start');
 for(let i=0;i<deaths.length;i++){const e=deaths[i],killer=s.profiles.find(p=>p.id===e.target);if(killer&&deaths.slice(0,i).some(d=>d.target===e.actor&&s.profiles.find(p=>p.id===d.actor)?.team===killer.team&&e.at-d.at<=5000))timeline.push({event:{...e,kind:'trade'},text:`${s.names[e.target!]} realizou o trade sobre ${s.names[e.actor!]}.`});}
 timeline.sort((a,b)=>a.event.at-b.event.at);
 const instruction=attacking==='A'?ATTACK_INSTRUCTIONS[ours.attackInstruction??'none']:DEFENSE_INSTRUCTIONS[ours.defenseInstruction??'none'];
 return {attacking,plan:(attacking==='A'?ATTACKS[ours.attack]:DEFENSES[ours.defense]).name+(instruction==='Sem complemento'?'':` + ${instruction}`),ending:reasonText(r.result.reason),facts,timeline};
}
