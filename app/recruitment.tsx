import {useRef,useState} from 'react';
import {AGENTS,CLASS,PLAYERS,ROLES} from '../lib/game';
import type {Draft,Onboarding,Player} from '../lib/game';
import {credits,paths,rosterTotals,swapPlayer,withRoster} from '../lib/first-access';
import {PlayerSheet,RecruitCard} from './recruit-card';

type Path=NonNullable<Onboarding['path']>;
interface Props {
 draft:Draft;path:Path|null;change:(draft:Draft,path:Path)=>void;help:()=>void;
}
const byId=(id:string)=>PLAYERS.find(p=>p.id===id)!;
export function Recruitment({draft,path,change,help}:Props){
 const [query,setQuery]=useState(''),[role,setRole]=useState(''),[agentClass,setClass]=useState('');
 const [swap,setSwap]=useState(''),[candidate,setCandidate]=useState(''),[sheet,setSheet]=useState<Player|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),catalog=useRef<HTMLDivElement>(null),swapOrigin=useRef<HTMLButtonElement|null>(null);
 const totals=rosterTotals(draft.selected),replacing=swap?byId(swap):null,chosen=candidate?byId(candidate):null;
 const delta=replacing&&chosen?chosen.salary-replacing.salary:0;
 const filtered=PLAYERS.filter(p=>(!swap||!draft.selected.includes(p.id))&&(!role||p.style===role)&&(!agentClass||CLASS[p.main]===agentClass)&&
  [p.name,p.main,p.country].some(s=>s.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))));
 function openSheet(p:Player){setSheet(p);dialog.current?.showModal();}
 function clearSearch(){setQuery('');setRole('');setClass('');setCandidate('');catalog.current?.scrollTo(0,0);}
 function closeSwap(){setSwap('');setCandidate('');requestAnimationFrame(()=>swapOrigin.current?.focus());}
 function selectPath(key:Path){if(key===path)return;clearSearch();setSwap('');change(withRoster(draft,[...paths[key].ids],paths[key].captain),key);}
 return <>
 <div className="fa-recommendations">{(Object.keys(paths) as Path[]).map(key=>{
  const preset=paths[key],values=rosterTotals(preset.ids);
  return <button key={key} type="button" aria-pressed={path===key} className="fa-option" onClick={()=>selectPath(key)}>
   <strong>{preset.name}</strong><span>{preset.ids.length?preset.ids.map(id=>byId(id).name+(id===preset.captain?' (IGL)':'')).join(' · '):'Cinco vagas abertas'}</span>
   <span className="fa-metrics"><span>OVR médio <b>{preset.ids.length?values.average.toLocaleString('pt-BR',{minimumFractionDigits:1}):'—'}</b></span><span>Folha mensal <b>{credits(values.payroll)}</b></span><span>Margem salarial <b>{credits(values.margin)}</b></span></span>
  </button>;
 })}</div>
 {path&&<div className="fa-roster-layout"><section className="panel fa-slots"><div className="panel-title"><h3>Titulares · {draft.selected.length}/5</h3><button className="text-button" onClick={help}>Funções táticas</button></div>
 <ol>{Array.from({length:5},(_,i)=>{
  const p=byId(draft.selected[i]);return <li key={i}><div>{p?<><strong>{p.name}{p.id===draft.igl?' · IGL':''}</strong><small>{p.style} · {p.main} ({CLASS[p.main]})</small></>:<span>Vaga aberta</span>}</div>
  {p&&<button className="text-button" onClick={e=>{swapOrigin.current=e.currentTarget;setSwap(p.id);clearSearch();requestAnimationFrame(()=>document.getElementById('fa-search')?.focus());}}>Trocar atleta<span className="sr-only"> · {p.name}</span></button>}</li>;
 })}</ol>
 {draft.selected.length>0&&<label className="field">Capitão (IGL)<select value={draft.igl} onChange={e=>change({...draft,igl:e.target.value},path)}>{draft.selected.map(id=><option value={id} key={id}>{byId(id).name}</option>)}</select></label>}
 </section>
 {(path==='manual'||replacing)?<section className="panel fa-market"><div className="panel-title"><h3>{replacing?'Trocar '+replacing.name:'Recrutamento'}</h3>{replacing&&<button className="text-button" onClick={closeSwap}>Cancelar troca</button>}</div>
 <div className="fa-filters">
 <label className="field">Buscar atleta<input id="fa-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome, país ou agente"/></label>
 <label className="field">Função tática<select value={role} onChange={e=>setRole(e.target.value)}><option value="">Todas</option>{['IGL',...ROLES].map(r=><option key={r}>{r}</option>)}</select></label>
 <label className="field">Classe do agente<select value={agentClass} onChange={e=>setClass(e.target.value)}><option value="">Todas</option>{[...new Set(AGENTS.map(a=>CLASS[a]))].map(c=><option key={c}>{c}</option>)}</select></label>
 </div>
 {replacing&&chosen&&<div className="fa-proposal" aria-live="polite"><strong>{replacing.name} → {chosen.name}</strong>
 <span>Folha antes {credits(totals.payroll)} · Folha depois {credits(totals.payroll+delta)} · Diferença {delta>0?'+':''}{credits(delta)} · Margem salarial {credits(totals.margin-delta)}</span>
 {delta>totals.margin&&<span>Troca acima do teto salarial.</span>}
 <button className="primary" disabled={delta>totals.margin} onClick={()=>{change(swapPlayer(draft,replacing.id,chosen.id),path);closeSwap();}}>Aplicar troca</button></div>}
 <div ref={catalog} className="fa-catalog" role="region" aria-label="Catálogo de atletas" tabIndex={0}>
 {filtered.map(p=>{const selected=draft.selected.includes(p.id);return <RecruitCard key={p.id} p={p} selected={selected||candidate===p.id} onSheet={()=>openSheet(p)}>
 {replacing?<button className="pick" aria-pressed={candidate===p.id} onClick={()=>setCandidate(p.id)}>Comparar troca</button>:
 <button className="pick" disabled={!selected&&(draft.selected.length>=5||p.salary>totals.margin)} onClick={()=>change(withRoster(draft,selected?draft.selected.filter(id=>id!==p.id):[...draft.selected,p.id]),path)}>{selected?'Remover':'Adicionar'}</button>}</RecruitCard>;})}
 {!filtered.length&&<p>Nenhum atleta corresponde aos filtros.</p>}</div></section>:
 <section className="panel fa-lineup"><h3>{paths[path].name}</h3>{draft.selected.map(id=>{const p=byId(id);return <div className="fa-player-line" key={id}><span><b>{p.name}</b> · {p.profile}</span><span>{credits(p.salary)}</span><button className="text-button" onClick={()=>openSheet(p)}>Ver ficha<span className="sr-only"> · {p.name}</span></button></div>;})}</section>}
 </div>}
 {!path&&<button className="text-button" onClick={help}>Funções táticas</button>}
 <dialog className="preferences-dialog fa-dialog" aria-labelledby="fa-sheet-name" ref={dialog}>
 {sheet&&<><div className="panel-title"><h2 id="fa-sheet-name">{sheet.name}</h2><button className="secondary" onClick={()=>dialog.current?.close()}>Fechar ficha</button></div>
 <p>{sheet.style} · {sheet.main} ({CLASS[sheet.main]}) · {credits(sheet.salary)}/mês</p><PlayerSheet p={sheet}/></>}
 </dialog></>;
}
