import type {Career} from '../lib/career-state';
import {offersAvailable,standings} from '../lib/circuit-state';
import {sponsors} from '../lib/club-finance';
import type {Sponsorship} from '../lib/club-finance';
import {FinancePanel} from './circuit-panel';
import type {Workspace} from '../lib/game';
import {useState} from 'react';

type Brand=Sponsorship['brand'];
const credits=(c:number)=>(c/100).toLocaleString('pt-BR')+' cr.';
function Logo({brand}:{brand:Brand}){
 return <img className="sponsor-logo" width={410} height={130} src={(process.env.NEXT_PUBLIC_BASE_PATH??'')+'/brand/'+brand+'.svg'} alt={sponsors[brand].name}/>;
}
function Terms({brand}:{brand:Brand}){
 const t=sponsors[brand];
 return <><Logo brand={brand}/><p><b>{credits(t.signature)}</b> na assinatura</p>{t.bonus?<><p>Bônus de {credits(t.bonus)} do 1º ao 4º lugar.</p><p>Total de 6.000 cr. no Top 4 ou 2.000 cr. do 5º ao 8º.</p></>:<p>Total de 4.000 cr. em qualquer colocação.</p>}</>;
}
function Contract({career}:{career:Career}){
 const x=career.circuit!,s=x.sponsor!;
 const rank=standings(x.matches,x.draws).findIndex(r=>r.id==='user')+1;
 const received=x.finance.ledger.filter(e=>e.kind==='signature'||e.kind==='bonus').reduce((total,e)=>total+e.cents,0);
 return <section className="panel"><h2>Patrocínio</h2><Logo brand={s.brand}/><p><b>{x.closed?'Total recebido':'Recebido'}: {credits(received)}</b></p>
 {(x.closed||s.brand==='skx')&&<p>{x.closed?'Colocação final':'Posição atual'}: {rank}º de 8</p>}
 {s.brand==='skx'&&<p>{x.closed?(rank<=4?'Meta de Top 4 atingida.':'Meta de Top 4 não atingida.'):'Meta: Top 4 · Bônus em disputa: 4.000 cr.'}</p>}</section>;
}
export function SponsorFinance({workspace:w,startOffers,busy,sign}:{workspace:Workspace;startOffers:boolean;busy:boolean;sign:(brand:Brand)=>void}){
 const [view,setView]=useState<'finance'|'offers'|Brand>(startOffers?'offers':'finance');
 const available=offersAvailable(w.career);
 if(!available||view==='finance')return <>{w.career?.circuit?.sponsor&&<Contract career={w.career}/>}
 {available&&<button className="secondary" onClick={()=>setView('offers')}>Ver propostas</button>}<FinancePanel workspace={w}/></>;
 return <section><div className="section-heading"><span className="eyebrow">Patrocínios · Primeiro circuito</span><h1>{view==='offers'?'Propostas de patrocínio':'Revisão do contrato'}</h1><p>Escolha um patrocinador para este circuito.</p></div>
 {view==='offers'?<div className="two-columns">{(['wynx','skx'] as const).map(b=><article className="panel sponsor-card" key={b}><Terms brand={b}/><button className="secondary" onClick={()=>setView(b)}>Revisar contrato · {sponsors[b].name}</button></article>)}</div>:
 <article className="panel sponsor-card"><Terms brand={view}/><div className="button-row"><button className="secondary" disabled={busy} onClick={()=>setView('offers')}>Voltar às propostas</button><button className="primary" disabled={busy} onClick={()=>sign(view)}>Confirmar contrato</button></div></article>}
 <button className="text-button" disabled={busy} onClick={()=>setView('finance')}>Consultar Finanças</button></section>;
}
