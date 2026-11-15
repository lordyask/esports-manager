'use client';
import {useRef,useState} from 'react';
import type {Workspace} from '../lib/game';
import {PLAYERS,ATTRS,ROLE_NAMES,MAP_NAMES,salary} from '../lib/game';
import {growthFor} from '../lib/development';
import {currentFixture,nextFixture,dayClosed} from '../lib/career-state';
import {pendingNpc} from '../lib/circuit-state';
import {cashCents} from '../lib/club-finance';
import {opponentFor} from '../lib/opponents';
import {MENU_GROUPS} from './category-menu';
import {UiIcon} from './ui-icons';

type Props={workspace:Workspace;busy:boolean;onCategory:(index:number)=>void;onOpen:(tab:number)=>void};
const number=(value:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(value);

/** A visual command hub; every value comes from the current workspace. */
export function CommandHome({workspace:w,busy,onCategory,onOpen}:Props){
 const c=w.career,s=w.session,next=c?nextFixture(c):undefined,today=c?currentFixture(c):undefined;
 const active=!!s&&s.state.phase!=='finished',complete=!!c?.agendaCompleted,processing=!!c&&!!pendingNpc(c);
 const full=w.draft.selected.length===5,closed=c?dayClosed(c):!!w.development?.used;
 const trainBlocked=busy||!full||closed||!!s||complete;
 const [playerId,setPlayerId]=useState('');
 const selected=w.draft.selected.map(id=>PLAYERS.find(p=>p.id===id)!).filter(Boolean);
 const player=selected.find(p=>p.id===playerId)??selected.find(p=>p.id===w.draft.igl)??selected[0];
 const growth=player?growthFor(w.development,player.id):undefined;
 const overall=growth?growth.attrs.reduce((a,b)=>a+b,0)/8:0;
 const profile=useRef<HTMLDialogElement>(null);
 const enemyId=active?s.metadata?.opponentId:next?.opponentId;
 const enemy=enemyId?opponentFor(enemyId):undefined;
 const map=active?s.map:next?.map;
 const finance=c?.circuit?.finance;
 const results=c?c.fixtures.filter(f=>f.result).slice(-5).map(f=>({id:f.day,score:f.result!.score,winner:f.result!.winner})):[];
 const primary=active?{label:'Continuar partida',tab:3}:processing?{label:'Concluir rodada',tab:8}:complete?{label:'Ver circuito',tab:9}:today&&!s?{label:'Preparar confronto',tab:2}:c?{label:'Abrir calendário',tab:8}:full?{label:'Iniciar meu circuito',tab:8}:{label:'Montar meu elenco',tab:1};
 const trainingStatus=!full?'Escolha cinco titulares':complete?'Ciclo concluído':active?'Partida em andamento':s?'Avance pelo calendário':closed?'Treino de hoje encerrado':'Treino disponível';
 const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
 return <section className="command-home" aria-label="Menu principal e painel da organização">
  <div className="command-heading"><div><span className="eyebrow">NEXUS · TACTICAL PREMIUM</span><h1>Menu principal</h1></div><p>{w.draft.org}<span>{c?`Dia ${c.day} de 28`:'Prepare sua organização'}</span></p></div>
  <div className="command-grid">
   <nav className="command-areas" aria-label="Categorias do menu principal"><span className="eyebrow">ÁREAS DE GESTÃO</span>{MENU_GROUPS.map((group,index)=><button type="button" key={group.id} className="command-area" onClick={()=>onCategory(index)} disabled={busy}><span className="command-area-icon"><UiIcon name={group.icon}/></span><span><strong>{group.name}</strong><small>{['Resumo e calendário','Elenco, treino e agentes','Circuito e partidas','Análise, finanças e arquivos'][index]}</small></span><UiIcon name="arrow"/></button>)}</nav>
   <div className="command-center">
    <section className="command-hero" aria-label="Destaque da carreira"><img src={`${base}/brand/tactical-stage.webp`} width={2172} height={724} alt="" aria-hidden="true"/><div className="command-hero-copy"><span className="eyebrow">{active?'PARTIDA EM ANDAMENTO':processing?'FECHAMENTO DA RODADA':complete?'CICLO ENCERRADO':c?'CIRCUITO NEXUS':'SUA ORGANIZAÇÃO COMEÇA AQUI'}</span><h2>{active?`${w.draft.tag} × ${enemy?.tag??'TESTE'}`:processing?'Conclua a rodada.':complete?'Seu ciclo está registrado.':c?'Seu próximo desafio.':'Assuma o comando.'}</h2><p>{active?`${map?MAP_NAMES[map]:''} · rodada ${s.state.rounds+1}`:processing?'Retome os jogos restantes com seu resultado preservado.':complete?'Resultados, evolução e finanças disponíveis para consulta.':next?`Dia ${next.day} · ${enemy?.name} · ${map?MAP_NAMES[map]:''}`:'Monte cinco titulares e prepare sua primeira campanha.'}</p><button type="button" className="primary" disabled={busy} onClick={()=>onOpen(primary.tab)}>{primary.label}<UiIcon name="arrow"/></button></div></section>
    <div className="command-lower">
     <section className="command-panel command-fixture"><div className="command-panel-title"><UiIcon name={active?'match':'calendar'}/><h2>{active?'PARTIDA ATUAL':'PRÓXIMO JOGO'}</h2></div>{active?<><div className="command-versus"><strong>{w.draft.tag}</strong><span>{s.state.score.A} : {s.state.score.B}</span><strong>{enemy?.tag??'TESTE'}</strong></div><p>{map?MAP_NAMES[map]:''} · partida em andamento</p></>:next?<><div className="command-versus"><strong>{w.draft.tag}</strong><span>VS</span><strong>{enemy?.tag}</strong></div><p>{enemy?.name}</p><p className="command-fixture-meta">Dia {next.day} · {MAP_NAMES[next.map]} · início no {next.initialAttack==='A'?'ataque':'defesa'}</p></>:<><h3>{complete?'Agenda concluída':'Confronto ainda não agendado'}</h3><p>{complete?'Os sete confrontos estão registrados.':'Inicie o circuito para definir seu próximo adversário.'}</p></>}</section>
     <section className="command-panel command-routine"><div className="command-panel-title"><UiIcon name="report"/><h2>EQUIPE E ROTINA</h2></div><div className="command-results" aria-label="Últimos confrontos do ciclo">{results.length?results.map(result=><span key={result.id} className={`command-result ${result.winner==='A'?'win':result.winner===null?'draw':'loss'}`} aria-label={`Dia ${result.id}: ${result.winner==='A'?'vitória':result.winner===null?'empate':'derrota'} por ${result.score.A} a ${result.score.B}`} title={`${result.score.A} × ${result.score.B}`}>{result.winner==='A'?'V':result.winner===null?'E':'D'}</span>):<span>Os resultados aparecerão após os jogos.</span>}</div><p className="command-training-status">{trainingStatus}</p><button type="button" className="secondary" disabled={trainBlocked} onClick={()=>onOpen(5)}>{c?'Treinar hoje':'Abrir treinamento'}<UiIcon name="arrow"/></button></section>
    </div>
   </div>
   <div className="command-side">
    <section className="command-panel command-player"><div className="command-panel-title"><UiIcon name="players"/><h2>PERFIL DO JOGADOR</h2></div>{player&&growth?<><div className="command-player-choice"><label><span className="sr-only">Jogador em destaque</span><select aria-label="Jogador em destaque" value={player.id} disabled={busy} onChange={e=>setPlayerId(e.target.value)}>{selected.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="command-overall"><small>GERAL</small><strong>{overall.toFixed(1)}</strong></div></div><p className="command-player-role">{w.draft.assignments[player.id]?.agent??player.main} · {ROLE_NAMES[w.draft.assignments[player.id]?.role??player.style]??player.style}{w.draft.igl===player.id?' · IGL':''}</p><div className="command-attributes">{[0,3,5,6].map(index=><div className="command-attribute" key={index}><span>{ATTRS[index]}</span><div className="command-attribute-track"><i style={{width:`${growth.attrs[index]}%`}}/></div><b>{growth.attrs[index]}</b></div>)}</div><button type="button" className="command-profile-open" disabled={busy} onClick={()=>profile.current?.showModal()}>Ver perfil completo<UiIcon name="arrow"/></button></>:<div className="command-player-empty"><h3>Seu primeiro titular</h3><p>Selecione jogadores para consultar seus atributos aqui.</p><button type="button" className="secondary" disabled={busy} onClick={()=>onOpen(1)}>Abrir elenco<UiIcon name="arrow"/></button></div>}</section>
    <section className="command-panel command-finance"><div className="command-panel-title"><UiIcon name="finance"/><h2>FINANÇAS</h2></div><strong className="command-cash">{finance?`${number(cashCents(finance)/100)} cr.`:'Circuito não iniciado'}</strong><p>{finance?'Caixa da organização':c?'Esta agenda não possui caixa de circuito.':'O caixa será aberto ao iniciar o circuito.'}</p><div className="command-payroll"><span>{finance?'Salários / mês':'Elenco selecionado / mês'}</span><b>{number(salary(w.draft))} cr.</b></div><button type="button" className="command-finance-open" disabled={busy} onClick={()=>onOpen(10)}>Ver finanças<UiIcon name="arrow"/></button></section>
   </div>
  </div>
  <dialog ref={profile} className="command-profile-dialog" aria-labelledby="command-profile-title"><div className="panel-title"><div><span className="eyebrow">PERFIL DO TITULAR</span><h2 id="command-profile-title">{player?.name}</h2></div><button type="button" className="icon-button" aria-label="Fechar perfil" onClick={()=>profile.current?.close()}><UiIcon name="close"/></button></div>{player&&growth&&<><div className="command-profile-summary"><span>Geral <b>{overall.toFixed(1)}</b></span><span>Potencial <b>{player.potential}</b></span><span>Salário mensal <b>{number(player.salary)} cr.</b></span></div><div className="command-profile-attributes">{ATTRS.map((name,index)=><div key={name}><span>{name}</span><b>{growth.attrs[index]}</b></div>)}</div></>}<div className="button-row"><button type="button" className="secondary" onClick={()=>profile.current?.close()}>Voltar ao painel</button><button type="button" className="primary" onClick={()=>{profile.current?.close();onOpen(1);}}>Abrir elenco</button></div></dialog>
 </section>;
}
