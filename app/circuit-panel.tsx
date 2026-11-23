'use client';
import {useState} from 'react';
import type {Workspace} from '../lib/game';
import {PLAYERS,MAP_NAMES,ATTRS} from '../lib/game';
import {standings,completedDay,pendingNpc} from '../lib/circuit-state';
import {PRIZES,cashCents,payroll,salaryAccrued} from '../lib/club-finance';
import {opponentFor} from '../lib/opponents';
import {opponentStrategies,previousClubMatches} from '../lib/opponent-preview';
import {countryLabel} from '../lib/countries';
import {ATTACKS,DEFENSES} from '../src/strategies';
const money=(cents:number)=>(cents/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' cr.';
export const clubName=(id:string,w:Workspace)=>id==='user'?w.draft.org:opponentFor(id).name;
export function CircuitEntry({workspace:w,busy,onStart}:{workspace:Workspace;busy:boolean;onStart:()=>void}){
 const monthly=payroll(w.draft.selected),forecast=3000000-100000-salaryAccrued(w.draft.selected,28)-280000;
 return <section className="panel"><span className="eyebrow">PRIMEIRO CIRCUITO · 28 DIAS</span><h1>Da preparação à classificação final.</h1><p>Oito equipes, turno único e 28 partidas. Você disputa sete confrontos; os outros 21 usam o mesmo motor. Vitória vale 3 pontos, empate 1. Adversários mantêm atributos e familiaridades fixos.</p><p>Uma oportunidade de treino por dia: coletivo OU individual. Saltar dias perde oportunidades e processa os vencimentos atravessados.</p><div className="overview-grid circuit-entry-metrics"><div className="stat-card"><span>CAIXA INICIAL</span><strong>30.000</strong><p>Crédito único; inscrição de 1.000.</p></div><div className="stat-card"><span>FOLHA MENSAL</span><strong>{monthly.toLocaleString('pt-BR')}</strong><p>Teto 12.000; cinco contratos de 365 dias.</p></div><div className="stat-card"><span>SALDO SEM PRÊMIO</span><strong>{w.draft.selected.length===5?money(forecast):'Selecione cinco titulares'}</strong><p>Projeção dos 28 dias para o elenco escolhido.</p></div></div><p className="small">Salários: 7/30 por semana, com compensação de centavos. Operação: 100 por dia. Pagamentos no fechamento dos dias 7, 14, 21 e 28. O treino não tem taxa adicional. Os créditos da partida não são convertidos em caixa.</p><h2>Premiação por colocação</h2><div className="table-wrap"><table><thead><tr><th>Posição</th>{PRIZES.map((_,i)=><th key={i}>{i+1}º</th>)}</tr></thead><tbody><tr><th>Prêmio</th>{PRIZES.map((p,i)=><td key={i}>{p.toLocaleString('pt-BR')}</td>)}</tr></tbody></table></div><p className="small muted">Ao confirmar, a campanha começa com evolução inicial e saldo de 29.000 após a inscrição. O histórico anterior é preservado. Cancelar não cria contratos nem movimentações.</p><button className="primary" disabled={busy||w.draft.selected.length!==5||monthly>12000||w.session?.state.phase==='buy'} onClick={onStart}>Confirmar inscrição e iniciar circuito</button></section>;
}
export function CircuitPanel({workspace:w,busy,onProcess}:{workspace:Workspace;busy:boolean;onProcess:()=>void}){
 const c=w.career,x=c?.circuit;if(!c||!x)return <section className="panel"><h1>Circuito competitivo</h1><p>Inicie um novo circuito no Calendário. Agendas antigas permanecem no formato em que foram criadas, sem resultados ou cobranças retroativas.</p></section>;
 const through=completedDay(x),rows=standings(x.matches,x.draws,through),place=rows.findIndex(r=>r.id==='user')+1;
 const ownResults=x.matches.filter(m=>m.a==='user'&&m.result),ownStats=ownResults.flatMap(m=>m.result!.stats.filter(p=>p.team==='A'));
 const totals=c.roster.map(id=>{const rows=ownStats.filter(p=>p.id===`A:${id}`);return {id,name:PLAYERS.find(p=>p.id===id)!.name,kills:rows.reduce((n,p)=>n+p.kills,0),deaths:rows.reduce((n,p)=>n+p.deaths,0),utility:rows.reduce((n,p)=>n+p.utility,0),plants:rows.reduce((n,p)=>n+p.plants,0),defuses:rows.reduce((n,p)=>n+p.defuses,0)};});
 return <><div className="section-heading"><span className="eyebrow">CIRCUITO · {x.matches.filter(m=>m.result).length}/28 PARTIDAS</span><h1>{x.closed?`Campeão: ${clubName(rows[0].id,w)}`:'Cada rodada muda a classificação.'}</h1><p>{x.closed?`Sua posição: ${place}º · ${money(PRIZES[place-1]*100)} de premiação. Ciclo concluído e salvo.`:through?`Classificação após a rodada ${through/4}. Empates não resolvidos têm ordem provisória.`:'A classificação será atualizada após os quatro resultados da primeira rodada.'}</p></div>
 {pendingNpc(c)&&<section className="panel"><h2>Rodada em processamento</h2><p>Seu resultado está salvo. Calcule os jogos restantes para atualizar a classificação e liberar o calendário. Se interromper, os resultados concluídos serão preservados.</p><button className="primary" disabled={busy} onClick={onProcess}>Processar jogos restantes</button></section>}
 <section className="panel"><h2>Classificação {x.closed?'final':'da última rodada completa'}</h2><div className="table-wrap"><table><thead><tr><th>Pos.</th><th>Equipe</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Pts</th><th>RV</th><th>RP</th><th>Saldo</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.id} className={r.id==='user'?'own-standing':''}><td>{i+1}</td><th>{clubName(r.id,w)}</th><td>{r.played}</td><td>{r.wins}</td><td>{r.drawn}</td><td>{r.lost}</td><td><b>{r.points}</b></td><td>{r.won}</td><td>{r.against}</td><td>{r.difference}</td></tr>)}</tbody></table></div><p className="small muted">Desempates: vitórias; pontos entre o grupo empatado; saldo global; rodadas vencidas; sorteio registrado. A mini tabela é aplicada uma vez ao grupo empatado em pontos e vitórias.</p>{x.draws.map(d=><p className="small" key={d.teams.join(':')}>Sorteio final registrado · semente {d.seed}: {d.order.map(id=>clubName(id,w)).join(' → ')}.</p>)}</section>
 {x.closed&&<section className="panel"><h2>Resumo da sua equipe</h2><p>{ownResults.length} confrontos · {ownStats.reduce((n,p)=>n+p.kills,0)} eliminações · {ownStats.reduce((n,p)=>n+p.utility,0)} habilidades usadas · {ownStats.reduce((n,p)=>n+p.plants,0)} plants · {ownStats.reduce((n,p)=>n+p.defuses,0)} desarmes.</p><p>{c.days.filter(d=>d.status==='trained').length} treinos realizados. Os atributos e familiaridades atuais continuam disponíveis em Elenco, Treinamento e Agentes.</p><div className="table-wrap"><table><thead><tr><th>Atleta</th><th>Elim.</th><th>Mortes</th><th>Hab.</th><th>Plants</th><th>Desarmes</th></tr></thead><tbody>{totals.map(p=><tr key={p.id}><th>{p.name}</th><td>{p.kills}</td><td>{p.deaths}</td><td>{p.utility}</td><td>{p.plants}</td><td>{p.defuses}</td></tr>)}</tbody></table></div><p>Saldo final: <b>{money(cashCents(x.finance))}</b>. {rows[0].id==='user'?'Título deste circuito conquistado.':'Os resultados e a evolução permanecem disponíveis para consulta.'}</p></section>}
 <section className="panel"><h2>Resultados e agenda</h2>{[4,8,12,16,20,24,28].map(day=><div className="circuit-round" key={day}><h3>Rodada {day/4} · Dia {day} · Doca V2</h3>{x.matches.filter(m=>m.day===day).map(m=><details className="circuit-result" key={m.id}><summary>{clubName(m.a,w)} <b>{m.result?`${m.result.score.A} × ${m.result.score.B}`:'×'}</b> {clubName(m.b,w)} · {m.result?'Concluído':m.day===c.day?'Hoje':'Programado'}</summary><p className="small">{MAP_NAMES[m.map]} · Início no ataque: {clubName(m.initialAttack==='A'?m.a:m.b,w)} · Código {m.seed}</p>{m.result&&<><div className="table-wrap"><table><thead><tr><th>Jogador</th><th>Equipe</th><th>Agente</th><th>Elim.</th><th>Mortes</th><th>Hab.</th><th>Plants</th><th>Desarmes</th></tr></thead><tbody>{m.result.stats.map(p=><tr key={p.id}><th>{p.name}</th><td>{clubName(p.team==='A'?m.a:m.b,w)}</td><td>{p.agent}</td><td>{p.kills}</td><td>{p.deaths}</td><td>{p.utility}</td><td>{p.plants}</td><td>{p.defuses}</td></tr>)}</tbody></table></div><details><summary>Planos registrados por rodada</summary>{m.result.receipts.map((r,i)=><p className="small" key={i}>R{i+1} · {clubName(m.a,w)}: {ATTACKS[r.plans.A.attack].name} / {DEFENSES[r.plans.A.defense].name} · {clubName(m.b,w)}: {ATTACKS[r.plans.B.attack].name} / {DEFENSES[r.plans.B.defense].name} · Vitória: {clubName(r.winner==='A'?m.a:m.b,w)}</p>)}</details></>}</details>)}</div>)}</section></>;
}
export function FinancePanel({workspace:w}:{workspace:Workspace}){
 const c=w.career,x=c?.circuit;if(!c||!x)return <section className="panel"><h1>Gestão financeira</h1><p>Disponível em um novo circuito competitivo. O progresso antigo não recebe despesas retroativas.</p></section>;
 const f=x.finance,paid=-f.ledger.filter(e=>e.kind==='salary').reduce((n,e)=>n+e.cents,0),paidOps=-f.ledger.filter(e=>e.kind==='operation').reduce((n,e)=>n+e.cents,0),accrued=salaryAccrued(c.roster,f.closedThrough)-paid+f.closedThrough*10000-paidOps,next=[7,14,21,28].find(day=>day>f.closedThrough);
 const labels={initial:'Caixa inicial',entry:'Inscrição no circuito',salary:'Salários — período de sete dias',operation:'Operação — período de sete dias',prize:'Premiação pela colocação'};
 return <><div className="section-heading"><span className="eyebrow">CAIXA DA ORGANIZAÇÃO</span><h1>Planeje cada vencimento.</h1><p>Economia separada dos créditos de rodada. Salários não mudam com o treinamento.</p></div><div className="two-columns"><section className="panel"><h2>Saldo disponível</h2><p className="finance-value">{money(cashCents(f))}</p><p>Folha mensal: {money(payroll(c.roster)*100)}.</p><p>Despesas provisionadas ainda não pagas: {money(accrued)}.</p><p>{next?`Próximo pagamento: fechamento do dia ${next}.`:'Todos os vencimentos do ciclo estão liquidados.'}</p><p className="small muted">Dia atual ainda em curso. Despesas são liquidadas ao fechar o dia; o fechamento do dia 28 aguarda todos os jogos finais.</p></section><section className="panel"><h2>Projeção do ciclo</h2><p>Sem contar premiação incerta: <b>{money(3000000-100000-salaryAccrued(c.roster,28)-280000)}</b>.</p><p>Salários: {money(salaryAccrued(c.roster,28))}. Operação: 2.800,00 cr. Inscrição: 1.000,00 cr.</p><p className="small">Uma sessão de treino não gera cobrança adicional. Não há patrocínio, juros, multa ou conversão dos créditos da partida.</p></section></div><section className="panel"><h2>Extrato</h2><div className="table-wrap"><table><thead><tr><th>Dia</th><th>Lançamento</th><th>Valor</th></tr></thead><tbody>{f.ledger.map(e=><tr key={e.id}><td>{e.day}</td><th>{labels[e.kind]}</th><td>{money(e.cents)}</td></tr>)}</tbody></table></div></section><section className="panel"><h2>Contratos dos titulares</h2><div className="table-wrap"><table><thead><tr><th>Jogador</th><th>Salário mensal</th><th>Início</th><th>Último dia coberto</th><th>Dias restantes</th></tr></thead><tbody>{f.contracts.map(p=><tr key={p.playerId}><th>{PLAYERS.find(x=>x.id===p.playerId)!.name}</th><td>{money(p.monthlySalary*100)}</td><td>{p.startDay}</td><td>{p.endDayExclusive-1}</td><td>{365-f.closedThrough}</td></tr>)}</tbody></table></div><p className="small muted">Contagem após os dias já fechados. Ao concluir os 28 dias, restam 337 dias de contrato.</p></section></>;
}
export function OpponentPreview({workspace:w}:{workspace:Workspace}){
 const [side,setSide]=useState<'attack'|'defense'>('attack');
 const career=w.career,circuit=career?.circuit,fixture=career?.fixtures.find(f=>!f.result);
 if(!career||!circuit||!fixture)return null;
 const club=opponentFor(fixture.opponentId);
 const previous=previousClubMatches(circuit.matches,club.id,career.day);
 const {total,ranked}=opponentStrategies(previous,club.id,side);
 const through=completedDay(circuit);
 const position=through?standings(circuit.matches,circuit.draws,through).findIndex(r=>r.id===club.id)+1:0;
 return <section className="panel opponent-preview" aria-labelledby="opponent-name">
  <span className="eyebrow">Próximo adversário</span>
  <h2 id="opponent-name">{club.name} · {club.tag}</h2>
  <div className="opponent-columns">
   <div>
    <div className="table-wrap"><table aria-label={`Elenco de ${club.name}`}>
     <thead><tr>{['Atleta','País','Função','Agente','OVR'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
     <tbody>{club.players.map(p=><tr key={p.id}>
      <th scope="row">{p.name}{p.igl&&<span className="opponent-igl"> IGL</span>}</th><td>{countryLabel(p.country)}</td><td>{p.role}</td><td>{p.main}</td><td>{p.overall}</td>
     </tr>)}</tbody>
    </table></div>
    <details><summary>Atributos dos adversários</summary>{club.players.map(p=><p className="small" key={p.id}><strong>{p.name}</strong> · {ATTRS.map((a,i)=>`${a} ${p.attrs[i]}`).join(' · ')}</p>)}</details>
   </div>
   <section className="opponent-strategies" aria-labelledby="opponent-strategies-title">
    <h3 id="opponent-strategies-title">Estratégias mais usadas</h3>
    <div className="opponent-sides" role="group" aria-label="Lado do adversário">
     {(['attack','defense'] as const).map(value=><button type="button" key={value} aria-pressed={value===side} onClick={()=>setSide(value)} className={value===side?'primary small-button':'secondary small-button'}>{value==='attack'?'Ataque':'Defesa'}</button>)}
    </div>
    <div aria-live="polite">{ranked.length?<ol>{ranked.map(entry=><li key={entry.id}><strong>{entry.name}</strong> · {entry.count} de {total} {total===1?'round':'rounds'} de {side==='attack'?'ataque':'defesa'}</li>)}</ol>
     :<p className="small muted">{previous.length?'Sem estratégias registradas para este lado.':'O adversário ainda não disputou partidas nesta carreira.'}</p>}</div>
   </section>
  </div>
  <footer className="opponent-results">
   <p className="small">{position?`${position}º na classificação da última rodada completa.`:'Classificação ainda sem rodada completa.'}</p>
   {previous.length>0&&<details><summary>Placares anteriores ({previous.length})</summary>{previous.map(m=><p className="small" key={m.id}>Dia {m.day} · {clubName(m.a,w)} {m.result!.score.A} × {m.result!.score.B} {clubName(m.b,w)}</p>)}</details>}
  </footer>
 </section>;
}
