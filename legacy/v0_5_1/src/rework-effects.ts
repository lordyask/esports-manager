import type {ReworkKind} from './abilities.ts';
import type {Sector,Team} from './rules.ts';
import {edgeKey} from './rules.ts';
import type {Unit} from './tactical-types.ts';
export interface ReworkEffect {id:string;kind:ReworkKind;ability:string;owner:string;team:Team;sector:Sector;edges:[Sector,Sector][];target?:string;activeAt:number;until:number;active:boolean;value:number;capacity?:number;neutralizeMs?:number;}
export interface DamageHit {actor:string;target:string;raw:number;kind:string;}
export const activeEffect=(e:ReworkEffect,now:number)=>e.active&&e.activeAt<=now&&e.until>now;
export const presentEffect=(e:ReworkEffect,now:number)=>e.active&&e.until>now;
export const validLink=(e:ReworkEffect,units:Unit[])=>{const owner=units.find(u=>u.id===e.owner),target=units.find(u=>u.id===e.target);return !!owner&&!!target&&owner.vital.life>0&&target.vital.life>0&&!owner.movement&&!target.movement&&owner.sector===e.sector&&target.sector===e.sector;};
export function visionBlocked(effects:ReworkEffect[],now:number,observer:Team,edge:string){return effects.some(e=>activeEffect(e,now)&&e.edges.some(([a,b])=>edgeKey(a,b)===edge)&&(e.kind==='optical_wall'||e.kind==='refraction'||e.kind==='optical_filter'&&e.team!==observer));}
export function opticalPenalty(effects:ReworkEffect[],now:number,u:Unit){return u.movement?0:Math.max(0,...effects.filter(e=>activeEffect(e,now)&&e.team!==u.team&&e.sector===u.sector&&(e.kind==='distortion'||e.kind==='refraction')).map(e=>e.value));}
export function eligibleProtection(e:ReworkEffect,h:DamageHit,units:Unit[],now:number){
 if(!activeEffect(e,now)||!e.capacity)return false;const target=units.find(u=>u.id===h.target),source=units.find(u=>u.id===h.actor);if(!target||!source||target.team!==e.team||source.team===e.team)return false;
 if(e.kind==='interposition')return e.target===target.id&&validLink(e,units)&&['weapon_damage','blast_damage'].includes(h.kind);
 if(h.kind!=='weapon_damage')return false;
 if(e.kind==='route_cover')return !!target.movement&&e.edges.some(([a,b])=>edgeKey(a,b)===edgeKey(target.movement!.from,target.movement!.to));
 if((e.kind==='cover'||e.kind==='redoubt')&&!target.movement&&target.sector===e.sector)return e.edges.some(([a,b])=>{const outside=a===e.sector?b:a;return source.movement?source.movement.from===outside&&source.movement.to===e.sector:source.sector===outside;});
 return false;
}
/** Select one nominal rate per hit, then share each finite pool fairly across this timestamp. */
export function protectHits(hits:DamageHit[],effects:ReworkEffect[],units:Unit[],now:number,compare:(a:string,b:string)=>number=(a,b)=>a.localeCompare(b)){
 const output=hits.map(h=>({...h})),groups=new Map<ReworkEffect,{index:number;wanted:number;key:string}[]>();
 for(let i=0;i<hits.length;i++){const h=hits[i],e=effects.filter(e=>eligibleProtection(e,h,units,now)).sort((a,b)=>b.value-a.value||a.until-b.until||compare(a.id,b.id))[0];if(!e)continue;const item={index:i,wanted:Math.round(h.raw*e.value/10000),key:`${h.actor}:${h.target}:${h.kind}`};groups.set(e,[...(groups.get(e)??[]),item]);}
 const absorbed:{effect:ReworkEffect;actor:string;target:string;raw:number;amount:number}[]=[];
 for(const [effect,items] of groups){const total=items.reduce((n,x)=>n+x.wanted,0),budget=Math.min(effect.capacity!,total);if(!total)continue;
  const allocation=items.map(x=>({...x,value:Math.floor(x.wanted*budget/total),remainder:x.wanted*budget%total}));let left=budget-allocation.reduce((n,x)=>n+x.value,0);
  for(const x of [...allocation].sort((a,b)=>b.remainder-a.remainder||compare(a.key,b.key))){if(left<=0)break;x.value++;left--;}
  for(const x of allocation){output[x.index].raw-=x.value;if(x.value)absorbed.push({effect,actor:hits[x.index].actor,target:hits[x.index].target,raw:hits[x.index].raw,amount:x.value});}
  effect.capacity!-=budget;
 }
 return {hits:output,absorbed};
}
