'use client';
import type {Workspace} from '../lib/game';
import {MAP_NAMES} from '../lib/game';
import {currentFixture,dayClosed,nextFixture} from '../lib/career-state';
import {opponentFor} from '../lib/opponents';
import {UiIcon} from './ui-icons';
import {pendingNpc} from '../lib/circuit-state';

type Props={workspace:Workspace;busy:boolean;onRoster:()=>void;onPlan:()=>void;onPrepare:()=>void;onCalendar:()=>void;onTrain:()=>void;onMatch:()=>void;onReport:()=>void};

/** Presentation only: reads existing calendar/session data and calls the existing flows. */
export function HomeDashboard({workspace:w,busy,onRoster,onPlan,onPrepare,onCalendar,onTrain,onMatch,onReport}:Props){
 const c=w.career,s=w.session,next=c?nextFixture(c):undefined,today=c?currentFixture(c):undefined;
 const active=!!s&&s.state.phase!=='finished',finished=s?.state.phase==='finished',complete=!!c?.agendaCompleted,fullRoster=w.draft.selected.length===5;
 const processing=!!c&&!!pendingNpc(c);
 const opponent=next?opponentFor(next.opponentId).name:undefined;
 const map=active?s.map:next?.map;
 const trainingClosed=c?dayClosed(c):!!w.development?.used;
 const trainingBlocked=busy||!fullRoster||trainingClosed||!!s||complete;
 const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
 const primary=active?{label:'Continuar minha partida',action:onMatch}:c?{label:'Abrir calendário',action:onCalendar}:fullRoster?{label:'Preparar meu time',action:onPlan}:{label:'Montar meu elenco',action:onRoster};
 const trainingStatus=!fullRoster?'Selecione cinco titulares':complete?'Ciclo encerrado':processing?'Aguarde o fechamento da rodada':active?'Partida em andamento':finished?'Avance para o próximo dia':trainingClosed?'Sessão encerrada':c?'Uma sessão disponível':'Treino de teste disponível';
 return <>
  <section className="premium-hero" aria-label="Destaque da organização">
   <img className="premium-scenery" src={`${base}/brand/tactical-stage.webp`} width={2172} height={724} alt="" aria-hidden="true" fetchPriority="high"/>
   <div className="premium-shade" aria-hidden="true"/>
   <img className="premium-symbol" src={`${base}/brand/nexus-monogram.png`} width={180} height={180} alt="" aria-hidden="true"/>
   <div className="premium-hero-copy"><span className="eyebrow">{complete?'MEMÓRIA DO CICLO':processing?'RODADA EM PROCESSAMENTO':active?'PARTIDA EM ANDAMENTO':c?'SEU PRÓXIMO DESAFIO':'SUA ORGANIZAÇÃO, SUAS DECISÕES'}</span>
    <h1>{complete?'Sua agenda está concluída.':processing?'Conclua a rodada.':map?MAP_NAMES[map]:<>Construa<br/>sua equipe.</>}</h1>
    <p>{complete?'Seu ciclo e o desenvolvimento do elenco estão disponíveis para consulta.':processing?'Seu confronto está salvo. Abra o calendário para retomar os jogos restantes da rodada.':active?'Cada rodada é uma nova decisão. Continue com suas compras e estratégias salvas.':next?`Dia ${next.day} · ${opponent} · Início: ${next.initialAttack==='A'?'ataque':'defesa'}.`:'Equilibre talento, salário e potencial. Transforme cinco escolhas em uma estratégia de jogo.'}</p>
    <div className="button-row"><button className="primary" disabled={busy} onClick={primary.action}>{primary.label}<UiIcon name="arrow"/></button>{finished&&<button className="secondary" disabled={busy} onClick={onReport}>Ver relatório da partida</button>}</div>
   </div>
  </section>
  <div className="two-columns premium-summary">
   <section className="panel premium-match-card"><div className="premium-card-heading"><UiIcon name={active?'match':'calendar'}/><h2>{active?'PARTIDA EM ANDAMENTO':processing?'RESULTADOS PENDENTES':complete?'AGENDA CONCLUÍDA':c?'PRÓXIMA PARTIDA':'CALENDÁRIO DE 28 DIAS'}</h2></div>
    <h3>{active?s.metadata?.opponentId?opponentFor(s.metadata.opponentId).name:'Equipe de teste':processing?'Jogos restantes da rodada':opponent??(complete?'Sete confrontos preservados':'Prepare seu primeiro ciclo')}</h3>
    <p>{active?`${MAP_NAMES[s.map]} · Placar ${s.state.score.A} × ${s.state.score.B}`:processing?'Os jogos concluídos serão preservados ao retomar.':next?`Dia ${next.day} · ${MAP_NAMES[next.map]} · Início: ${next.initialAttack==='A'?'ataque':'defesa'}`:complete?'Consulte os resultados, treinos e histórico.':'Sete confrontos. Adversários com atributos fixos.'}</p>
    <div className="button-row">{active?<button className="primary" disabled={busy} onClick={onMatch}>Continuar partida<UiIcon name="arrow"/></button>:today&&!s?<button className="primary" disabled={busy} onClick={onPrepare}>Preparar confronto<UiIcon name="arrow"/></button>:<button className="secondary" disabled={busy} onClick={onCalendar}>{c?'Ver calendário':'Preparar novo ciclo'}<UiIcon name="arrow"/></button>}</div>
   </section>
   <section className="panel premium-training-card"><div className="premium-card-heading"><UiIcon name="training"/><h2>{c?'TREINO DE HOJE':'DESENVOLVIMENTO DO ELENCO'}</h2></div><h3>{trainingStatus}</h3><p>{c?'Coletivo dos cinco ou individual de um titular.':fullRoster?'Treino e familiaridades do elenco selecionado.':'Escolha seu elenco antes de abrir o treinamento.'}</p><button className="secondary" disabled={trainingBlocked} onClick={onTrain}>{c?'Treinar hoje':'Abrir treinamento'}<UiIcon name="arrow"/></button>
    {!!s&&!complete&&<p className="small muted">{finished?'Consulte o calendário para liberar a próxima oportunidade.':'A oportunidade do dia está encerrada durante a partida.'}</p>}
   </section>
  </div>
 </>;
}
