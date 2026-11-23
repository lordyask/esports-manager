import assert from 'node:assert/strict';
import {test} from 'node:test';
import {decide} from '../src/ai.ts';
import {edgeKey} from '../src/rules.ts';
import type {Sector,Team} from '../src/rules.ts';
import {TacticalRound} from '../src/simulation.ts';
import {validateStrategy} from '../src/strategies.ts';
import type {TeamPlan,TacticalPolicy} from '../src/tactical-types.ts';
import {plans,profiles} from './fixtures.ts';

function scene({site='A',attacking='A',instruction='preserve',life=2800,defender=site,policy,automatic=false,autoFire=false,at=automatic?6750:7000}:{
 site?:'A'|'B';attacking?:Team;instruction?:'none'|'preserve';life?:number;defender?:Sector;policy?:TacticalPolicy;automatic?:boolean;autoFire?:boolean;at?:number;
}={}){
 const corridor=site==='A'?'corridor_a':'corridor_b';
 const fallback=site==='A'?'reception':'maintenance';
 const actor=attacking+'0',enemy=attacking==='A'?'B0':'A0';
 const plan:TeamPlan={...plans.A,site,attackInstruction:instruction};
 const ps=profiles().map(p=>({...p,charges:[false,false,false] as [boolean,boolean,boolean],ult:0}));
 const sim=new TacticalRound(ps,{map:'doca-v2',seed:17,attacking,plans:{A:plan,B:plan},tacticalPolicy:policy,
  ai:automatic,autoFire,initial:{[actor]:{sector:corridor,life},[enemy]:{sector:defender}}});
 // In the scheduled case only this attacker is coached. Keep the defender still.
 if(automatic)for(const u of sim.units)u.nextDecision=u.id===actor?7000:Infinity;
 sim.advance(at);
 return {sim,actor,enemy,corridor,fallback};
}
function issueChoice({sim,actor}:ReturnType<typeof scene>){
 const d=decide(sim.observeFor(actor),sim.rng.decisions,sim.options.tacticalPolicy);
 assert.ok(sim.issue(actor,d));
 return d;
}
function starts({sim,actor}:ReturnType<typeof scene>){
 return sim.events.filter(e=>e.actor===actor&&e.kind==='move_start').map(e=>e.sector);
}
for(const site of ['A','B'] as const)for(const attacking of ['A','B'] as const){
 test('Control, seed 17, HP 28: paired decisions and actual starts at '+site+' attacking '+attacking,()=>{
  for(const instruction of ['none','preserve'] as const){
   const s=scene({site,attacking,instruction}),view=s.sim.observeFor(s.actor);
   assert.ok(view.self.ready);
   assert.equal(view.self.life,2800);
   assert.deepEqual(view.visible,[{id:s.enemy,sector:site,action:null}]);
   const d=issueChoice(s);
   if(instruction==='none'){
    assert.equal(d.kind,'wait');
    assert.deepEqual(starts(s),[]);
   }else{
    assert.equal(d.kind,'move');
    assert.deepEqual(starts(s),[s.fallback]);
    assert.equal(s.sim.get(s.actor)!.movement!.from,s.corridor);
    assert.equal(s.sim.get(s.actor)!.movement!.to,s.fallback);
   }
  }
 });
}

test('exact threshold, old policy, post-plant and recovery do not start a retreat',()=>{
 for(const option of [{life:3500},{policy:'doca-v2-tactical-r6'}] as const){
  const s=scene(option);
  assert.equal(issueChoice(s).kind,'wait');
  assert.deepEqual(starts(s),[]);
 }
 const s=scene(),unit=s.sim.get(s.actor)!;
 unit.readyAt=7001;
 assert.equal(issueChoice(s).kind,'wait');
 s.sim.advance(7001);
 s.sim.planted={sector:'A',deadline:40000};
 assert.equal(issueChoice(s).kind,'wait');
 assert.deepEqual(starts(s),[]);
 assert.throws(()=>validateStrategy({...plans.A,attack:'fast',attackInstruction:'preserve'}),/Execução rápida/);
});

