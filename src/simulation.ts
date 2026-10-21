import {AGENTS,ABILITIES} from './abilities.ts';
import type {Slot} from './abilities.ts';
import {damage,professionalScore,probability} from './combat.ts';
import {randomStreams} from './random.ts';
import {mapEdges,edgeKey,shortestPath,mobilityTime,compareIds,clamp,integer,finite,WEAPONS,CADENCE_PRECISION,RANGE_SCORE,ROUND_MS,PLANT_MS,DEFUSE_MS,DETONATION_MS} from './rules.ts';
import type {Sector,Team} from './rules.ts';
import {decide} from './ai.ts';
import type {Area,Buff,Decision,Observation,Profile,PublicSelf,Sighting,SimEvent,SimulationOptions,SimulationResult,Unit} from './tactical-types.ts';
import {rangeFor} from './tactical-types.ts';

interface Scheduled {at:number;phase:number;kind:string;actor?:string;target?:string;token?:number;id?:string;decision?:Decision;}
interface Hit {actor:string;target:string;raw:number;kind:string;}
interface Explosion {owner:string;team:Team;sector:Sector;damage:number;targets:number;}
const other=(team:Team):Team=>team==='A'?'B':'A';
const round2=(x:number)=>Math.round(x*100)/100;

/** Deterministic simulation shared by server and browser worker. AI only receives Observation. */
export class TacticalRound {
  readonly options:SimulationOptions;
  readonly units:Unit[];
  readonly events:SimEvent[]=[];
  readonly areas:Area[]=[];
  readonly kills:Record<string,number>={};
  readonly abilityUses:Record<string,number>={};
  readonly rng:ReturnType<typeof randomStreams>;
  now=0;processed=0;
  result:SimulationResult|null=null;
  planted:{sector:Sector;deadline:number}|null=null;
  #queue:Scheduled[]=[];
  #serial=0;
  #explosions=new Map<string,Explosion>();
  #knowledge:Record<Team,Map<string,Sighting>>={A:new Map(),B:new Map()};
  #presence:Record<Team,Map<Sector,{present:boolean;until:number}>>={A:new Map(),B:new Map()};
  #targets:Record<Team,'A'|'B'>;
  #targetChosen:Record<Team,boolean>={A:false,B:false};
  constructor(profiles:Profile[],options:SimulationOptions){
    if(profiles.length!==10||new Set(profiles.map(p=>p.id)).size!==10)throw new Error('Ten unique profiles required');
    mapEdges(options.map);integer(options.seed,1,0xffffffff,'seed');
    if(!['A','B'].includes(options.attacking))throw new Error('Invalid attack team');
    for(const t of ['A','B'] as const){
      const group=profiles.filter(p=>p.team===t);
      if(group.length!==5||new Set(group.map(p=>p.agent)).size!==5)throw new Error('Five unique agents per team required');
      const plan=options.plans[t];
      if(!plan||!['fast','control','split'].includes(plan.attack)||!['aggressive','balanced','retake'].includes(plan.defense)||!['A','B'].includes(plan.site))throw new Error('Invalid tactical plan');
    }
    this.options=structuredClone(options);this.rng=randomStreams(options.seed);
    this.#targets={A:options.plans.A.site,B:options.plans.B.site};
    this.units=structuredClone(profiles).sort((a,b)=>compareIds(a.id,b.id)).map((p)=>{
      if(!AGENTS.includes(p.agent)||!(p.weapon in WEAPONS)||p.attrs.length!==8||p.charges.length!==3||p.charges.some(c=>typeof c!=='boolean'))throw new Error('Invalid profile');
      p.attrs.forEach(v=>finite(v,1,100,'attribute'));[p.agentFamiliarity,p.mapFamiliarity,p.morale,p.fatigue].forEach(v=>finite(v,0,100,'condition'));
      finite(p.shield,0,50,'shield');integer(p.ult,0,8,'ultimate');
      const group=profiles.filter(q=>q.team===p.team).sort((a,b)=>compareIds(a.id,b.id));
      const index=group.findIndex(q=>q.id===p.id),attacking=p.team===options.attacking;
      // Retake keeps a reserve in mid and one anchor at each site, instead of
      // stacking all five in spawn and forcing an exposed full-team rotation.
      const retake=options.plans[p.team].defense==='retake';
      let sector:Sector=attacking?'attack':retake?(index===0?'A':index===1?'B':'mid'):index<2?'A':index<4?'B':'mid';
      sector=options.initial?.[p.id]?.sector??sector;
      if(!['attack','defense','A','B','mid'].includes(sector))throw new Error('Invalid initial sector');
      const life=options.initial?.[p.id]?.life??10000;integer(life,1,10000,'life');
      return {...p,sector,vital:{life,shield:Math.round(p.shield*100),temporary:0,reduction:0},usedUlt:false,
        buffs:[],readyAt:0,action:null,movement:null,shotToken:0,shotTarget:null,nextDecision:0};
    });
    this.#schedule({at:ROUND_MS,phase:5,kind:'timeout'});
    if(options.ai!==false)this.#schedule({at:0,phase:4,kind:'think'});
    for(const s of options.script??[]){integer(s.at,0,140000,'script time');if(!this.get(s.actor))throw new Error('Unknown script actor');this.#schedule({at:s.at,phase:4,kind:'script',actor:s.actor,decision:s.decision});}
    this.#observeAll();this.#refreshShots();
  }
  get(id:string){return this.units.find(u=>u.id===id);}
  alive(team?:Team){return this.units.filter(u=>u.vital.life>0&&(!team||u.team===team));}
  #emit(e:Omit<SimEvent,'at'>){this.events.push({at:this.now,...e});}
  #schedule(e:Scheduled){integer(e.at,this.now,200000,'scheduled time');this.#queue.push(e);}
  #token(){return ++this.#serial;}
  #active(a:Area){return a.active&&a.until>this.now;}
  #adjacent(a:Sector,b:Sector){return mapEdges(this.options.map).some(([x,y])=>x===a&&y===b||x===b&&y===a);}
  #range(a:Unit,b:Unit){return rangeFor(this.options.map,b.movement?.to??b.sector);}
  #visible(a:Unit,b:Unit){
    if(a.vital.life<=0||b.vital.life<=0||a.team===b.team)return false;
    if(a.movement||b.movement){
      const m=a.movement??b.movement!,observer=a.movement?b:a;
      const observerMove=observer.movement;
      if(observerMove?edgeKey(observerMove.from,observerMove.to)!==edgeKey(m.from,m.to):observer.sector!==m.from&&observer.sector!==m.to)return false;
      return !this.areas.some(x=>this.#active(x)&&x.edges.includes(edgeKey(m.from,m.to))&&(x.kind==='smoke'||x.kind==='barrier'));
    }
    if(a.sector===b.sector)return true;
    if(!this.#adjacent(a.sector,b.sector))return false;
    const edge=edgeKey(a.sector,b.sector);
    return !this.areas.some(x=>this.#active(x)&&x.edges.includes(edge)&&(x.kind==='smoke'||x.kind==='barrier'));
  }
  #known(team:Team,id:string){return (this.#knowledge[team].get(id)?.until??0)>this.now;}
  #reveal(team:Team,u:Unit,ms:number,source:string,tracking=false){
    const prior=this.#knowledge[team].get(u.id);
    this.#knowledge[team].set(u.id,{id:u.id,sector:u.sector,until:Math.max(prior?.until??0,this.now+ms),trackingUntil:tracking?this.now+ms:prior?.trackingUntil,source});
    this.#emit({kind:'revealed',actor:u.id,sector:u.sector,team,detail:source});
  }
  #observeAll(){
    for(const u of this.alive())for(const e of this.alive(other(u.team)))if(this.#visible(u,e)){
      const prior=this.#knowledge[u.team].get(e.id);
      this.#knowledge[u.team].set(e.id,{id:e.id,sector:e.sector,until:Math.max(this.now+1000,prior?.until??0),trackingUntil:prior?.trackingUntil,source:'vision'});
    }
    for(const t of ['A','B'] as const)for(const sighting of this.#knowledge[t].values()){
      const u=this.get(sighting.id);if(u&&(sighting.trackingUntil??0)>this.now)sighting.sector=u.sector;
    }
  }
  #public(u:Unit):PublicSelf{return {id:u.id,team:u.team,agent:u.agent,sector:u.sector,life:u.vital.life,shield:u.vital.shield,
    charges:[...u.charges],ult:u.ult,usedUlt:u.usedUlt,ready:u.readyAt<=this.now,busy:!!u.action||!!u.movement,action:u.action?.kind??(u.movement?'move':null),
    tactical:{entry:this.#collectiveScore(u,[0,0,25,20,30,25,0,0]),retake:this.#collectiveScore(u,[0,0,0,30,25,25,20,0]),reading:u.attrs[3],communication:u.attrs[5],discipline:u.attrs[6]}};}
  #collectiveScore(u:Unit,weights:number[]){
    const condition={agent:u.agentFamiliarity,map:u.mapFamiliarity,morale:u.morale,fatigue:u.fatigue};
    const participants=this.alive(u.team).filter(a=>a.sector===u.sector).length;
    const bond=finite(this.options.teamwork?.[u.team]??50,0,100,'teamwork');
    return professionalScore(u.attrs,condition,weights)*(1+(participants>=2?bond/100*.08:0));
  }
  observeFor(id:string):Observation{
    const u=this.get(id);if(!u)throw new Error('Unknown observer');
    return {now:this.now,self:this.#public(u),allies:this.units.filter(x=>x.team===u.team&&x.id!==id).map(x=>this.#public(x)),
      visible:this.alive(other(u.team)).filter(x=>this.#visible(u,x)).map(x=>({id:x.id,sector:x.sector,action:x.action?.kind??null})),
      known:[...this.#knowledge[u.team].values()].filter(x=>x.until>this.now).map(x=>({id:x.id,sector:x.sector})),
      presence:[...this.#presence[u.team].entries()].filter(([,x])=>x.until>this.now).map(([sector,x])=>({sector,present:x.present})),
      devices:this.areas.filter(x=>this.#active(x)&&x.team!==u.team&&x.sector===u.sector&&['alarm','trap','barrier'].includes(x.kind)).map(x=>({id:x.id,kind:x.kind,sector:x.sector})),
      blocked:this.areas.filter(x=>this.#active(x)&&x.kind==='barrier'&&(x.team===u.team||this.alive(u.team).some(ally=>x.edges.some(edge=>edge.split(':').includes(ally.sector))))).flatMap(x=>x.edges),planted:structuredClone(this.planted),
      attacking:this.options.attacking,map:this.options.map,plan:structuredClone(this.options.plans[u.team]),attackTarget:this.#targets[u.team]};
  }
  #stopShot(u:Unit){u.shotToken++;u.shotTarget=null;}
  #canAct(u:Unit){return u.vital.life>0&&!u.action&&!u.movement;}
  #buff(u:Unit,kind:Buff['kind'],duration:number,value:number){
    // Strongest reduction only; identical shields replace rather than add.
    u.buffs.push({kind,until:this.now+duration,value});
    if(kind==='temporary')u.vital.temporary=Math.max(u.vital.temporary,value);
    this.#schedule({at:this.now+duration,phase:1,kind:'expire'});
  }
  #area(owner:Unit,kind:Area['kind'],sector:Sector,duration:number,value=0,edges:string[]=[]){
    const area:Area={id:`area:${this.#token()}`,owner:owner.id,team:owner.team,kind,sector,until:duration?this.now+duration:140001,edges,value,active:true};
    this.areas.push(area);if(duration)this.#schedule({at:area.until,phase:1,kind:'expire'});return area;
  }
  #travelFactor(u:Unit){
    const buffs=u.buffs.filter(b=>b.until>this.now);
    const speed=Math.min(1,...buffs.filter(b=>b.kind==='speed').map(b=>b.value));
    const slow=Math.max(1,...buffs.filter(b=>b.kind==='slow').map(b=>b.value),...this.areas.filter(a=>this.#active(a)&&a.team!==u.team&&a.sector===u.sector&&['slow','confinement'].includes(a.kind)).map(()=>1.5));
    return Math.round(clamp(speed*slow,.5,1.5)*10000);
  }
  #progress(to:number){
    for(const u of this.alive())if(u.movement){const m=u.movement,elapsed=to-m.updated,travel=m.remaining*m.factor/10000;
      if(elapsed>=travel){m.remaining=0;m.delay=Math.max(0,m.delay-(elapsed-travel));}
      else m.remaining=Math.max(0,m.remaining-elapsed*10000/m.factor);
      m.updated=to;
    }
  }
  #rescheduleMovement(){
    for(const u of this.alive())if(u.movement){const m=u.movement,factor=this.#travelFactor(u);if(factor!==m.factor){m.factor=factor;m.token=this.#token();this.#schedule({at:this.now+Math.ceil(m.remaining*factor/10000+m.delay),phase:1,kind:'arrive',actor:u.id,token:m.token});}}
  }
  #enforceBarriers(){
    for(const u of this.alive())if(u.movement&&this.areas.some(a=>this.#active(a)&&a.kind==='barrier'&&a.edges.includes(edgeKey(u.movement!.from,u.movement!.to)))){
      u.movement=null;this.#emit({kind:'move_blocked',actor:u.id,sector:u.sector});
    }
  }
  #startMove(u:Unit,to:Sector,kind?:'dash'|'step'){
    const edge=mapEdges(this.options.map).find(([a,b])=>a===u.sector&&b===to||b===u.sector&&a===to);
    if(!edge||this.areas.some(a=>this.#active(a)&&a.kind==='barrier'&&a.edges.includes(edgeKey(u.sector,to))))return false;
    const base=kind?mobilityTime(edge[2],kind):edge[2];
    const delay=this.areas.some(a=>this.#active(a)&&a.kind==='delay'&&a.team!==u.team&&a.edges.includes(edgeKey(u.sector,to)))?2000:0;
    const token=this.#token(),factor=this.#travelFactor(u);this.#stopShot(u);
    u.movement={from:u.sector,to,remaining:base,updated:this.now,factor,token,delay};
    this.#schedule({at:this.now+Math.ceil(base*factor/10000)+delay,phase:1,kind:'arrive',actor:u.id,token});
    this.#emit({kind:'move_start',actor:u.id,sector:to,detail:kind??'normal'});return true;
  }
  #arrive(u:Unit,to:Sector,step=false){
    u.sector=to;u.movement=null;u.action=null;
    const noDelay=u.buffs.some(b=>b.kind==='speed'&&b.value===.6&&b.until>this.now);
    u.readyAt=this.now+(noDelay?0:1000);this.#schedule({at:u.readyAt,phase:1,kind:'ready',actor:u.id});
    this.#emit({kind:'arrived',actor:u.id,sector:to});
    if(step){this.#presence[other(u.team)].set(to,{present:true,until:this.now+1000});this.#emit({kind:'arrival_signal',actor:u.id,sector:to});}
    for(const a of this.areas.filter(a=>this.#active(a)&&a.team!==u.team&&a.sector===to)){
      if(a.kind==='alarm'){this.#reveal(a.team,u,2000,'alarm');a.active=false;}
      if(a.kind==='trap'){this.#buff(u,'slow',3000,1.5);a.active=false;this.#emit({kind:'trap_triggered',actor:u.id,detail:a.id});}
      if(a.kind==='sensor')this.#reveal(a.team,u,1000,'sensor');
    }
  }
  #score(u:Unit){
    const active=u.buffs.filter(b=>b.until>this.now);
    const impairment=Math.max(0,...active.filter(b=>b.kind==='blind'||b.kind==='disorient').map(b=>b.value),...this.areas.filter(a=>this.#active(a)&&a.team!==u.team&&a.sector===u.sector&&a.kind==='confinement').map(a=>a.value));
    return professionalScore(u.attrs,{agent:u.agentFamiliarity,map:u.mapFamiliarity,morale:u.morale,fatigue:u.fatigue,impairment,positioning:Math.max(0,...active.filter(b=>b.kind==='position').map(b=>b.value))});
  }
  #refreshShots(){
    if(this.options.autoFire===false)return;
    for(const u of this.alive()){
      if(!this.#canAct(u)||u.readyAt>this.now){if(u.shotTarget)this.#stopShot(u);continue;}
      const visible=this.alive(other(u.team)).filter(e=>this.#visible(u,e)).sort((a,b)=>(a.sector===u.sector?-1:0)-(b.sector===u.sector?-1:0)||compareIds(a.id,b.id));
      const existing=visible.find(x=>x.id===u.shotTarget),target=existing??visible[0];
      if(!target){if(u.shotTarget)this.#stopShot(u);continue;}
      if(existing)continue;
      this.#stopShot(u);u.shotTarget=target.id;
      const cadence=u.weapon==='precision'?CADENCE_PRECISION[this.#range(u,target)]:WEAPONS[u.weapon].cadence;
      this.#schedule({at:this.now+cadence,phase:0,kind:'shot',actor:u.id,target:target.id,token:u.shotToken});
    }
  }
  #applyHits(hits:Hit[]){
    // Apply all damage from this timestamp before checking objective completions.
    for(const target of this.alive()){
      const incoming=hits.filter(h=>h.target===target.id);if(!incoming.length)continue;
      const reduction=Math.max(0,...this.areas.filter(a=>this.#active(a)&&!target.movement&&a.team===target.team&&a.kind==='safe'&&a.sector===target.sector).map(a=>a.value));
      const raw=incoming.reduce((s,h)=>s+h.raw,0),before=target.vital.life;
      target.vital=damage({...target.vital,reduction:Math.round(reduction*10000)},raw);
      for(const hit of incoming)this.#emit({kind:hit.kind,actor:hit.actor,target:target.id,amount:hit.raw,sector:target.sector});
      if(before>0&&target.vital.life===0){
        const killer=[...incoming].sort((a,b)=>b.raw-a.raw||compareIds(a.actor,b.actor))[0].actor;
        this.kills[killer]=(this.kills[killer]??0)+1;target.action=null;target.movement=null;target.buffs=[];target.vital.temporary=0;this.#stopShot(target);
        this.#emit({kind:'eliminated',actor:target.id,target:killer,team:target.team});
      }
    }
  }
  #finish(winner:Team,reason:string){
    if(this.result)return;
    this.#emit({kind:'round_end',team:winner,detail:reason});
    const actors=structuredClone(this.units).map(u=>{u.vital.temporary=0;u.vital.reduction=0;u.buffs=[];u.action=null;u.movement=null;return u;});
    this.result={winner,reason,at:this.now,actors,events:structuredClone(this.events),kills:{...this.kills},rng:{combat:this.rng.combat.state,decisions:this.rng.decisions.state},processed:this.processed,abilityUses:{...this.abilityUses}};
  }
  #checkEnd(){
    const attack=this.alive(this.options.attacking).length,defense=this.alive(other(this.options.attacking)).length;
    if(!attack&&!defense)this.#finish(this.planted?this.options.attacking:other(this.options.attacking),'mutual_elimination');
    else if(!defense)this.#finish(this.options.attacking,'defenders_eliminated');
    else if(!attack&&!this.planted)this.#finish(other(this.options.attacking),'attackers_eliminated');
  }
  #targetsIn(owner:Unit,sector:Sector,maximum:number,visual=false){
    return this.alive(other(owner.team)).filter(u=>!u.movement&&u.sector===sector&&(!visual||this.#visible(owner,u))).sort((a,b)=>compareIds(a.id,b.id)).slice(0,maximum);
  }
  #validCast(u:Unit,slot:Slot,sector:Sector,target?:string,edge?:[Sector,Sector]){
    const s=ABILITIES[u.agent][slot],adjacent=this.#adjacent(u.sector,sector),local=sector===u.sector;
    const t=target?this.get(target):undefined;
    if(slot===3?(u.ult<8||u.usedUlt):!u.charges[slot])return false;
    if(s.kind==='teleport')return !!t&&t.vital.life>0&&t.team===u.team&&t.sector===sector;
    if(s.kind==='fortress'||s.kind==='speed'||s.kind==='position'||s.kind==='sweep')return true;
    if(s.kind==='guard')return !!t&&t.team===u.team&&t.vital.life>0&&t.sector===u.sector;
    if(s.kind==='track')return !!t&&t.team!==u.team&&t.vital.life>0&&this.#known(u.team,t.id);
    if(s.kind==='interrupt')return !!t&&t.team!==u.team&&t.vital.life>0&&t.sector===u.sector&&this.#known(u.team,t.id)&&!!t.action;
    if(['alarm','trap','safe'].includes(s.kind))return local;
    if(['dash','step','scan'].includes(s.kind))return adjacent;
    if((u.agent==='Estalo'&&slot===3||u.agent==='Pulso'&&slot===3||u.agent==='Farol'&&slot===2)&&!adjacent)return false;
    if(!local&&!adjacent)return false;
    if(['blind','disorient'].includes(s.kind))return this.#targetsIn(u,sector,s.targets,s.kind==='blind').some(t=>this.#known(u.team,t.id));
    if(s.kind==='smoke'&&u.agent==='Bruma'&&slot===3)return true;
    if(['smoke','barrier','delay'].includes(s.kind))return !!edge&&this.#adjacent(edge[0],edge[1])&&(edge[0]===sector||edge[1]===sector)&&(u.agent==='Bruma'&&slot===0||edge.includes(u.sector));
    return true;
  }
  issue(id:string,d:Decision):boolean{
    if(this.result)return false;const u=this.get(id);if(!u)return false;
    if(u.movement&&d.kind==='move'&&d.to!==u.movement.to){
      if(!this.#adjacent(u.sector,d.to))return false;
      u.movement=null;this.#emit({kind:'move_cancelled',actor:id,sector:u.sector});
    }
    if(!this.#canAct(u))return false;
    if(d.kind==='wait')return true;
    if(d.kind==='move')return this.#startMove(u,d.to);
    if(d.kind==='cast'){
      if(![0,1,2,3].includes(d.slot))return false;
      const sector=d.sector??u.sector;
      if(!this.#validCast(u,d.slot,sector,d.target,d.edge))return false;
      this.#stopShot(u);const token=this.#token();u.action={kind:'cast',token,slot:d.slot,sector,target:d.target,edge:d.edge};
      this.#schedule({at:this.now+ABILITIES[u.agent][d.slot].cast,phase:2,kind:'complete',actor:id,token});
      this.#emit({kind:'cast_start',actor:id,ability:ABILITIES[u.agent][d.slot].name,sector});return true;
    }
    if(d.kind==='plant'){
      if(u.team!==this.options.attacking||!['A','B'].includes(u.sector)||this.planted||this.now+PLANT_MS>ROUND_MS||this.units.some(x=>x.action?.kind==='plant'))return false;
    }else if(d.kind==='defuse'){
      if(u.team===this.options.attacking||!this.planted||u.sector!==this.planted.sector||this.now+DEFUSE_MS>this.planted.deadline||this.units.some(x=>x.action?.kind==='defuse'))return false;
    }else if(d.kind==='destroy'){
      const device=this.areas.find(a=>a.id===d.device&&this.#active(a)&&a.team!==u.team&&(a.sector===u.sector||a.kind==='barrier'&&a.edges.some(e=>e.split(':').includes(u.sector))));
      if(!device||!['alarm','trap','barrier'].includes(device.kind))return false;
    }else return false;
    this.#stopShot(u);const token=this.#token();u.action={kind:d.kind,token,device:d.kind==='destroy'?d.device:undefined};
    const duration=d.kind==='plant'?PLANT_MS:d.kind==='defuse'?DEFUSE_MS:this.areas.find(a=>a.id===(d as {device:string}).device)?.kind==='barrier'?2000:1000;
    this.#schedule({at:this.now+duration,phase:3,kind:'complete',actor:id,token});this.#emit({kind:`${d.kind}_start`,actor:id});return true;
  }
  #resolveAbility(u:Unit,slot:Slot,sector:Sector,target?:string,edge?:[Sector,Sector]){
    const s=ABILITIES[u.agent][slot];
    if(slot===3){u.ult-=8;u.usedUlt=true;}else u.charges[slot]=false;
    this.abilityUses[s.name]=(this.abilityUses[s.name]??0)+1;this.#emit({kind:'cast_complete',actor:u.id,ability:s.name,sector});
    const t=target?this.get(target):undefined;
    switch(s.kind){
      case 'blind':case 'disorient':
        for(const e of this.#targetsIn(u,sector,s.targets,s.kind==='blind'))this.#buff(e,s.kind,s.duration,s.value);break;
      case 'blast':{
        const id=`blast:${this.#token()}`;this.#explosions.set(id,{owner:u.id,team:u.team,sector,damage:s.value,targets:s.targets});
        this.#emit({kind:'blast_warning',actor:u.id,sector,detail:String(s.warning)});this.#schedule({at:this.now+s.warning,phase:0,kind:'blast',id});break;
      }
      case 'dash':case 'step':
        if(this.#startMove(u,sector,s.kind)){
          // Arrival signal is carried by the movement's completion event.
          u.movement!.step=s.kind==='step';
        }break;
      case 'speed':case 'position':this.#buff(u,s.kind,s.duration,s.value);break;
      case 'teleport':if(t&&t.team===u.team&&t.vital.life>0&&t.sector===sector)this.#arrive(u,sector,true);break;
      case 'scan':{
        const area=this.#area(u,'scan',sector,s.duration);this.#schedule({at:this.now,phase:4,kind:'scanTick',id:area.id});break;
      }
      case 'track':if(t&&t.vital.life>0)this.#reveal(u.team,t,s.duration,'track',true);break;
      case 'sweep':{
        const area=this.#area(u,'scan',u.sector,s.duration);area.value=1;this.#schedule({at:this.now,phase:4,kind:'scanTick',id:area.id});break;
      }
      case 'interrupt':if(t&&t.team!==u.team&&t.sector===u.sector&&t.action){t.action=null;this.#emit({kind:'interrupted',actor:u.id,target:t.id});}break;
      case 'smoke':{
        let edges:string[]=[];
        if(u.agent==='Bruma'&&slot===3){
          const covered=[sector,...(this.#adjacent(sector,u.sector)?[u.sector]:[])].slice(0,2);
          edges=mapEdges(this.options.map).filter(([a,b])=>covered.includes(a)||covered.includes(b)).map(([a,b])=>edgeKey(a,b));
        }else if(edge){
          edges=[edgeKey(...edge)];
          if(s.targets===2){const more=mapEdges(this.options.map).find(([a,b])=>(a===sector||b===sector)&&edgeKey(a,b)!==edges[0]);if(more)edges.push(edgeKey(more[0],more[1]));}
        }
        this.#area(u,'smoke',sector,s.duration,0,edges);break;
      }
      case 'zone':{
        const area=this.#area(u,'zone',sector,s.duration,s.value);for(let offset=0;offset<5000;offset+=1000)this.#schedule({at:this.now+offset,phase:0,kind:'zoneTick',id:area.id});break;
      }
      case 'slow':case 'safe':case 'confinement':case 'sensor':this.#area(u,s.kind,sector,s.duration,s.value);break;
      case 'alarm':case 'trap':if(!this.areas.some(a=>this.#active(a)&&a.owner===u.id&&a.kind===s.kind))this.#area(u,s.kind,u.sector,0);break;
      case 'barrier':case 'delay':if(edge)this.#area(u,s.kind,u.sector,s.duration,s.value,[edgeKey(...edge)]);break;
      case 'guard':if(t&&t.vital.life>0&&t.team===u.team&&t.sector===u.sector)this.#buff(t,'temporary',s.duration,s.value);break;
      case 'fortress':for(const a of this.alive(u.team))this.#buff(a,'temporary',s.duration,s.value);break;
    }
  }
  #think(){
    this.#observeAll();
    for(const team of ['A','B'] as const)if(team===this.options.attacking&&!this.#targetChosen[team]&&this.now>=10000&&this.options.plans[team].attack==='control'){
      const ranked=this.alive(team).sort((a,b)=>(b.attrs[3]*.35+b.attrs[5]*.30+b.attrs[6]*.20+b.attrs[7]*.15)-(a.attrs[3]*.35+a.attrs[5]*.30+a.attrs[6]*.20+a.attrs[7]*.15));
      const igl=ranked.find(p=>p.igl)??ranked[0];
      const known=[...this.#knowledge[team].values()].filter(s=>s.until>this.now);
      const presence=[...this.#presence[team].entries()].filter(([,s])=>s.until>this.now);
      if(igl&&(known.length||presence.length)&&this.rng.decisions.chance(Math.round(igl.attrs[3]*100))){
        const count=(site:Sector)=>known.filter(s=>s.sector===site).length+(presence.some(([sector,s])=>sector===site&&s.present)?1:0);
        if(count('A')!==count('B')){this.#targets[team]=count('A')<count('B')?'A':'B';this.#targetChosen[team]=true;this.#emit({kind:'igl_call',actor:igl.id,sector:this.#targets[team],detail:'observed presence'});}
      }
    }
    for(const u of this.alive()){
      if(u.nextDecision>this.now||!this.#canAct(u))continue;
      const decision=decide(this.observeFor(u.id),this.rng.decisions);this.issue(u.id,decision);
      // Professional discipline affects execution timing; no hidden attribute bonuses.
      u.nextDecision=this.now+Math.round(300+(100-u.attrs[6])*3+(100-u.attrs[5])*2);
    }
    this.#schedule({at:this.now+250,phase:4,kind:'think'});
  }
  #processDamage(batch:Scheduled[]){
    const hits:Hit[]=[];
    for(const e of batch){
      if(e.kind==='shot'){
        const u=this.get(e.actor!),t=this.get(e.target!);
        if(!u||!t||e.token!==u.shotToken||!this.#canAct(u)||u.readyAt>this.now||!this.#visible(u,t)){if(u&&e.token===u.shotToken)this.#stopShot(u);continue;}
        const range=this.#range(u,t),a=this.#score(u)+(u.weapon==='precision'?RANGE_SCORE[range]:0),b=this.#score(t)+(t.weapon==='precision'?RANGE_SCORE[range]:0);
        const hit=this.rng.combat.chance(probability(a,b));this.#emit({kind:'shot',actor:u.id,target:t.id,detail:hit?'hit':'miss'});
        if(hit)hits.push({actor:u.id,target:t.id,raw:WEAPONS[u.weapon].damage*100,kind:'weapon_damage'});
        const cadence=u.weapon==='precision'?CADENCE_PRECISION[range]:WEAPONS[u.weapon].cadence;
        this.#schedule({at:this.now+cadence,phase:0,kind:'shot',actor:u.id,target:t.id,token:u.shotToken});
      }else if(e.kind==='blast'){
        const blast=this.#explosions.get(e.id!);if(!blast)continue;
        const owner=this.get(blast.owner)!;
        // Placed explosives persist after death and re-evaluate occupancy at detonation.
        for(const t of this.#targetsIn(owner,blast.sector,blast.targets))hits.push({actor:blast.owner,target:t.id,raw:blast.damage,kind:'blast_damage'});
        this.#explosions.delete(e.id!);
      }else if(e.kind==='zoneTick'){
        const area=this.areas.find(a=>a.id===e.id);if(!area||!this.#active(area))continue;
        for(const t of this.alive(other(area.team)).filter(u=>!u.movement&&u.sector===area.sector))hits.push({actor:area.owner,target:t.id,raw:area.value,kind:'zone_damage'});
      }
    }
    this.#applyHits(hits);
  }
  #process(e:Scheduled){
    if(e.kind==='think'){this.#think();return;}
    if(e.kind==='script'){this.issue(e.actor!,e.decision!);return;}
    if(e.kind==='timeout'){if(!this.planted)this.#finish(other(this.options.attacking),'time_expired');return;}
    if(e.kind==='detonate'){if(this.planted)this.#finish(this.options.attacking,'detonation');return;}
    if(e.kind==='scanTick'){
      const area=this.areas.find(a=>a.id===e.id);if(!area||!this.#active(area))return;
      if(area.value===1){for(const enemy of this.alive(other(area.team)))this.#reveal(area.team,enemy,1000,'sweep');}
      else this.#presence[area.team].set(area.sector,{present:this.alive(other(area.team)).some(x=>x.sector===area.sector),until:area.until});
      if(this.now+1000<area.until)this.#schedule({at:this.now+1000,phase:4,kind:'scanTick',id:area.id});return;
    }
    const u=e.actor?this.get(e.actor):undefined;if(!u||u.vital.life<=0)return;
    if(e.kind==='arrive'){
      const movement=u.movement;if(!movement||movement.token!==e.token)return;
      this.#arrive(u,movement.to,!!movement.step);return;
    }
    if(e.kind==='complete'){
      const action=u.action;if(!action||action.token!==e.token)return;u.action=null;
      if(action.kind==='cast')this.#resolveAbility(u,action.slot!,action.sector!,action.target,action.edge);
      else if(action.kind==='plant'&&!this.planted){
        this.planted={sector:u.sector,deadline:this.now+DETONATION_MS};this.#emit({kind:'planted',actor:u.id,sector:u.sector});this.#schedule({at:this.planted.deadline,phase:5,kind:'detonate'});
      }else if(action.kind==='defuse'&&this.planted){this.#emit({kind:'defused',actor:u.id});this.#finish(other(this.options.attacking),'defused');}
      else if(action.kind==='destroy'){
        const device=this.areas.find(a=>a.id===action.device);if(device&&this.#active(device)){device.active=false;this.#emit({kind:'destroyed',actor:u.id,detail:device.id});}
      }
    }
  }
  advance(until:number){
    integer(until,this.now,140001,'advance time');
    while(this.#queue.length&&!this.result){
      this.#queue.sort((a,b)=>a.at-b.at||a.phase-b.phase||compareIds(a.actor??a.id??'',b.actor??b.id??''));
      if(this.#queue[0].at>until)break;
      const at=this.#queue[0].at;this.#progress(at);this.now=at;
      for(const u of this.units){
        if(!u.buffs.some(b=>b.kind==='temporary'&&b.until>this.now))u.vital.temporary=0;
        u.buffs=u.buffs.filter(b=>b.until>this.now);
      }
      while(this.#queue.some(e=>e.at===at)&&!this.result){
        this.#queue.sort((a,b)=>a.at-b.at||a.phase-b.phase||compareIds(a.actor??a.id??'',b.actor??b.id??''));
        const first=this.#queue.shift()!;if(++this.processed>100000)throw new Error('Round event limit');
        if(first.phase===0){
          const batch=[first];while(this.#queue[0]?.at===at&&this.#queue[0]?.phase===0)batch.push(this.#queue.shift()!);
          this.processed+=batch.length-1;this.#processDamage(batch);
        }else if(first.phase===2){
          const batch=[first];while(this.#queue[0]?.at===at&&this.#queue[0]?.phase===2)batch.push(this.#queue.shift()!);
          this.processed+=batch.length-1;
          // Resolve interruptions and visual blockers before other casts. Damage created
          // by completed casts is applied after this group and before objective completion.
          const priority=(e:Scheduled)=>{const u=e.actor?this.get(e.actor):null,slot=u?.action?.slot;
            const kind=u&&slot!==undefined?ABILITIES[u.agent][slot].kind:'';return kind==='interrupt'?0:kind==='smoke'||kind==='barrier'?1:2;};
          batch.sort((a,b)=>priority(a)-priority(b)||compareIds(a.actor??'',b.actor??''));
          for(const e of batch)this.#process(e);
        }else this.#process(first);
        this.#enforceBarriers();this.#rescheduleMovement();this.#observeAll();this.#refreshShots();
      }
      if(!this.result)this.#checkEnd();
    }
    if(!this.result){this.#progress(until);this.now=until;this.#observeAll();}
    return this.result;
  }
  run(){this.advance(140001);if(!this.result)throw new Error('Non-terminating round');return this.result;}
}

export function simulateRound(profiles:Profile[],options:SimulationOptions){return new TacticalRound(profiles,options).run();}
