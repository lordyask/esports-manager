import {ABILITIES} from './abilities.ts';
import type {Slot} from './abilities.ts';
import {shortestPath} from './rules.ts';
import {ATTACK_BASE,DEFENSE_BASE,isDocaArea} from './doca-v2.ts';
import type {Decision,Observation} from './tactical-types.ts';

/** Route decisions use only the team's public observations and its own orders. */
export function decideDocaV2(view:Observation):Decision {
 const {self}=view,attacking=self.team===view.attacking;
 if(!isDocaArea(self.sector))return {kind:'wait'};
 const roster=[self,...view.allies].sort((a,b)=>(a.slot??0)-(b.slot??0)),alive=roster.filter(a=>a.life>0);
 const index=roster.findIndex(a=>a.id===self.id),otherSite=view.attackTarget==='A'?'B':'A';
 let destination:'A'|'B'|'mid'|'gallery'|'link_a'|'link_b'|'corridor_a'|'corridor_b';
 if(view.planted){
  if(attacking)return {kind:'wait'};
  destination=view.planted.sector==='A'?'A':'B';
 }else if(attacking){
  const strategy=view.plan.attack;
  const site=strategy==='feint'&&!view.feintShifted?otherSite:view.attackTarget;
  destination=site;
  if(strategy==='control'&&view.now<15000&&['attack','attack_west','attack_east','triage','bend_south','bend_north','mid'].includes(self.sector))destination='mid';
  if(strategy==='split'&&view.now<35000){
   const flank=index%2===0,stage=flank?(site==='A'?'link_a':'link_b'):(site==='A'?'corridor_a':'corridor_b');
   const ready=new Set([site,site==='A'?'link_a':'link_b',site==='A'?'corridor_a':'corridor_b']);
   const otherGroup=roster.some((a,i)=>a.life>0&&i%2!==index%2&&ready.has(a.sector));
   if(self.sector===stage&&!otherGroup)return {kind:'wait'};
   if(!ready.has(self.sector))destination=stage;
  }
  if(self.sector===destination)return {kind:'wait'};
 }else{
  const explicit=view.plan.defenseAssignments?.[self.id];
  const defaults=view.plan.defense==='retake'?['A','B','gallery','gallery','gallery']:view.plan.defense==='aggressive'?['A','B','mid','mid','mid']:['A','B','A','B','mid'];
  destination=explicit??(defaults[Math.max(0,index)] as 'A'|'B'|'mid'|'gallery');
  const known=view.known;
  const siteOf=(s:string)=>['A','cover_a','corridor_a','reception','link_a','gallery_a'].includes(s)?'A':['B','cover_b','corridor_b','maintenance','link_b','gallery_b'].includes(s)?'B':null;
  const countA=known.filter(x=>siteOf(x.sector)==='A').length,countB=known.filter(x=>siteOf(x.sector)==='B').length;
  const observed=countA>countB?'A':countB>countA?'B':null;
  const patient=view.plan.defense==='reading'||view.plan.defenseInstruction==='cautious';
  if(observed&&(!patient||known.length>=2||view.now>=30000))destination=observed;
  if(self.sector===destination)return {kind:'wait'};
 }
 const path=shortestPath('doca-v2',self.sector,destination,view.blocked);if(!path||path.path.length<2)return {kind:'wait'};
 const next=path.path[1];
 // Do not force five defenders to different sites; explicit assignments remain valid.
 // A visible opponent on the next connection can be fought instead of crossing blindly.
 if(view.visible.some(e=>e.sector===self.sector||e.sector===next))return {kind:'wait'};
 if(attacking&&view.plan.attackInstruction==='utility'&&view.now<1500&&ATTACK_BASE.includes(self.sector))return {kind:'wait'};
 if(attacking&&view.plan.attackInstruction==='trade'&&view.now<15000&&alive.filter(a=>a.sector===self.sector).length<2)return {kind:'wait'};
 for(const slot of [0,1,2,3] as Slot[]){
  if(slot===3?self.ult<8||self.usedUlt:!self.charges[slot])continue;
  const kind=ABILITIES[self.agent][slot].kind;
  if(kind==='speed'&&view.now<40000&&!DEFENSE_BASE.includes(self.sector))return {kind:'cast',slot};
  if(kind==='dash'||kind==='step')return {kind:'cast',slot,sector:next};
 }
 return {kind:'move',to:next};
}
