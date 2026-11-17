import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {AGENTS} from '../src/abilities.ts';
import {decide} from '../src/ai.ts';
import {PREVIOUS_MOVEMENT_MECHANICS as MECHANICS} from '../src/content.ts';
import {docaCanFire,docaSight} from '../src/doca-v2.ts';
import type {DocaPosition} from '../src/doca-v2.ts';
import {Random} from '../src/random.ts';
import {TacticalRound} from '../src/simulation.ts';
import type {Profile,TeamPlan} from '../src/tactical-types.ts';
import {profiles} from '../test/fixtures.ts';

// One recorded scenario; separate instances probe direct commands without
// changing the unmodified round or its random stream.
function setup(){
 const ps:Profile[]=profiles().map((p,n)=>({...p,agent:AGENTS[n%5],weapon:'main',shield:50,charges:[false,false,false],ult:0}));
 const assignments=Object.fromEntries(ps.filter(p=>p.team==='B').map((p,i)=>[p.id,(['A','B','A','B','mid'] as const)[i]]));
 const attack:TeamPlan={attack:'fast',defense:'balanced',site:'A'},defense:TeamPlan={attack:'fast',defense:'balanced',site:'A',defenseAssignments:assignments};
 return {sim:new TacticalRound(ps,{map:'doca-v2',attacking:'A',seed:7,plans:{A:attack,B:defense},movementPolicy:'legacy-r1'}),assignments};
}
const {sim,assignments}=setup(),snapshots=[];
for(const at of [13000,13250,13500,14250,14500,15000,16250]){
 sim.advance(at);
 const actors=Object.fromEntries(['A0','B0','B2','B4'].map(id=>{
  const u=sim.get(id)!,v=sim.observeFor(id);
  return [id,{sector:u.sector,movement:u.movement&&{from:u.movement.from,to:u.movement.to,remaining:u.movement.remaining,initial:u.movement.initial},readyAt:u.readyAt,ready:v.self.ready,busy:v.self.busy,action:v.self.action,shotTarget:u.shotTarget,shotToken:u.shotToken,visible:v.visible.map(e=>e.id),life:u.vital.life,shield:u.vital.shield}];
 }));
 const a=sim.get('A0')!,b=sim.get('B0')!;
 snapshots.push({at,actors,pair:{sight:docaSight(a as DocaPosition,b as DocaPosition),fireLine:docaCanFire(a as DocaPosition,b as DocaPosition)}});
}
const events=sim.events.filter(e=>e.at>=13000&&['first_contact','arrived','move_start','shot','weapon_damage','eliminated'].includes(e.kind));
assert.equal(events.find(e=>e.kind==='first_contact')?.at,13000);
assert.equal(events.find(e=>e.kind==='eliminated')?.at,16250);
assert.equal(events.find(e=>e.kind==='shot'&&e.actor?.startsWith('A'))?.at,14250);
assert.equal(events.find(e=>e.kind==='shot'&&e.actor?.startsWith('B'))?.at,15000);

function commandProbe(at:number,id:'A0'|'B0',to:'A'|'cover_a'){
 const {sim}=setup();sim.advance(at);const u=sim.get(id)!,view=sim.observeFor(id);
 const decision=decide(view,new Random(1)),before={at,actor:id,sector:u.sector,readyAt:u.readyAt,ready:view.self.ready,busy:view.self.busy,decision};
 const accepted=sim.issue(id,{kind:'move',to});
 assert.equal(view.self.ready,false);assert.deepEqual(decision,{kind:'wait'});assert.equal(accepted,true);
 return {...before,command:{kind:'move',to},accepted};
}
const result={scope:'Single previously recorded fast-A scenario, seed 7; 5 seconds preparation included. A0 contact and B0/B2/B4; two copies probe direct commands without altering the observed round. Not a balance sample.',mechanics:MECHANICS,seed:7,attacking:'A',site:'A',assignments,snapshots,events,commandProbes:[commandProbe(13000,'A0','A'),commandProbe(13500,'B0','cover_a')]};
mkdirSync('validation/defensive-occupation',{recursive:true});
writeFileSync('validation/defensive-occupation/fast-entry-trace.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({snapshots:snapshots.length,contact:13000,attackerFirstShot:14250,defenderFirstShot:15000,firstElimination:16250,commandProbes:result.commandProbes}));
