import {sha256} from './hash.ts';
import {integer} from './rules.ts';
export class Conflict extends Error {}
interface Career {owner: string; revision: number; state: unknown; receipts: Map<string,{digest: string; result: unknown}>;}
// Executable specification of the CAS/idempotency contract, NOT a database adapter.
// PostgreSQL must atomically persist the receipt, ledger and state in one transaction.
export class MemoryCommands {
  #careers=new Map<string,Career>();
  create(id: string,owner: string,state: unknown){
    if(!id||!owner||this.#careers.has(id))throw new Error('Invalid career');
    this.#careers.set(id,{owner,revision:0,state:structuredClone(state),receipts:new Map()});
  }
  #owned(id:string,user:string){const c=this.#careers.get(id);if(!c||c.owner!==user)throw new Error('Forbidden');return c;}
  read(id:string,user:string){const c=this.#owned(id,user);return {revision:c.revision,state:structuredClone(c.state)};}
  async execute(id:string,user:string,commandId:string,revision:number,payload:unknown,compute:(state:unknown)=>unknown|Promise<unknown>){
    integer(revision,0,1e12,'revision');if(!commandId)throw new Error('Command ID required');
    const c=this.#owned(id,user),digest=sha256(JSON.stringify(payload));
    const cached=()=>{const prior=c.receipts.get(commandId);if(prior&&prior.digest!==digest)throw new Conflict('Command ID reused');return prior;};
    const prior=cached();if(prior)return structuredClone(prior.result);
    if(c.revision!==revision)throw new Conflict('Stale revision');
    const next=await compute(structuredClone(c.state));
    const duplicate=cached();if(duplicate)return structuredClone(duplicate.result);
    if(c.revision!==revision)throw new Conflict('Concurrent command');
    const result={revision:revision+1,state:structuredClone(next)};
    c.state=structuredClone(next);c.revision++;c.receipts.set(commandId,{digest,result:structuredClone(result)});
    return result;
  }
}
