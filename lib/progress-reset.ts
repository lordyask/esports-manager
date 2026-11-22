// Both previously published writers explicitly open version 1. Upgrading fences
// their writes, even if an old tab still has the previous career in memory.
const CURRENT_DB='esports-manager-beta-1.1';
const LEGACY_DB='esports-manager-beta';
const META='rollouts';
const RESET_KEY='general-progress-reset-2026-11';
type ResetState='pending'|'done';

function openDatabase(name:string):Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(name,2);
  let blocked=false;
  request.onblocked=()=>{
   blocked=true;
   reject(new Error('Feche as outras abas do NEXUS e tente novamente para liberar o armazenamento.'));
  };
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('workspace'))db.createObjectStore('workspace');
   if(name===CURRENT_DB&&!db.objectStoreNames.contains(META))db.createObjectStore(META);
  };
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
   const db=request.result;
   db.onversionchange=()=>db.close();
   if(blocked)db.close();
   else resolve(db);
  };
 });
}
function read<T>(request:IDBRequest<T>):Promise<T>{
 return new Promise((resolve,reject)=>{
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
function committed(tx:IDBTransaction):Promise<void>{
 return new Promise((resolve,reject)=>{
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error??new Error('A alteração do progresso local foi interrompida.'));
 });
}
function resetState(db:IDBDatabase):Promise<ResetState|undefined>{
 return read(db.transaction(META).objectStore(META).get(RESET_KEY));
}

async function prepare(db:IDBDatabase):Promise<ResetState>{
 const existing=await resetState(db);
 if(existing)return existing;

 const legacy=await openDatabase(LEGACY_DB);
 let legacyCount:number;
 try{legacyCount=await read(legacy.transaction('workspace').objectStore('workspace').count());}
 finally{legacy.close();}

 const tx=db.transaction([META,'workspace'],'readwrite'),meta=tx.objectStore(META);
 let state:ResetState;
 // Another tab may have prepared or completed the reset during the legacy read.
 const check=meta.get(RESET_KEY);
 check.onsuccess=()=>{
  if(check.result){state=check.result;return;}
  const count=tx.objectStore('workspace').count();
  count.onsuccess=()=>{
   state=legacyCount||count.result?'pending':'done';
   meta.put(state,RESET_KEY);
  };
 };
 await committed(tx);
 return state!;
}

export async function prepareProgressReset():Promise<ResetState>{
 const db=await openDatabase(CURRENT_DB);
 try{return await prepare(db);}finally{db.close();}
}

export async function openReadyWorkspace():Promise<IDBDatabase>{
 const db=await openDatabase(CURRENT_DB);
 try{
  if(await prepare(db)==='pending')throw new Error('Confirme o aviso antes de iniciar uma nova carreira.');
  return db;
 }catch(error){db.close();throw error;}
}

export async function confirmProgressReset():Promise<void>{
 const db=await openDatabase(CURRENT_DB);
 try{
  if(await prepare(db)==='done')return;
  // Legacy writers are fenced. If this step or the browser stops, the durable
  // pending marker keeps the game closed and confirmation can safely be retried.
  const legacy=await openDatabase(LEGACY_DB);
  try{
   const tx=legacy.transaction('workspace','readwrite');
   tx.objectStore('workspace').clear();
   await committed(tx);
  }finally{legacy.close();}
  const tx=db.transaction([META,'workspace'],'readwrite'),meta=tx.objectStore(META);
  const check=meta.get(RESET_KEY);
  check.onsuccess=()=>{
   if(check.result!=='pending')return;
   tx.objectStore('workspace').clear();
   meta.put('done',RESET_KEY);
  };
  await committed(tx);
 }finally{db.close();}
}
