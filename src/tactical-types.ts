import type {Attributes,MapId,Range,Sector,Team,Weapon} from './rules.ts';
import type {Actor,RoundEvent,RoundResult} from './round.ts';
import type {Agent,Slot} from './abilities.ts';
export type AttackPlan='fast'|'control'|'split'|'feint';
export type DefensePlan='aggressive'|'balanced'|'retake'|'reading';
export type TacticalRole='Entry'|'Second'|'Support'|'Anchor'|'Lurker'|'Main OP';
export interface TeamPlan {attack:AttackPlan;defense:DefensePlan;site:'A'|'B';attackInstruction?:'none'|'trade'|'utility'|'preserve';defenseInstruction?:'none'|'trade'|'cautious'|'resources';}
export interface Profile {id:string;team:Team;agent:Agent;attrs:Attributes;agentFamiliarity:number;mapFamiliarity:number;morale:number;fatigue:number;weapon:Weapon;shield:number;charges:[boolean,boolean,boolean];ult:number;igl?:boolean;role?:TacticalRole;}
export interface Buff {kind:'blind'|'disorient'|'speed'|'position'|'slow'|'temporary';until:number;value:number;}
export interface Movement {from:Sector;to:Sector;remaining:number;updated:number;factor:number;token:number;delay:number;step?:boolean;}
export interface Unit extends Actor {igl?:boolean;role?:TacticalRole;agent:Agent;attrs:Attributes;agentFamiliarity:number;mapFamiliarity:number;morale:number;fatigue:number;weapon:Weapon;buffs:Buff[];readyAt:number;action:ActionState|null;movement:Movement|null;shotToken:number;shotTarget:string|null;nextDecision:number;}
export interface ActionState {kind:'plant'|'defuse'|'cast'|'destroy';token:number;slot?:Slot;target?:string;sector?:Sector;edge?:[Sector,Sector];device?:string;}
export interface Area {id:string;kind:'smoke'|'zone'|'slow'|'safe'|'scan'|'sensor'|'alarm'|'trap'|'delay'|'confinement'|'barrier';team:Team;owner:string;sector:Sector;until:number;edges:string[];value:number;active:boolean;}
export interface Sighting {id:string;sector:Sector;until:number;trackingUntil?:number;source:string;}
export interface PublicSelf {id:string;team:Team;agent:Agent;sector:Sector;life:number;shield:number;charges:[boolean,boolean,boolean];ult:number;usedUlt:boolean;ready:boolean;busy:boolean;action:string|null;role?:TacticalRole;slot?:number;tactical:{entry:number;retake:number;reading:number;communication:number;discipline:number};}
export interface Observation {now:number;self:PublicSelf;allies:PublicSelf[];visible:{id:string;sector:Sector;action:string|null}[];known:{id:string;sector:Sector}[];presence:{sector:Sector;present:boolean}[];devices:{id:string;kind:string;sector:Sector}[];blocked:string[];planted:{sector:Sector;deadline:number}|null;attacking:Team;map:MapId;plan:TeamPlan;attackTarget:'A'|'B';}
export type Decision={kind:'wait'}|{kind:'move';to:Sector}|{kind:'plant'|'defuse'}|{kind:'destroy';device:string}|{kind:'cast';slot:Slot;sector?:Sector;target?:string;edge?:[Sector,Sector]};
export interface SimEvent extends RoundEvent {sector?:Sector;ability?:string;amount?:number;team?:Team;}
export interface SimulationResult extends RoundResult {events:SimEvent[];kills:Record<string,number>;rng:{combat:number;decisions:number};processed:number;abilityUses:Record<string,number>;}
export interface SimulationOptions {map:MapId;attacking:Team;seed:number;plans:Record<Team,TeamPlan>;teamwork?:Partial<Record<Team,number>>;ai?:boolean;autoFire?:boolean;initial?:Partial<Record<string,{sector?:Sector;life?:number}>>;script?:{at:number;actor:string;decision:Decision}[];}
export const rangeFor=(map:MapId,sector:Sector):Range=>sector==='mid'?'medium':map==='patio'?'short':map==='horizonte'?'long':'medium';
