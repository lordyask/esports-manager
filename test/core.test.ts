import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Random,randomStreams} from '../src/random.ts';
import {damage,duel,professionalScore,probability} from '../src/combat.ts';
import {quoteBuy,settleRound,halfReset,overtimeKit} from '../src/economy.ts';
import type {Account} from '../src/economy.ts';
import {mapEdges,shortestPath,mobilityTime,edgeKey} from '../src/rules.ts';
import {trainAttribute,renewedSalary,accrueWeek,dismiss,moraleAfterMap,overall} from '../src/career.ts';
import {runRound,serializeCheckpoint} from '../src/round.ts';
import type {Actor,RoundCommand} from '../src/round.ts';
import {MemoryCommands,Conflict} from '../src/commands.ts';

const account=(id='p1',credits=6000):Account=>({id,credits,weapon:'basic',shield:0,charges:[false,false,false],ult:0});
const vital=()=>({life:10000,shield:0,temporary:0,reduction:0});
const actor=(id:string,team:'A'|'B',sector:'A'|'B'|'mid'='A'):Actor=>({id,team,sector,vital:vital(),charges:[true,true,true],ult:8,usedUlt:false});
const fighter=(id:string)=>({id,score:50,weapon:'main' as const,vital:vital()});

test('RNG can resume and independent streams cannot alter combat',()=>{
  const r=new Random(19);r.next();const resumed=new Random(r.state);assert.equal(r.next(),resumed.next());
  const a=randomStreams(70),b=randomStreams(70);for(let i=0;i<30;i++)a.decisions.next();
  assert.equal(a.combat.next(),b.combat.next());assert.throws(()=>new Random(0));
});
test('damage consumes temporary shield, paid shield and health in order',()=>{
  assert.deepEqual(damage({life:10000,shield:2500,temporary:2500,reduction:1500},10000),{life:6500,shield:0,temporary:0,reduction:1500});
  assert.equal(damage(vital(),10000).life,0);
});
test('duplicate equipment bonuses are absent and condition caps apply',()=>{
  assert.equal(professionalScore([50,50,50,50,50,50,50,50],{agent:50,map:50,morale:50,fatigue:40}),50);
  assert.equal(professionalScore([50,50,50,50,50,50,50,50],{agent:50,map:50,morale:50,fatigue:100}),45);
  assert.equal(probability(1000,0),9000);assert.equal(probability(0,1000),1000);
});
test('duel is deterministic and input order does not change shot resolution',()=>{
  const a=fighter('a'),b=fighter('b');
  assert.deepEqual(duel(a,b,'medium',new Random(77)),duel(b,a,'medium',new Random(77)));
  assert.equal(a.vital.life,10000);
});
test('simultaneous lethal hits may kill both with no forced survival',()=>{
  let found=false;
  for(let seed=1;seed<200&&!found;seed++)found=duel(fighter('a'),fighter('b'),'medium',new Random(seed)).winner===null;
  assert.equal(found,true);
});
test('full and semi kits cost 6000 and 3000 per player from zero',()=>{
  assert.equal(quoteBuy([account()],'full').total,6000);
  assert.equal(quoteBuy([account()],'semi').total,3000);
  assert.equal(quoteBuy(Array.from({length:5},(_,i)=>account(String(i))),'full').total,30000);
});
test('retained main weapon reduces full repurchase to 2400',()=>{
  const a=account();a.weapon='main';const q=quoteBuy([a],'full');
  assert.equal(q.total,2400);assert.equal(q.accounts[0].credits,3600);assert.equal(a.credits,6000);
});
test('preserved superior gun and charges are never bought twice',()=>{
  const a=account();a.weapon='precision';a.shield=50;a.charges=[true,true,true];
  assert.equal(quoteBuy([a],'semi').total,0);assert.equal(quoteBuy([a],'full').accounts[0].weapon,'precision');
});
test('partial shields are repaired for 20 per point and Eco may save everything',()=>{
  const a=account();a.weapon='main';a.shield=24.5;a.charges=[true,true,true];
  assert.equal(quoteBuy([a],'full').total,510);
  assert.equal(quoteBuy([account()],'eco',{ecoBudget:0}).total,0);
});
test('aid only buys guns after reserving every own purchase',()=>{
  const rich=account('rich',12000),poor=account('poor',0);
  const q=quoteBuy([rich,poor],'full',{help:true});
  assert.equal(q.total,9600);assert.equal(q.accounts[1].weapon,'main');assert.equal(q.accounts[1].shield,0);
  assert.ok(q.missing.includes('poor'));assert.equal(q.accounts[0].credits,2400);
});
test('economy validates identity and never overspends',()=>{
  assert.throws(()=>quoteBuy([account(),account()],'full'));
  assert.throws(()=>quoteBuy([{...account(),credits:NaN}],'full'));
  const q=quoteBuy([account('low',2500)],'full');assert.ok(q.accounts[0].credits>=0);assert.ok(q.missing.includes('low'));
});
test('loss rewards, cash cap, death preservation and half reset',()=>{
  const a=account('p',0);a.charges=[true,false,true];a.ult=7;a.weapon='main';a.shield=50;
  assert.equal(settleRound(a,false,1,false,false).credits,2000);
  assert.equal(settleRound(a,false,2,false,false).credits,2500);
  assert.equal(settleRound(a,false,9,false,false).credits,3000);
  assert.deepEqual(settleRound(a,false,1,false,false).charges,[true,false,true]);
  assert.equal(settleRound(a,true,0,false,true).ult,8);
  assert.equal(settleRound(account('p',11000),true,0,true,false).credits,12000);
  assert.equal(halfReset(a).ult,7);assert.equal(halfReset(a).credits,1000);
  assert.equal(overtimeKit(a).shield,50);assert.equal(overtimeKit(a).ult,7);
});
test('canonical routes include attacker base and recompute blocked paths',()=>{
  assert.deepEqual(shortestPath('patio','A','B'),{path:['A','mid','B'],ms:12000});
  const blocked=[edgeKey('mid','A'),edgeKey('defense','A')];
  assert.deepEqual(shortestPath('patio','A','B',blocked),{path:['A','attack','B'],ms:24000});
  assert.equal(shortestPath('patio','A','B',mapEdges('patio').filter(([a,b])=>a==='A'||b==='A').map(([a,b])=>edgeKey(a,b))),null);
});
test('approved mobility preserves meaningful crossing time',()=>{
  assert.equal(mobilityTime(18000,'dash'),15000);assert.equal(mobilityTime(6000,'step'),3000);
});
test('fractional development and potential are preserved',()=>{
  const attrs:[number,number,number,number,number,number,number,number]=[50,50,50,50,50,50,50,50];
  const trained=trainAttribute(attrs,0,60);assert.equal(trained[0],50.1);assert.equal(overall(trained),50.0125);
  assert.throws(()=>trainAttribute(attrs,0,50));assert.equal(attrs[0],50);
});
test('renewal uses accumulated fractional growth',()=>{
  assert.equal(renewedSalary(3000,50,50.5),3050);assert.equal(renewedSalary(3000,50,51),3100);
  assert.equal(renewedSalary(1000,50,50.5),1000);assert.equal(renewedSalary(1000,50,51),1050);
});
test('dismissal before payday includes wages already earned',()=>{
  const c=accrueWeek(accrueWeek({id:'contract',monthlySalary:3000,accruedCents:0}));
  assert.equal(c.accruedCents,150000);assert.equal(dismiss(c,400000).cashCents,-50000);assert.equal(dismiss(c,400000).debtCents,50000);
});
test('mental profile has no extra hidden penalty',()=>{
  assert.equal(moraleAfterMap(70,100,false),68);assert.equal(moraleAfterMap(70,0,false),66);
  assert.equal(moraleAfterMap(99,50,true),100);
});
test('plant at exactly time limit is valid',()=>{
  const result=runRound([actor('a','A'),actor('b','B')],'A',[{at:96000,kind:'plant',actor:'a'}]);
  assert.equal(result.reason,'detonation');assert.equal(result.at,140000);
});
test('plant too late does not complete',()=>{
  assert.equal(runRound([actor('a','A'),actor('b','B')],'A',[{at:96001,kind:'plant',actor:'a'}]).reason,'time_expired');
});
test('defuse at exact detonation deadline wins',()=>{
  const commands:RoundCommand[]=[{at:0,kind:'plant',actor:'a'},{at:37000,kind:'defuse',actor:'b'}];
  const r=runRound([actor('a','A'),actor('b','B')],'A',commands);assert.equal(r.reason,'defused');assert.equal(r.at,44000);
});
test('lethal damage at cast completion cancels without consuming charge',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[{at:0,kind:'cast',actor:'a',slot:0},{at:500,kind:'damage',actor:'b',target:'a',amount:10000}]);
  assert.equal(r.actors.find(a=>a.id==='a')!.charges[0],true);assert.equal(r.events.some(e=>e.kind==='cast_complete'),false);
});
test('interrupted ability retains resource and ultimate can only be used once',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[
    {at:0,kind:'cast',actor:'a',slot:0},{at:250,kind:'interrupt',actor:'b',target:'a'},
    {at:1000,kind:'cast',actor:'a',slot:'ult'},{at:2500,kind:'cast',actor:'a',slot:'ult'}]);
  const a=r.actors.find(a=>a.id==='a')!;assert.equal(a.charges[0],true);assert.equal(a.ult,0);
  assert.equal(r.events.filter(e=>e.kind==='cast_complete').length,1);
});
test('death on defuse deadline is processed before objective completion',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[
    {at:0,kind:'plant',actor:'a'},{at:37000,kind:'defuse',actor:'b'},
    {at:44000,kind:'damage',actor:'a',target:'b',amount:10000}]);
  assert.equal(r.winner,'A');assert.notEqual(r.reason,'defused');
});
test('interrupted objective loses its progress and may restart',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[
    {at:0,kind:'plant',actor:'a'},{at:2000,kind:'interrupt',actor:'b',target:'a'},
    {at:2500,kind:'plant',actor:'a'}]);
  assert.equal(r.events.find(e=>e.kind==='planted')!.at,6500);
});
test('mutual elimination before plant favors defense regardless input order',()=>{
  const a=actor('a','A'),b=actor('b','B');const c:RoundCommand[]=[
    {at:0,kind:'damage',actor:'a',target:'b',amount:10000},{at:0,kind:'damage',actor:'b',target:'a',amount:10000}];
  const r=runRound([a,b],'A',c);assert.equal(r.winner,'B');assert.equal(r.actors.filter(a=>a.vital.life===0).length,2);
  assert.deepEqual(r,runRound([b,a],'A',[...c].reverse()));
});
test('mutual elimination after plant favors attack',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[
    {at:0,kind:'plant',actor:'a'},{at:5000,kind:'damage',actor:'a',target:'b',amount:10000},
    {at:5000,kind:'damage',actor:'b',target:'a',amount:10000}]);assert.equal(r.winner,'A');
});
test('eliminating attackers after plant does not end round for defenders',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[{at:0,kind:'plant',actor:'a'},{at:5000,kind:'damage',actor:'b',target:'a',amount:10000}]);
  assert.equal(r.at,44000);assert.equal(r.reason,'detonation');
});
test('round rejects friendly damage and invalid entities',()=>{
  assert.throws(()=>runRound([actor('a','A'),actor('a2','A'),actor('b','B')],'A',[{at:0,kind:'damage',actor:'a',target:'a2',amount:100}]));
});
test('checkpoint identifies engine, rules and content and preserves confirmed result',()=>{
  const r=runRound([actor('a','A'),actor('b','B')],'A',[]);
  const json=serializeCheckpoint(r,randomStreams(99).combat.state,[],'sha256:fixture');
  const state=JSON.parse(json);assert.deepEqual(state.state,r);assert.equal(state.rulesVersion,'gdd-1.3+b11-rc1');
});
test('duplicate command executes exactly once',async()=>{
  const repo=new MemoryCommands();repo.create('career','owner',{cash:100});let calls=0;
  const run=()=>repo.execute('career','owner','pay',0,{cost:10},state=>{calls++;return {cash:(state as {cash:number}).cash-10};});
  assert.deepEqual(await run(),await run());assert.equal(calls,1);assert.equal((repo.read('career','owner').state as {cash:number}).cash,90);
});
test('concurrent tabs cannot commit two commands against same revision',async()=>{
  const repo=new MemoryCommands();repo.create('career','owner',{cash:100});
  let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>release=resolve);
  const first=repo.execute('career','owner','a',0,1,async()=>{await gate;return {cash:90};});
  await repo.execute('career','owner','b',0,2,()=>({cash:80}));release();
  await assert.rejects(first,Conflict);assert.equal(repo.read('career','owner').revision,1);
});
test('another user cannot read or modify career',async()=>{
  const repo=new MemoryCommands();repo.create('career','owner',{});
  assert.throws(()=>repo.read('career','intruder'));
  await assert.rejects(repo.execute('career','intruder','x',0,{},()=>({})),/Forbidden/);
});
test('failed calculation leaves state unchanged and ID reuse cannot change payload',async()=>{
  const repo=new MemoryCommands();repo.create('career','owner',{cash:100});
  await assert.rejects(repo.execute('career','owner','x',0,{},()=>{throw new Error('failure');}));assert.equal(repo.read('career','owner').revision,0);
  await repo.execute('career','owner','x',0,{cost:10},()=>({cash:90}));
  await assert.rejects(repo.execute('career','owner','x',0,{cost:20},()=>({cash:80})),Conflict);
});
