import assert from 'node:assert/strict';
import {AGENTS} from '../src/abilities.ts';
import {professionalScore,probability} from '../src/combat.ts';
import type {Condition} from '../src/combat.ts';
import {TacticalRound} from '../src/simulation.ts';
import type {Profile,SimulationOptions,TeamPlan} from '../src/tactical-types.ts';
import type {Attributes,Sector,Team} from '../src/rules.ts';
import {profiles} from '../test/fixtures.ts';

export type Variant='equal'|'aim'|'movement'|'positioning'|'reading'|'utility'|'communication'|'discipline'|'emotion'|'combat';
export const condition:Condition={agent:85,map:50,morale:70,fatigue:10};
export function attributes(variant:Variant):Attributes {
 const a:Attributes=[60,60,60,60,60,60,60,60];
 const indexes={aim:0,movement:1,positioning:2,reading:3,utility:4,communication:5,discipline:6,emotion:7} as const;
 if(variant in indexes)a[indexes[variant as keyof typeof indexes]]=80;
 if(variant==='combat')a.splice(0,4,75,75,75,75);
 return a;
}

// Stationary 1v1 in the actual round resolver. The other eight actors stay in
// spawn, cannot see the duel and have no AI or abilities. The chance spy only
// records and delegates to the original random generator; it changes no rolls.
export function probe(seed:number,attacking:Team,site:'A'|'B',variant:Variant,boosted:Team|null,modifier?:{team:Team;positioning:number;impairment:number}){
 assert.equal(variant==='equal',boosted===null);
 const ps:Profile[]=profiles().map((p,i)=>({...p,agent:AGENTS[i%5],attrs:p.id.endsWith('0')&&p.team===boosted?attributes(variant):attributes('equal'),agentFamiliarity:85,mapFamiliarity:50,morale:70,fatigue:10,weapon:'main',shield:50,charges:[false,false,false],ult:0}));
 const initial:NonNullable<SimulationOptions['initial']>=Object.fromEntries(ps.map(p=>[p.id,{sector:(p.id.endsWith('0')?site:p.team===attacking?'attack':'defense') as Sector}]));
 const plan:TeamPlan={attack:'fast',defense:'balanced',site};
 const sim=new TacticalRound(ps,{map:'doca-v2',attacking,seed,plans:{A:plan,B:plan},initial,ai:false});
 if(modifier){const u=sim.get(`${modifier.team}0`)!;u.buffs.push({kind:'position',until:60000,value:modifier.positioning},{kind:'blind',until:60000,value:modifier.impairment});}
 const rolls:{at:number;basisPoints:number;hit:boolean;stateBefore:number}[]=[];
 const chance=sim.rng.combat.chance.bind(sim.rng.combat);
 sim.rng.combat.chance=(basisPoints:number)=>{const stateBefore=sim.rng.combat.state,hit=chance(basisPoints);rolls.push({at:sim.now,basisPoints,hit,stateBefore});return hit;};
 sim.advance(5000);assert.equal(sim.events.some(e=>e.kind==='shot'),false);
 const actorFor=(team:Team)=>{
  const u=sim.get(`${team}0`)!,view=sim.observeFor(u.id),other=team==='A'?'B':'A';
  assert.equal(u.sector,site);assert.deepEqual(u.attrs,ps.find(p=>p.id===u.id)!.attrs);
  assert.equal(u.readyAt<=sim.now&&!u.action&&!u.movement,true);assert.deepEqual(view.visible.map(v=>v.id),[`${other}0`]);
  assert.equal(view.allies.filter(a=>a.life>0&&a.sector===site).length,0);assert.equal(sim.effects.length,0);assert.equal(sim.areas.length,0);
  const applied={...condition,positioning:modifier?.team===team?modifier.positioning:0,impairment:modifier?.team===team?modifier.impairment:0};
  const baseWeighted=u.attrs.reduce((total,value,i)=>total+(value+(i===2?applied.positioning:0))*[45,15,25,15,0,0,0,0][i]/100,0);
  return {id:u.id,raw:u.attrs,baseWeighted,condition:applied,effective:professionalScore(u.attrs,applied),sector:u.sector,visible:view.visible.map(v=>v.id),ready:true,moving:false,weapon:u.weapon,shield:u.vital.shield/100,charges:u.charges,alliesAtSite:0,tactical:view.self.tactical};
 };
 const actors={A:actorFor('A'),B:actorFor('B')};
 let at=5000;while(at<35000&&sim.get('A0')!.vital.life>0&&sim.get('B0')!.vital.life>0){at+=500;sim.advance(at);}
 assert.ok(sim.get('A0')!.vital.life===0||sim.get('B0')!.vital.life===0,'duel did not end in the observation window');
 const shots=sim.events.filter(e=>e.kind==='shot');assert.equal(shots.length,rolls.length);
 for(let i=0;i<shots.length;i++){
  const shot=shots[i],shooter=shot.actor![0] as Team,target=shot.target![0] as Team;
  assert.equal(rolls[i].at,shot.at);assert.equal(rolls[i].basisPoints,probability(actors[shooter].effective,actors[target].effective));assert.equal(rolls[i].hit,shot.detail==='hit');
 }
 assert.equal(shots.filter(s=>s.at===5500).length,2);
 assert.ok(shots.every(s=>['A0','B0'].includes(s.actor!)&&['A0','B0'].includes(s.target!)));
 const aliveA=sim.get('A0')!.vital.life>0,aliveB=sim.get('B0')!.vital.life>0;
 return {seed,attacking,defending:attacking==='A'?'B':'A',site,variant,boosted,actors,firstShots:shots.slice(0,2).map((s,i)=>({actor:s.actor,target:s.target,...rolls[i]})),duel:{at,shots:shots.length,winner:aliveA?'A':aliveB?'B':null,mutual:!aliveA&&!aliveB}};
}
