import {ROUND_MS, PLANT_MS, DEFUSE_MS, DETONATION_MS, integer, ENGINE_VERSION, RULES_VERSION, compareIds} from './rules.ts';
import type {Team,Sector} from './rules.ts';
import {damage} from './combat.ts';
import type {Vital} from './combat.ts';
export interface Actor {id: string; team: Team; sector: Sector; vital: Vital; charges: [boolean,boolean,boolean]; ult: number; usedUlt: boolean;}
export type RoundCommand =
  | {at: number; kind: 'damage'; actor: string; target: string; amount: number}
  | {at: number; kind: 'plant' | 'defuse' | 'interrupt'; actor: string; target?: string}
  | {at: number; kind: 'cast'; actor: string; slot: 0|1|2|'ult'; duration?: number};
export interface RoundEvent {at: number; kind: string; actor?: string; target?: string; detail?: string;}
export interface RoundResult {winner: Team; reason: string; at: number; actors: Actor[]; events: RoundEvent[];}
interface Scheduled {at: number; phase: number; type: string; actor?: string; target?: string; amount?: number; token?: number; slot?: 0|1|2|'ult'; duration?: number;}
// Objective/action kernel. Commands are trusted server-generated events, never client authority.
// Damage events represent already validated hits. Ability effect selection is a future layer.
export function runRound(input: Actor[], attacking: Team, commands: RoundCommand[]): RoundResult {
  if(!['A','B'].includes(attacking)||input.length<2||new Set(input.map(a=>a.id)).size!==input.length)throw new Error('Invalid actors');
  const actors=structuredClone(input).sort((a,b)=>a.id<b.id?-1:1);
  for(const a of actors){
    if(!['A','B'].includes(a.team)||!['attack','defense','A','B','mid'].includes(a.sector)||a.vital.life<=0||a.charges.length!==3||a.charges.some(c=>typeof c!=='boolean'))throw new Error('Invalid actor state');
    integer(a.ult,0,8,'ultimate');damage(a.vital,0);
  }
  if(!actors.some(a=>a.team==='A')||!actors.some(a=>a.team==='B'))throw new Error('Both teams required');
  const defending: Team=attacking==='A'?'B':'A';
  const events: RoundEvent[]=[];
  const queue: Scheduled[]=[{at:ROUND_MS,phase:4,type:'timeout'}];
  const actions=new Map<string,{type: string; token: number; slot?: 0|1|2|'ult'}>();
  let serial=0, planted: {sector: Sector; deadline: number}|null=null;
  let result: RoundResult|undefined;
  const get=(id?: string)=>actors.find(a=>a.id===id);
  const live=(id?: string)=>{const a=get(id);return a&&a.vital.life>0?a:undefined;};
  const emit=(e: RoundEvent)=>events.push(e);
  const finish=(at:number,winner:Team,reason:string)=>{if(!result){emit({at,kind:'round_end',detail:reason});result={winner,reason,at,actors,events};}};
  const checkEliminations=(at: number)=>{
    const attackAlive=actors.some(a=>a.team===attacking&&a.vital.life>0);
    const defenseAlive=actors.some(a=>a.team===defending&&a.vital.life>0);
    if(!defenseAlive&&(!planted&&!attackAlive))finish(at,defending,'mutual_elimination_before_plant');
    else if(!defenseAlive)finish(at,attacking,'defenders_eliminated');
    else if(!attackAlive&&!planted)finish(at,defending,'attackers_eliminated');
  };
  for(const c of commands){
    integer(c.at,0,ROUND_MS+DETONATION_MS,'event time');
    if(!get(c.actor))throw new Error('Unknown actor');
    if(!['damage','plant','defuse','cast','interrupt'].includes(c.kind))throw new Error('Invalid command');
    if(c.kind==='damage'){
      integer(c.amount,0,100000000,'damage');const target=get(c.target);if(!target)throw new Error('Unknown target');
      if(target.team===get(c.actor)!.team)throw new Error('Friendly damage forbidden');
    }
    if(c.kind==='cast'){
      if(![0,1,2,'ult'].includes(c.slot))throw new Error('Invalid ability slot');
      if(c.duration!==undefined)integer(c.duration,1,100000,'cast duration');
    }
    if(c.kind==='interrupt' && !get(c.target))throw new Error('Unknown interruption target');
    queue.push({...c,type:c.kind,phase:c.kind==='damage'?0:c.kind==='interrupt'?1:3});
  }
  const reject=(at:number,actor:string|undefined,detail:string)=>emit({at,kind:'rejected',actor,detail});
  let processed=0;
  while(queue.length&&!result){
    queue.sort((a,b)=>a.at-b.at||a.phase-b.phase||compareIds(a.actor??'',b.actor??''));
    const at=queue[0].at;
    const batch=queue.splice(0,queue.findIndex(e=>e.at!==at)===-1?queue.length:queue.findIndex(e=>e.at!==at));
    if((processed+=batch.length)>100000)throw new Error('Event limit');
    // Validate every simultaneous hit against the same state before modifying life.
    const pending=new Map<string,number>();
    for(const e of batch.filter(e=>e.type==='damage')){
      if(!live(e.actor)||!live(e.target)||actions.has(e.actor!)) {reject(at,e.actor,'damage actor unavailable');continue;}
      pending.set(e.target!,(pending.get(e.target!)??0)+e.amount!);
      emit({at,kind:'damage',actor:e.actor,target:e.target,detail:String(e.amount)});
    }
    for(const [id,amount] of pending){const a=get(id)!;a.vital=damage(a.vital,amount);if(a.vital.life===0){actions.delete(id);emit({at,kind:'eliminated',actor:id});}}
    for(const e of batch.filter(e=>e.type!=='damage').sort((a,b)=>a.phase-b.phase||compareIds(a.actor??'',b.actor??''))){
      if(e.type==='timeout'){if(!planted)finish(at,defending,'time_expired');continue;}
      if(e.type==='detonate'){if(planted)finish(at,attacking,'detonation');continue;}
      const a=live(e.actor);if(!a){reject(at,e.actor,'actor eliminated');continue;}
      if(e.type==='interrupt'){
        const target=live(e.target);
        if(actions.has(a.id)||!target||target.team===a.team||target.sector!==a.sector){reject(at,a.id,'invalid interruption');continue;}
        actions.delete(target.id);emit({at,kind:'interrupted',actor:a.id,target:target.id});continue;
      }
      if(e.type==='complete'){
        const action=actions.get(a.id);if(!action||action.token!==e.token)continue;
        actions.delete(a.id);
        if(action.type==='plant'&&!planted){
          planted={sector:a.sector,deadline:at+DETONATION_MS};
          queue.push({at:planted.deadline,phase:4,type:'detonate'});emit({at,kind:'planted',actor:a.id});
        }else if(action.type==='defuse'&&planted){emit({at,kind:'defused',actor:a.id});finish(at,defending,'defused');}
        else if(action.type==='cast'){
          if(action.slot==='ult'){a.ult-=8;a.usedUlt=true;}else a.charges[action.slot!]=false;
          emit({at,kind:'cast_complete',actor:a.id,detail:String(action.slot)});
        }
        continue;
      }
      if(actions.has(a.id)){reject(at,a.id,'actor busy');continue;}
      let duration=0;
      if(e.type==='plant'){
        if(a.team!==attacking||!['A','B'].includes(a.sector)||planted||at+PLANT_MS>ROUND_MS||[...actions.values()].some(x=>x.type==='plant')){reject(at,a.id,'invalid plant');continue;}
        duration=PLANT_MS;
      }else if(e.type==='defuse'){
        if(a.team!==defending||!planted||a.sector!==planted.sector||at+DEFUSE_MS>planted.deadline||[...actions.values()].some(x=>x.type==='defuse')){reject(at,a.id,'invalid defuse');continue;}
        duration=DEFUSE_MS;
      }else if(e.type==='cast'){
        if(e.slot==='ult'?a.ult<8||a.usedUlt:!a.charges[e.slot!]){reject(at,a.id,'no ability resource');continue;}
        duration=e.duration??(e.slot==='ult'?1000:500);
      }
      actions.set(a.id,{type:e.type,token:++serial,slot:e.slot});
      queue.push({at:at+duration,phase:2,type:'complete',actor:a.id,token:serial});emit({at,kind:`${e.type}_start`,actor:a.id});
    }
    if(!result)checkEliminations(at);
  }
  if(!result)throw new Error('Round did not reach terminal state');
  return result;
}
export function serializeCheckpoint(state: unknown, randomState: unknown, commands: RoundCommand[], contentHash: string) {
  if(!contentHash)throw new Error('Content hash required');
  return JSON.stringify({engineVersion:ENGINE_VERSION,rulesVersion:RULES_VERSION,contentHash,state,randomState,commands});
}
