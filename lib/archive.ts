import {decodeSave as decodePrior} from '../legacy/v0_5_0/lib/game.ts';
import type {Workspace as PriorWorkspace} from '../legacy/v0_5_0/lib/game.ts';
import {decodeSave as decodeOld,prepareImport as importOld,freshWorkspace as oldFresh} from '../legacy/v0_4_1/lib/game.ts';
import type {Workspace as OldWorkspace} from '../legacy/v0_4_1/lib/game.ts';
import {readHistory as readPriorHistory} from '../legacy/v0_5_0/lib/history.ts';
import {readHistory as oldHistory} from '../legacy/v0_4_1/lib/history.ts';
import {decodeSave,encodeSave,freshWorkspace,defaultDraft} from './game.ts';
import type {Workspace} from './game.ts';
import {initializeHistory,readHistory} from './history.ts';
import {ENGINE_VERSION} from '../src/rules.ts';
import {sha256} from '../src/hash.ts';
const LIMIT=64*1024*1024;
export interface Archive {id:string;text:string;mode?:'unverified';}
export interface ArchiveView {engine:string;beta:string;data:Workspace|OldWorkspace|PriorWorkspace;}
/** A separate decoder validates the frozen old catalog. No old match is advanced here. */
export function readArchive(a:Archive):ArchiveView {
 if(!a||typeof a.text!=='string'||new TextEncoder().encode(a.text).length>LIMIT||a.id!==sha256(a.text))throw new Error('Arquivo de consulta inválido.');
 if(a.mode==='unverified')return {engine:'não validado',beta:'arquivo preservado',data:freshWorkspace()};
 if(a.mode!==undefined)throw new Error('Modo de acervo inválido.');
 const e=JSON.parse(a.text);if(e?.data?.archives!==undefined&&e.engine!=='0.5.0')throw new Error('Acervos não podem ser aninhados.');
 if(e.format==='esports-manager-history'){
  if(e.engine==='0.4.1')return {engine:e.engine,beta:'histórico 1.x / desenvolvimento anterior',data:{...oldFresh(),history:oldHistory(a.text)}};
  if(e.engine==='0.5.0')return {engine:e.engine,beta:'histórico reworks anteriores',data:{...freshWorkspace(),history:readPriorHistory(a.text)}};
  if(e.engine===ENGINE_VERSION)return {engine:e.engine,beta:'histórico 2.0',data:{...freshWorkspace(),history:readHistory(a.text)}};
 }
 if(e.format!=='esports-manager-beta')throw new Error('Tipo de arquivo de consulta desconhecido.');
 if(e.engine==='0.5.0')return {engine:e.engine,beta:e.beta??'reworks anteriores',data:decodePrior(a.text)};
 if(e.engine==='0.4.1')return {engine:e.engine,beta:e.beta??'legado',data:decodeOld(a.text)};
 if(e.engine==='0.3.0')return {engine:e.engine,beta:'1.0',data:importOld(a.text).data};
 if(e.engine===ENGINE_VERSION)return {engine:e.engine,beta:e.beta,data:decodeSave(a.text)};
 throw new Error('Motor do arquivo de consulta incompatível.');
}
export function archiveFromText(text:string):Archive {const a={id:sha256(text),text};readArchive(a);return a;}
export function rescueArchive(text:string):Archive {return {id:sha256(text),text,mode:'unverified'};}
export function validateArchives(archives:Archive[]|undefined){if(archives===undefined)return;if(!Array.isArray(archives)||new Set(archives.map(a=>a?.id)).size!==archives.length)throw new Error('Acervo duplicado ou inválido.');for(const a of archives)readArchive(a);}
export function addArchive(w:Workspace,a:Archive):Workspace {
 readArchive(a);if(w.archives?.some(x=>x.id===a.id))return w;
 const next={...w,archives:[...(w.archives??[]),a]};if(new TextEncoder().encode(encodeSave(next)).length>LIMIT)throw new Error('O acervo excede 64 MB. Exporte e remova um arquivo explicitamente antes de continuar.');return next;
}
export function removeArchive(w:Workspace,id:string):Workspace{return {...w,archives:(w.archives??[]).filter(a=>a.id!==id)};}
/** Resets current progression, retaining identity, completed history and a read-only campaign snapshot. */
export function restartCareer(w:Workspace,organization=false):Workspace {
 const preserved=decodeSave(encodeSave(w));
 let archived:Archive|undefined;
 if(preserved.career||preserved.session){
  const {archives,...snapshot}=preserved;
  // Older history stays in the main collection; this snapshot needs only this campaign's matches.
  snapshot.history=(snapshot.history??[]).filter(s=>preserved.career?s.metadata?.careerId===preserved.career.id:s.id===preserved.session?.id);
  if(snapshot.previous&&preserved.career&&snapshot.previous.metadata?.careerId!==preserved.career.id)delete snapshot.previous;
  archived=archiveFromText(encodeSave(snapshot));
 }
 const history=initializeHistory(preserved).history;
 const identity=organization?{}:{org:w.draft.org,tag:w.draft.tag,color:w.draft.color,crest:w.draft.crest};
 let next:Workspace={...freshWorkspace(),draft:{...defaultDraft(),...identity},history,archives:preserved.archives,autoBuy:false};
 if(archived)next=addArchive(next,archived);
 if(new TextEncoder().encode(encodeSave(next)).length>LIMIT)throw new Error('Exporte e libere espaço no acervo antes de reiniciar.');
 return decodeSave(encodeSave(next));
}

/** Carry only configuration forward; earned progression remains exclusively in the archive. */
export function legacyWorkspace(text:string):Workspace {
 const a=archiveFromText(text),old=readArchive(a).data;
 const assignments=Object.fromEntries(Object.entries(old.draft.assignments).map(([id,v])=>[id,{...v,agent:v.agent==='Véu'?'Prisma':v.agent}]));
 const next={...freshWorkspace(),draft:{...old.draft,assignments} as Workspace['draft'],archives:archivesFromText(text)};
 if(new TextEncoder().encode(encodeSave(next)).length>LIMIT)throw new Error('O arquivo original foi preservado. A migração com acervo ultrapassa 64 MB; exporte o original para consulta antes de iniciar uma carreira vazia.');
 return next;
}

/** Flatten prior acervo entries for direct access, retaining the original whole-file bytes too. */
export function archivesFromText(text:string):Archive[]{const a=archiveFromText(text),view=readArchive(a);return [...new Map([...(view.engine==='0.5.0'?(view.data as PriorWorkspace).archives??[]:[]),a].map(x=>[x.id,x])).values()];}
