import {decodeSave,encodeSave} from './game.ts';
import type {Workspace} from './game.ts';
interface Stored {revision:number;text:string;}
type Loaded={revision:number;data:Workspace}|{revision:number;raw:string;error:string};
const open=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('esports-manager-beta-1.1',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('O navegador não permitiu abrir o salvamento local.'));});
/** Read-only rescue of the old checkpoint. Never creates or upgrades a legacy database. */
export async function loadLegacyExport():Promise<string|null>{
 try{
  if(typeof indexedDB.databases!=='function'||!(await indexedDB.databases()).some(d=>d.name==='esports-manager-beta'))return null;
  return await new Promise(resolve=>{
   const r=indexedDB.open('esports-manager-beta');r.onupgradeneeded=()=>r.transaction?.abort();r.onerror=()=>resolve(null);
   r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains('workspace')){db.close();resolve(null);return;}
    const t=db.transaction('workspace','readonly'),q=t.objectStore('workspace').get('active');
    q.onsuccess=()=>resolve(typeof q.result?.text==='string'?q.result.text:null);q.onerror=()=>resolve(null);t.oncomplete=()=>db.close();t.onabort=()=>{db.close();resolve(null);};
   };
  });
 }catch{return null;}
}
export async function loadWorkspace(){const db=await open();try{return await new Promise<Loaded|null>((resolve,reject)=>{const t=db.transaction('workspace','readonly'),r=t.objectStore('workspace').get('active');r.onsuccess=()=>{const x=r.result as Stored|undefined;if(!x){resolve(null);return;}try{resolve({revision:x.revision,data:decodeSave(x.text)});}catch(e){resolve({revision:x.revision,raw:x.text,error:e instanceof Error?e.message:String(e)});}};r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function commitWorkspace(data:Workspace,expected:number){
 const text=encodeSave(data),db=await open();
 try{return await new Promise<number>((resolve,reject)=>{const t=db.transaction('workspace','readwrite'),store=t.objectStore('workspace'),r=store.get('active');let failure:Error|null=null;
 r.onsuccess=()=>{const prior=r.result as Stored|undefined;if((prior?.revision??0)!==expected){failure=new Error('Outra aba atualizou o progresso. Recarregue antes de continuar.');t.abort();return;}store.put({revision:expected+1,text},'active');};
 t.oncomplete=()=>resolve(expected+1);t.onerror=()=>reject(failure??new Error('Falha ao salvar. Exporte seu progresso antes de fechar.'));t.onabort=()=>reject(failure??new Error('O salvamento não foi concluído.'));
 });}finally{db.close();}
}
