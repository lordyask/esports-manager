import {useState} from 'react';
import {analysts,accepted,type Analyst} from '../lib/staff';
import {staffReport} from '../lib/staff-report';
import {cashCents} from '../lib/club-finance';
import {opponentFor} from '../lib/opponents';
import type {Workspace} from '../lib/game';

const credits=(v:number)=>v.toLocaleString('pt-BR')+' cr.';
const ids=Object.keys(analysts) as Analyst[];
function Profile({id}:{id:Analyst}){
 const p=analysts[id];
 return <div className="player-top"><span className="avatar">{p.name.split(' ').map(s=>s[0]).join('')}</span><div><h2>{p.name}</h2><p>{p.nationality} · {p.age} anos · {p.circuits} circuitos · {p.field}</p></div></div>;
}
export function StaffPanel({w,busy,submit}:{w:Workspace;busy:boolean;submit:(id:Analyst,amount:number|'confirm')=>Promise<void>}){
 const [candidate,select]=useState<Analyst|null>(null),[input,setInput]=useState(''),[game,setGame]=useState('');
 const x=w.career?.circuit,staff=x?.staff,hire=staff?.hire;
 const matches=x?.matches.filter(m=>m.a==='user'&&m.result)??[];
 if(!matches.length)return <section className="panel"><h1>Staff</h1><p>A contratação abre após a estreia da organização no circuito.</p></section>;
 if(hire){
  const m=matches.find(m=>m.id===game)??matches[0],report=staffReport(w,m,hire.id);
  return <section className="panel"><span className="eyebrow">Staff · Relatório de desempenho</span><Profile id={hire.id}/><p>Contrato até o fim do circuito · Valor pago {credits(hire.amount)}</p>
  <label className="field">Confronto<select value={m.id} onChange={e=>setGame(e.target.value)}>{matches.map(m=><option value={m.id} key={m.id}>Dia {m.day} · {opponentFor(m.b).name}</option>)}</select></label>
  <h3>{analysts[hire.id].field}</h3><p>{report.summary}</p><h3>Rounds que sustentam a observação</h3>
  {report.rounds.map(r=><details key={m.id+r.number}><summary>Round {r.number} · {r.win?'Vitória':'Derrota'}</summary><p>{r.detail}</p></details>)}</section>;
 }
 if(x?.closed)return <section className="panel"><h1>Staff</h1><p>Circuito encerrado sem contratação.</p></section>;
 const cash=cashCents(x!.finance)/100;
 if(candidate){
  const p=analysts[candidate],offers=staff?.offers[candidate]??[],last=offers.at(-1),ok=accepted(candidate,last);
  const amount=/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(input.trim())?Number(input.trim().replaceAll('.','')):NaN;
  const valid=Number.isSafeInteger(amount)&&amount>0&&amount<=cash;
  return <section className="panel staff-negotiation"><span className="eyebrow">Staff · Negociação</span><Profile id={candidate}/><p>Valor de referência da organização · {credits(p.reference)}</p><p>Caixa disponível · {credits(cash)}</p>
  {ok?<><p>Oferta aceita · {credits(last!)}. Confirme para contratar até o fim do circuito.</p><button className="primary" disabled={busy||last!>cash} onClick={()=>submit(candidate,'confirm')}>Confirmar contratação</button>{last!>cash&&<p>Saldo insuficiente para confirmar.</p>}</>:
  <>{offers.length>0&&<p role="status">Oferta de {credits(last!)} recusada. “Agradeço a proposta, mas o valor não atende às minhas condições.”</p>}
  {offers.length===2?<p>Negociação encerrada.</p>:<form onSubmit={e=>{e.preventDefault();if(valid)void submit(candidate,amount);}}>
  {offers.length===1&&<p>Esta é sua última oferta para {p.name}.</p>}<label className="field">Sua oferta em créditos<input inputMode="numeric" value={input} onChange={e=>setInput(e.target.value)}/></label>
  {input&&!valid&&<p>Informe créditos inteiros positivos dentro do caixa disponível.</p>}
  <button className="primary" disabled={busy||!valid}>Enviar oferta</button></form>}</>}
  <button className="secondary" disabled={busy} onClick={()=>select(null)}>Voltar aos candidatos</button></section>;
 }
 return <><div className="section-heading"><span className="eyebrow">Equipe · Staff</span><h1>Conheça os analistas</h1><p>Uma vaga até o fim do circuito. Cada candidato avalia até duas ofertas.</p></div><div className="two-columns">{ids.map(id=>{
 const report=staffReport(w,matches[0],id);
 const p=analysts[id],o=staff?.offers[id]??[],ended=o.length===2&&!accepted(id,o.at(-1));
 return <article key={id} className="panel sponsor-card"><Profile id={id}/><strong>Amostra da estreia · {opponentFor(matches[0].b).name}</strong><p>{report.summary}</p><details><summary>Consultar rounds da amostra</summary>{report.sample.map(r=><p key={r.number}>Round {r.number} · {r.win?'Vitória':'Derrota'} · {r.detail}</p>)}</details>
 <p>Valor de referência da organização · <b>{credits(p.reference)}</b></p><button className="secondary" disabled={busy||ended} onClick={()=>{select(id);setInput(String(p.reference));}}>{ended?'Negociação encerrada':o.length?'Rever negociação':'Negociar'} · {p.name}</button></article>;})}</div></>;
}
