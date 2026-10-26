import {ABILITIES} from './abilities.ts';
import type {Slot} from './abilities.ts';
import {mapEdges,shortestPath,clamp} from './rules.ts';
import type {Sector} from './rules.ts';
import type {Observation,Decision} from './tactical-types.ts';
import type {Random} from './random.ts';

// Only an Observation enters this module. No access to hidden positions or future events.
export function decide(view:Observation,random:Random):Decision {
  const {self}=view;
  const attacking=self.team===view.attacking;
  const instruction=attacking?view.plan.attackInstruction:view.plan.defenseInstruction;
  const aliveAllies=view.allies.filter(a=>a.life>0);
  const leading=aliveAllies.find(a=>a.role==='Entry');
  const feint=attacking&&view.plan.attack==='feint'&&view.now<18000&&!view.planted;
  const lurking=attacking&&self.role==='Lurker'&&view.now<22000&&!view.planted;
  const targetSite=(feint||lurking)?(view.attackTarget==='A'?'B':'A'):view.attackTarget;
  if(self.busy||!self.ready)return {kind:'wait'};
  const adjacent=(s:Sector)=>mapEdges(view.map).some(([a,b])=>a===self.sector&&b===s||b===self.sector&&a===s);
  const visible=view.visible.filter(x=>x.sector===self.sector||adjacent(x.sector));
  const known=view.known.filter(x=>x.sector===self.sector||adjacent(x.sector));
  const contact=visible[0]??known[0];
  const localEnemies=visible.filter(x=>x.sector===self.sector);
  const localAllies=[self,...view.allies.filter(a=>a.life>0&&a.sector===self.sector)];
  if(view.planted&&self.team!==view.attacking&&self.sector===view.planted.sector&&!view.allies.some(a=>a.action==='defuse')) {
    if(localEnemies.length===0||view.planted.deadline-view.now<=9000)return {kind:'defuse'};
  }
  if(!view.planted&&self.team===view.attacking&&self.sector===view.attackTarget&&localEnemies.length===0&&!view.allies.some(a=>a.action==='plant'))return {kind:'plant'};
  const available=(slot:Slot)=>slot===3?self.ult>=8&&!self.usedUlt:self.charges[slot];
  for(const slot of [3,0,1,2] as Slot[]){
    if(!available(slot))continue;
    const skill=ABILITIES[self.agent][slot],sector=contact?.sector??targetSite;
    if(instruction==='resources'&&!view.planted&&slot>0)continue;
    const inRange=sector===self.sector||adjacent(sector);
    if(['blind','disorient','blast','zone','slow','confinement'].includes(skill.kind)&&contact&&inRange){
      if((self.agent==='Estalo'&&slot===3||self.agent==='Pulso'&&slot===3||self.agent==='Farol'&&slot===2)&&!adjacent(sector))continue;
      // Utility is a decision, not a second success/failure roll after a valid cast.
      const quality=view.planted&&self.team!==view.attacking?self.tactical.retake:self.tactical.entry;
      if(random.chance(Math.round(clamp(quality*100,1000,9000))))return {kind:'cast',slot,sector,target:contact.id};
    }
    if(skill.kind==='interrupt'){
      const channeling=visible.find(e=>e.sector===self.sector&&e.action);
      if(channeling)return {kind:'cast',slot,target:channeling.id,sector:self.sector};
    }
    if(skill.kind==='fortress'&&visible.length>0)return {kind:'cast',slot};
    if(skill.kind==='guard'&&visible.length>0){const ally=localAllies.find(a=>a.life<10000)??self;return {kind:'cast',slot,target:ally.id};}
    if(skill.kind==='safe'&&visible.length>0)return {kind:'cast',slot};
    if(skill.kind==='position'&&visible.length>0)return {kind:'cast',slot};
    if(skill.kind==='sweep'&&view.now>8000&&view.now<80000)return {kind:'cast',slot};
    if(skill.kind==='track'&&contact)return {kind:'cast',slot,target:contact.id};
    if(skill.kind==='scan'&&view.now<35000&&!contact){
      const to=adjacent(view.attackTarget)?view.attackTarget:'mid';if(adjacent(to))return {kind:'cast',slot,sector:to};
    }
    if(['alarm','trap','sensor'].includes(skill.kind)&&self.team!==view.attacking&&view.now<10000)return {kind:'cast',slot,sector:self.sector};
    if(['smoke','barrier','delay'].includes(skill.kind)&&visible.length>0&&contact&&adjacent(contact.sector))return {kind:'cast',slot,sector:self.sector,edge:[self.sector,contact.sector]};
  }
  // A retake must reach the planted device rather than duel forever from an adjacent sector.
  // Hold a threatened route rather than crossing helplessly under observed fire.
  // Contact on a different route must not pin an attack with a clear next step.
  if(!view.planted&&attacking&&self.sector==='attack'){
    if(self.role==='Second'&&leading&&leading.sector===self.sector&&leading.action!=='move'&&view.now<6000)return {kind:'wait'};
    if(self.role==='Support'&&leading&&leading.sector===self.sector&&leading.action!=='move'&&view.now<6000)return {kind:'wait'};
    if(instruction==='utility'&&view.now<1500)return {kind:'wait'};
  }
  if(!attacking&&!view.planted&&self.role==='Anchor'&&view.plan.defense!=='aggressive')return {kind:'wait'};
  if(instruction==='preserve'&&self.life<3500&&visible.length>0&&self.sector!=='attack'){
    const retreat=shortestPath(view.map,self.sector,'attack',view.blocked);if(retreat?.path[1])return {kind:'move',to:retreat.path[1]};
  }
  if(instruction==='trade'&&view.now<15000&&localAllies.length<2&&!view.planted)return {kind:'wait'};
  const order=[self,...view.allies].sort((a,b)=>(a.slot??0)-(b.slot??0)).map(a=>a.id);
  const staging=self.sector==='attack'&&(view.plan.attack==='control'&&view.now<15000||view.plan.attack==='split'&&view.now<20000&&order.indexOf(self.id)%2===0);
  const route=shortestPath(view.map,self.sector,staging||lurking?'mid':targetSite,view.blocked);
  // A fast execution uses the direct site connection; control stages through mid.
  // Shortest travel time alone used to collapse all three plans onto the same route.
  const direct=self.team===view.attacking&&!view.planted&&self.sector==='attack'&&!staging&&!lurking&&adjacent(targetSite)&&!view.blocked.includes([self.sector,targetSite].sort().join(':'));
  const routeNext=direct?targetSite:route?.path[1];
  const clearStep=!!routeNext&&!visible.some(e=>e.sector===routeNext);
  // A designated Entry may contest a route with nearby support after preparation.
  // Units without that responsibility still hold observed fire on their crossing.
  const supportedEntry=self.role==='Entry'&&localAllies.length>=2&&view.now>=5000&&view.now<75000;
  const followingEntry=self.role==='Second'&&!!leading&&(leading.action==='move'||leading.sector!==self.sector);
  const advancing=localEnemies.length===0&&(!view.planted&&self.team===view.attacking&&(clearStep||supportedEntry||followingEntry)||!!view.planted&&self.team!==view.attacking&&self.sector!==view.planted.sector);
  if(visible.length>0&&!advancing)return {kind:'wait'};
  const device=view.devices[0];if(device)return {kind:'destroy',device:device.id};
  let destination:Sector=self.sector;
  if(view.planted){
    if(self.team!==view.attacking)destination=view.planted.sector;
    else return {kind:'wait'};
  }else if(self.team===view.attacking){
    destination=targetSite;
    if(view.plan.attack==='control'&&view.now<15000&&(self.sector==='attack'||self.sector==='mid'))destination='mid';
    if(view.plan.attack==='split'&&view.now<20000&&order.indexOf(self.id)%2===0&&self.sector==='attack')destination='mid';
    if(self.sector===destination)return (destination==='A'||destination==='B')&&destination===view.attackTarget?{kind:'plant'}:{kind:'wait'};
  }else{
    const observed=known[0];
    const patient=view.plan.defense==='reading'||instruction==='cautious';
    if(observed?.sector==='attack'&&view.plan.defense!=='aggressive')return {kind:'wait'};
    if(observed&&(!patient||known.length>=2||view.now>=30000))destination=observed.sector;
    else if(view.plan.defense==='aggressive'&&view.now<20000)destination='mid';
    else return {kind:'wait'};
  }
  if(destination===self.sector)return {kind:'wait'};
  const path=shortestPath(view.map,self.sector,destination,view.blocked);
  if(!path||path.path.length<2)return {kind:'wait'};
  const next=lurking&&self.sector==='attack'?'mid':direct?targetSite:path.path[1];
  for(const slot of [0,1,2,3] as Slot[]){
    if(!available(slot))continue;
    const kind=ABILITIES[self.agent][slot].kind;
    if(kind==='speed'&&view.now<40000)return {kind:'cast',slot};
    if(kind==='dash'||kind==='step')return {kind:'cast',slot,sector:next};
    if(kind==='teleport'){
      const ally=view.allies.find(a=>a.life>0&&a.sector===destination);
      if(ally)return {kind:'cast',slot,sector:ally.sector,target:ally.id};
    }
  }
  return {kind:'move',to:next};
}
