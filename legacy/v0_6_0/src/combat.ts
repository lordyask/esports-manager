import {WEAPONS, CADENCE_PRECISION, RANGE_SCORE, clamp, integer, finite} from './rules.ts';
import type {Attributes, Weapon, Range} from './rules.ts';
import {Random} from './random.ts';
export interface Vital {life: number; shield: number; temporary: number; reduction: number;}
export interface Condition {agent: number; map: number; morale: number; fatigue: number; impairment?: number; positioning?: number;}
export function damage(v: Vital, raw: number): Vital {
  integer(raw,0,100000000,'raw damage in hundredths');
  integer(v.life,0,10000,'life');integer(v.shield,0,5000,'shield');integer(v.temporary,0,2500,'temporary shield');
  integer(v.reduction,0,10000,'damage reduction');
  const out={...v};let left=Math.round(raw*(10000-v.reduction)/10000);
  for(const field of ['temporary','shield','life'] as const){const used=Math.min(out[field],left);out[field]-=used;left-=used;}
  return out;
}
export function professionalScore(attrs: Attributes, c: Condition, weights=[45,15,25,15,0,0,0,0]): number {
  if(attrs.length!==8 || weights.length!==8 || weights.reduce((a,b)=>a+b,0)!==100)throw new Error('Invalid attribute weights');
  attrs.forEach(x=>finite(x,1,100,'attribute')); [c.agent,c.map,c.morale,c.fatigue].forEach(x=>finite(x,0,100,'condition'));
  const base=attrs.reduce((s,a,i)=>s+(a+(i===2?(c.positioning??0):0))*weights[i]/100,0);
  const modifier=(c.agent-50)*.0016+(c.map-50)*.001+(c.morale-50)*.001-Math.max(0,c.fatigue-40)/60*.10;
  return base*(1+modifier)*(1-finite(c.impairment??0,0,.25,'impairment'));
}
export function probability(score: number, enemy: number): number {
  if(!Number.isFinite(score)||!Number.isFinite(enemy))throw new Error('Invalid score');
  return Math.round(clamp(5000+50*(score-enemy),1000,9000));
}
export interface Duelist {id: string; score: number; weapon: Weapon; vital: Vital;}
export interface Shot {at: number; actor: string; target: string; hit: boolean; damage: number;}
// An isolated duel kernel. Map visibility and commands are separate layers.
export function duel(a: Duelist,b: Duelist,range: Range,random: Random) {
  if(a.id===b.id || !(range in RANGE_SCORE) || !(a.weapon in WEAPONS) || !(b.weapon in WEAPONS))throw new Error('Invalid duel');
  const actors=structuredClone([a,b]).sort((x,y)=>x.id<y.id?-1:1);
  actors.forEach(x=>{damage(x.vital,0);finite(x.score,0,1000,'score');if(x.vital.life===0)throw new Error('Eliminated actor');});
  const cadence=actors.map(x=>x.weapon==='precision'?CADENCE_PRECISION[range]:WEAPONS[x.weapon].cadence);
  const scores=actors.map(x=>x.score+(x.weapon==='precision'?RANGE_SCORE[range]:0));
  const next=[...cadence],shots: Shot[]=[];
  let at=0;
  while(actors.every(x=>x.vital.life>0)) {
    at=Math.min(...next);if(at>1000000)throw new Error('Duel event limit');
    const pending=[0,0];
    for(let i=0;i<2;i++)if(next[i]===at){
      const hit=random.chance(probability(scores[i],scores[1-i]));
      const raw=hit?WEAPONS[actors[i].weapon].damage*100:0;pending[1-i]+=raw;
      shots.push({at,actor:actors[i].id,target:actors[1-i].id,hit,damage:raw});next[i]+=cadence[i];
    }
    // Both attempts were validated before applying either result.
    actors.forEach((x,i)=>x.vital=damage(x.vital,pending[i]));
  }
  return {actors,shots,at,winner:actors.find(x=>x.vital.life>0)?.id??null,rngState:random.state};
}