test('team memory behind smoke cannot trigger a retreat',()=>{
 const s=scene();
 s.sim.areas.push({id:'screen',kind:'smoke',team:'A',owner:'A1',sector:'A',until:12000,
  edges:[edgeKey(s.corridor,'A')],value:0,active:true});
 const view=s.sim.observeFor(s.actor);
 assert.deepEqual(view.visible,[]);
 assert.ok(view.known.some(k=>k.id===s.enemy));
 assert.equal(issueChoice(s).kind,'move');
 assert.deepEqual(starts(s),['A']);
});

test('a known barrier or a defender visibly on the escape connection leaves the weapon available',()=>{
 for(const obstacle of ['barrier','stationary','crossing','approaching'] as const){
  const s=scene({defender:obstacle==='stationary'?'reception':obstacle==='crossing'?'corridor_a':obstacle==='approaching'?'attack_west':'A'});
  if(obstacle==='barrier'){
   const edge=edgeKey(s.corridor,s.fallback);
   s.sim.areas.push({id:'wall',kind:'barrier',team:'A',owner:'A1',sector:s.fallback,until:20000,edges:[edge],value:0,active:true});
   assert.ok(s.sim.observeFor(s.actor).blocked.includes(edge));
  }
  if(obstacle==='crossing'||obstacle==='approaching'){
   assert.ok(s.sim.issue(s.enemy,{kind:'move',to:s.fallback}));
   s.sim.advance(obstacle==='crossing'?7500:10000);
  }
  assert.ok(s.sim.observeFor(s.actor).visible.some(e=>e.id===s.enemy));
  assert.equal(issueChoice(s).kind,'wait',obstacle);
  assert.deepEqual(starts(s),[]);
  assert.equal(s.sim.get(s.actor)!.action,null);
 }
});

test('holding an occupied exit permits automatic return fire',()=>{
 const s=scene({defender:'reception',autoFire:true,at:5000});
 const {sim}=s;
 const d=decide(sim.observeFor(s.actor),sim.rng.decisions);
 assert.equal(d.kind,'wait');
 assert.ok(sim.issue(s.actor,d));
 sim.advance(6500);
 assert.ok(sim.events.some(e=>e.kind==='shot'&&e.actor===s.actor&&e.target===s.enemy));
 assert.deepEqual(starts(s),[]);
});

test('retreat takes priority over available utility and only for the injured attacker',()=>{
 const s=scene();
 const u=s.sim.get(s.actor)!;
 u.charges=[true,true,true];u.ult=8;
 assert.equal(issueChoice(s).kind,'move');
 const ally=s.sim.get('A1')!;
 ally.sector=s.corridor;
 assert.equal(decide(s.sim.observeFor(ally.id),s.sim.rng.decisions).kind,'wait');
 const defender=s.sim.get(s.enemy)!;
 defender.vital.life=2800;
 const v=s.sim.observeFor(defender.id);
 assert.deepEqual(decide(v,s.sim.rng.decisions),decide({...v,plan:{...v.plan,attackInstruction:'none'}},s.sim.rng.decisions));
});

for(const site of ['A','B'] as const){
 test('Control keeps its target and takes another approach after repeated contact at '+site,()=>{
  const s=scene({site});
  // Drive the individual decision clock with a fixed site to isolate route
  // choice from the IGL's separate ability to call the opposite site.
  for(let time=7000;time<=46000;time+=500){
   s.sim.advance(time);
   const view=s.sim.observeFor(s.actor);
   if(time===10500){
    assert.equal(view.self.sector,s.fallback);
    assert.deepEqual(view.visible,[]);
   }
   if(view.self.ready&&!view.self.busy)issueChoice(s);
  }
  const moves=starts(s);
  assert.deepEqual(moves.slice(0,4),[s.fallback,s.corridor,s.fallback,site==='A'?'attack_west':'attack_east']);
  assert.ok(moves.includes('mid'));
  assert.ok(moves.includes(site==='A'?'link_a':'link_b'));
  assert.equal(moves.filter(to=>to===s.corridor).length,1);
 });
 test('a defender who leaves after the first retreat allows the attack to finish at '+site,()=>{
  const s=scene({site,automatic:true});
  s.sim.advance(9500);
  assert.ok(s.sim.issue(s.enemy,{kind:'move',to:site==='A'?'cover_a':'cover_b'}));
  s.sim.advance(24000);
  assert.deepEqual(starts(s),[s.fallback,s.corridor,site]);
  assert.ok(s.sim.events.some(e=>e.actor===s.actor&&e.kind==='planted'&&e.sector===site));
 });
}
