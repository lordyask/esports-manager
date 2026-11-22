import {openReadyWorkspace} from './progress-reset.ts';
import {decodeSave,encodeSave} from './game.ts';
import {SAVE_LIMIT} from './history.ts';
import type {Workspace} from './game.ts';
interface Stored {revision:number;text:string;}
type Loaded={revision:number;data:Workspace}|{revision:number;raw:string;error:string};
export async function loadWorkspace(){const db=await openReadyWorkspace();try{return await new Promise<Loaded|null>((resolve,reject)=>{const t=db.transaction('workspace','readonly'),r=t.objectStore('workspace').get('active');r.onsuccess=()=>{const x=r.result as Stored|undefined;if(!x){resolve(null);return;}try{resolve({revision:x.revision,data:decodeSave(x.text)});}catch(e){resolve({revision:x.revision,raw:x.text,error:e instanceof Error?e.message:String(e)});}};r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function commitWorkspace(data:Workspace,expected:number){
 const text=encodeSave(data);if(new TextEncoder().encode(text).length>SAVE_LIMIT)throw new Error('Salvamento acima de 64 MB. Exporte e libere espaço no histórico.');const db=await openReadyWorkspace();
 try{return await new Promise<number>((resolve,reject)=>{const t=db.transaction('workspace','readwrite'),store=t.objectStore('workspace'),r=store.get('active');let failure:Error|null=null;
 r.onsuccess=()=>{const prior=r.result as Stored|undefined;if((prior?.revision??0)!==expected){failure=new Error('Outra aba atualizou o progresso. Recarregue antes de continuar.');t.abort();return;}store.put({revision:expected+1,text},'active');};
 t.oncomplete=()=>resolve(expected+1);t.onerror=()=>reject(failure??new Error('Falha ao salvar. Exporte seu progresso antes de fechar.'));t.onabort=()=>reject(failure??new Error('O salvamento não foi concluído.'));
 });}finally{db.close();}
}
