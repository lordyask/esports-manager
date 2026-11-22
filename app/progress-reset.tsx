'use client';
import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {prepareProgressReset,confirmProgressReset} from '../lib/progress-reset';
import ProductLogo from './product-logo';
import {BETA_LABEL} from '../lib/release';

export function ProgressReset({children}:{children:ReactNode}){
 const [state,setState]=useState<'loading'|'pending'|'done'|'error'>('loading');
 const channel=useRef<BroadcastChannel|null>(null);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  prepareProgressReset().then(next=>{if(active)setState(next);}).catch(error=>{
   if(active){setMessage(String(error.message??error));setState('error');}
  });
  return ()=>{active=false;};
 },[]);
 useEffect(()=>{
  if(state!=='pending')return;
  let active=true;
  // The database is authoritative, including after a suspended tab regains focus.
  function refresh(){
   prepareProgressReset().then(next=>{if(active&&next==='done')setState('done');})
    .catch(error=>{if(active)setMessage(String(error.message??error));});
  }
  if(typeof BroadcastChannel!=='undefined'){
   channel.current=new BroadcastChannel('nexus.progress-reset');
   channel.current.onmessage=refresh;
  }
  window.addEventListener('focus',refresh);
  refresh();
  return ()=>{active=false;window.removeEventListener('focus',refresh);channel.current?.close();channel.current=null;};
 },[state]);
 async function confirm(){
  setBusy(true);setMessage('');
  try{await confirmProgressReset();channel.current?.postMessage('done');setState('done');}
  catch(error){setMessage(error instanceof Error?error.message:String(error));}
  finally{setBusy(false);}
 }
 if(state==='done')return children;
 return <main className="content"><section className="panel">
  <ProductLogo/>
  <span className="eyebrow">{BETA_LABEL}</span>
  {state==='loading'?<p role="status">Abrindo seu centro de comando…</p>:state==='pending'?<>
   <h1>Nova etapa do beta</h1>
   <p>O NEXUS recebeu uma atualização. Para iniciar esta nova etapa do beta, seu progresso anterior será zerado neste navegador, incluindo carreira, elenco, treinos e históricos de partidas. Ao continuar, você poderá criar uma nova carreira do zero.</p>
   <button type="button" className="primary" disabled={busy} onClick={confirm}>Entendi, iniciar nova carreira</button>
  </>:<><h1>Não foi possível abrir o progresso local</h1><button type="button" className="primary" onClick={()=>location.reload()}>Tentar novamente</button></>}
  {message&&<p role="alert">{message}</p>}
 </section></main>;
}
