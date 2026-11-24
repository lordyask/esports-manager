import {useEffect,useRef,useState} from 'react';
import {CLASS,PLAYERS,validateIdentity} from '../lib/game';
import type {Draft,Onboarding,Workspace} from '../lib/game';
import {cashCents,clubFinance} from '../lib/club-finance';
import {credits,registrationDraft,rosterTotals,withRoster} from '../lib/first-access';
import Mark from './club-mark';
import {Recruitment} from './recruitment';

interface Props {
 workspace:Workspace;
 save:(draft:Draft,flow:Onboarding)=>Promise<void>;
 enroll:(draft:Draft,flow:Onboarding)=>Promise<void>;
 onWriting:(value:boolean)=>void;
 help:()=>void;
 openRecords:()=>void;
}
const stages=[['organization','Organização'],['roster','Elenco'],['registration','Inscrição']] as const;
export function FirstAccess({workspace,save,enroll,onWriting,help,openRecords}:Props){
 const initial=workspace.draft,legacyDraft=initial.selected.length>0;
 const [draft,setDraft]=useState(()=>legacyDraft&&!initial.selected.includes(initial.igl)?withRoster(initial,initial.selected):initial);
 const [flow,setFlow]=useState<Onboarding>(workspace.onboarding??{stage:legacyDraft?'roster':'organization',path:legacyDraft?'manual':null});
 const [open,setOpen]=useState(!!workspace.onboarding),[writing,setWriting]=useState(false),[failure,setFailure]=useState(''),[submitting,setSubmitting]=useState(false);
 const queue=useRef(Promise.resolve()),serial=useRef(0),confirming=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 const hasDraft=!!workspace.onboarding||legacyDraft||initial.org!=='Minha organização'||initial.tag!=='ORG';
 useEffect(()=>{if(open){heading.current?.focus({preventScroll:true});window.scrollTo(0,0);}},[open,flow.stage]);
 function change(next:Draft,step:Onboarding){
  if(confirming.current)return;
  setDraft(next);setFlow(step);setFailure('');setWriting(true);onWriting(true);
  const ticket=++serial.current;
  // Serialize writes to the versioned workspace. A late completion may not
  // replace the newer fields being edited on screen.
  queue.current=queue.current.then(()=>save(next,step)).catch(e=>{
   if(ticket===serial.current)setFailure(e instanceof Error?e.message:String(e));
  }).finally(()=>{if(ticket===serial.current){setWriting(false);onWriting(false);}});
 }
 const totals=rosterTotals(draft.selected);
 const identityValid=!!draft.org.trim()&&!!draft.tag.trim();
 const full=draft.selected.length===5&&new Set(draft.selected).size===5&&totals.margin>=0&&draft.selected.includes(draft.igl);
 function move(stage:Onboarding['stage']){
  try{
   if(stage!=='organization')validateIdentity(draft);
   const next=stage==='registration'?registrationDraft(draft):draft;
   change(next,{...flow,stage});
  }catch(e){setFailure(e instanceof Error?e.message:String(e));}
 }
 async function confirm(){
  if(confirming.current||writing)return;
  confirming.current=true;setSubmitting(true);setFailure('');onWriting(true);
  try{await enroll(draft,flow);}catch(e){setFailure(e instanceof Error?e.message:String(e));}
  finally{confirming.current=false;setSubmitting(false);onWriting(false);}
 }
 if(!open)return <section className="fa-welcome">
 <div><span className="eyebrow">Carreira · Primeiro acesso</span><h1>Sua equipe<br/>começa aqui.</h1>
 <p>Crie sua organização, escale cinco titulares e confirme a inscrição para chegar à Central de Comando.</p>
 <div className="button-row"><button className="primary" onClick={()=>{setOpen(true);change(draft,flow);}}>{hasDraft?'Continuar carreira':'Iniciar carreira'} →</button>
 {(workspace.history?.length||workspace.archives?.length||workspace.previous||workspace.legacyReport)?<button className="secondary" onClick={openRecords}>Consultar registros</button>:null}</div></div>
 <div className="fa-brand"><img src={(process.env.NEXT_PUBLIC_BASE_PATH??'')+'/brand/nexus-monogram.png'} alt=""/></div></section>;
 const index=stages.findIndex(s=>s[0]===flow.stage);
 const finance=flow.stage==='registration'?clubFinance(draft.selected,0):null;
 const fee=finance?.ledger.find(e=>e.kind==='entry');
 return <div className="fa-workbench">
 <nav aria-label="Etapas da carreira"><ol className="fa-steps">{stages.map(([key,title],i)=><li key={key} aria-current={key===flow.stage?'step':undefined}><span>{i+1}</span>{title}</li>)}</ol></nav>
 <div className="fa-step-title"><h1 ref={heading} tabIndex={-1}>{['Crie sua organização','Escolha seu elenco','Revise sua inscrição'][index]}</h1>
 <button className="text-button" disabled={writing||submitting} onClick={()=>setOpen(false)}>Voltar ao início</button></div>
 {failure&&<div className="notice error" role="alert">{failure} <button className="secondary" disabled={writing||submitting} onClick={()=>change(draft,flow)}>Salvar rascunho novamente</button></div>}
 {flow.stage==='organization'&&<section className="panel fa-identity">
 <div><label className="field">Nome da organização<input maxLength={40} value={draft.org} onChange={e=>change({...draft,org:e.target.value},flow)}/></label>
 <label className="field">Sigla<input maxLength={5} value={draft.tag} onChange={e=>change({...draft,tag:e.target.value.toUpperCase().slice(0,5)},flow)}/></label>
 <fieldset><legend>Emblema</legend><div className="crest-options">{[0,1,2].map(i=><button type="button" aria-label={'Escudo '+(i+1)} aria-pressed={draft.crest===i} className={draft.crest===i?'chosen':''} key={i} onClick={()=>change({...draft,crest:i},flow)}><Mark kind={i}/></button>)}</div></fieldset></div>
 <div><h3>Prévia da classificação</h3><div className="fa-club"><span style={{color:draft.color}}><Mark kind={draft.crest}/></span><strong>{draft.org||'Nome da organização'}</strong><b>{draft.tag||'Sigla'}</b></div></div>
 </section>}
 {flow.stage==='roster'&&<Recruitment draft={draft} path={flow.path} change={(d,path)=>change(d,{stage:'roster',path})} help={help}/>}
 {flow.stage==='registration'&&finance&&fee&&<section className="panel fa-review"><div>
 <div className="fa-club"><span style={{color:draft.color}}><Mark kind={draft.crest}/></span><strong>{draft.org}</strong><b>{draft.tag}</b></div>
 <h3>Cinco titulares</h3><ol>{draft.selected.map(id=>{const p=PLAYERS.find(p=>p.id===id)!;return <li key={id}><strong>{p.name}{id===draft.igl?' · Capitão (IGL)':''}</strong><span>{p.style} · {draft.assignments[id]?.agent} ({CLASS[draft.assignments[id]?.agent]})</span></li>;})}</ol></div>
 <div><h3>Compromissos da inscrição</h3><p>{finance.contracts.length} contratos de {finance.contracts[0].endDayExclusive-finance.contracts[0].startDay} dias.</p><dl className="fa-accounts">
 <div><dt>Folha mensal</dt><dd>{credits(totals.payroll)}</dd></div><div><dt>Margem salarial</dt><dd>{credits(totals.margin)}</dd></div>
 <div><dt>Taxa de inscrição</dt><dd>{credits(-fee.cents/100)}</dd></div><div><dt>Saldo inicial em caixa após a taxa</dt><dd>{credits(cashCents(finance)/100)}</dd></div></dl></div></section>}
 <div className="fa-footer">
 {index>0&&<button className="secondary" disabled={submitting} onClick={()=>move(index===2?'roster':'organization')}>{index===2?'Voltar ao elenco':'Voltar à organização'}</button>}
 <span className="fa-summary">{index===1?<><b>{draft.selected.length}/5 titulares</b> · Folha {credits(totals.payroll)} · Margem salarial <b>{credits(totals.margin)}</b></>:index===0?'Defina nome, sigla e emblema.':'Confira os dados antes de confirmar.'}</span>
 {index===2?<button className="primary" disabled={writing||submitting||!full} onClick={confirm}>{submitting?'Confirmando…':'Confirmar inscrição'}</button>:
 <button className="primary" disabled={index===0?!identityValid:!full} onClick={()=>move(index===0?'roster':'registration')}>{index===0?'Escolher meu elenco':'Revisar inscrição'}</button>}
 </div></div>;
}
