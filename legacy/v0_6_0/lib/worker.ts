import {advanceSession} from './game.ts';
import type {Session,RoundCommand} from './game.ts';
globalThis.onmessage=(e:MessageEvent<{id:string;session:Session;command:RoundCommand}>)=>{
 try{const session=advanceSession(e.data.session,e.data.command);globalThis.postMessage({id:e.data.id,session});}
 catch(error){globalThis.postMessage({id:e.data.id,error:error instanceof Error?error.message:String(error)});}
};
