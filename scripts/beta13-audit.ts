// Baseline diagnostics for scope review. Does not change application rules.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {PLAYERS,defaultDraft,suggestAssignments,createSession,advanceSession,automaticBuys,encodeSave,decodeSave,nextMatch} from '../lib/game.ts';
import {newDevelopment,previewTraining,growthFor,attributeCost,agentCost,validateDevelopment} from '../lib/development.ts';
import {AGENTS} from '../src/abilities.ts';
import {reviewRound} from '../lib/insights.ts';
import {attackingTeam} from '../src/map.ts';
import {economicPlan,simulateMap} from '../src/autonomous.ts';
import {quoteBuy,settleRound} from '../src/economy.ts';
import type {Account} from '../src/economy.ts';

const out:any={scope:'Current 1.1.1 baseline; synthetic fixtures only. No Beta 1.3 features implemented.',trainingCases:0,trainingSessions:0,matches:[],findings:[]};
const cheap=[...PLAYERS].sort((a,b)=>a.salary-b.salary);
for(const p of PLAYERS)for(const kind of ['attribute','agent'] as const)for(let focus=0;focus<8;focus++){
 const ids=[p.id,...cheap.filter(x=>x.id!==p.id).slice(0,4).map(x=>x.id)];
 let dev=newDevelopment();
 for(let n=0;n<12;n++){
  const choice=kind==='attribute'?{kind,attribute:focus}:{kind,agents:Object.fromEntries(ids.map(id=>[id,AGENTS[focus]]))};
  const before=JSON.stringify(dev),g=growthFor(dev,p.id),result=previewTraining(dev,ids,choice);
  assert.equal(JSON.stringify(dev),before);validateDevelopment(result.development);
  const gain=result.gains.find(x=>x.id===p.id)!;
  let spent=0;for(let value=gain.before;value<gain.after;value++)spent+=kind==='attribute'?attributeCost(value):agentCost(value);
  assert.equal(gain.xpBefore+gain.gainedXP,gain.xpAfter+spent);
  const after=growthFor(result.development,p.id);
  if(kind==='agent')assert.deepEqual(after.attrs,g.attrs);
  else for(let i=0;i<8;i++)if(i!==focus)assert.equal(after.attrs[i],g.attrs[i]);
  assert.throws(()=>previewTraining(result.development,ids,choice),/já foi/);
  dev=result.development;dev.used=false;delete dev.receipt;out.trainingSessions++;
 }
 out.trainingCases++;
}
const ids=['J02','J24','J22','J05','J03'];
const draft=suggestAssignments({...defaultDraft(),selected:ids});
let s=createSession(draft,'baseline');
while(s.state.phase!=='finished')s=advanceSession(s,{id:`r${s.state.rounds}`,revision:s.state.rounds,plans:{A:draft.plan,B:draft.plan},buys:automaticBuys(s)});
const dev=newDevelopment();dev.used=true;dev.matchId=s.id;
const next=nextMatch(decodeSave(encodeSave({draft,session:s,development:dev})));
assert.equal(next.draft.seed,s.seed);assert.deepEqual(next.previous,s);
out.findings.push({id:'M04',confirmed:'Next match retains the previous simulation seed',seed:next.draft.seed});

const trained=previewTraining(newDevelopment(),ids,{kind:'attribute',attribute:0}).development;
const one=structuredClone(trained);one.receipt!.gains=one.receipt!.gains.slice(0,1);
assert.throws(()=>validateDevelopment(one),/Comprovante/);
const doubled=structuredClone(trained);doubled.receipt!.gains[0].gainedXP*=2;
assert.throws(()=>validateDevelopment(doubled),/training earned XP/);
out.findings.push({id:'B13-05',confirmed:'Existing receipt validation rejects one-player receipts and doubled XP; migration and validation changes required.'});

const b=createSession(draft,'defending');b.state.initialAttack='B';
const expected=attackingTeam(b.state),played=advanceSession(b,{id:'r0',revision:0,plans:{A:draft.plan,B:draft.plan},buys:'eco'});
const reported=reviewRound(played,played.records[0]).attacking;
assert.equal(expected,'B');assert.equal(reported,'A');
out.findings.push({id:'R13-07',confirmed:'Round review assumes A starts attacking even when a valid session starts B attacking.',expected,reported,scope:'Synthetic alternate-side session; normal UI currently always starts A attacking.'});

let accounts:Account[]=Array.from({length:5},(_,i)=>({id:`p${i}`,credits:1000,weapon:'basic',shield:0,charges:[false,false,false],ult:0}));
const trace=[];
for(let loss=1;loss<=10;loss++){
 const plan=economicPlan(accounts),q=quoteBuy(accounts,plan,{help:true});
 trace.push({round:loss,plan,before:accounts[0].credits,after:q.accounts[0].credits});
 accounts=q.accounts.map(a=>settleRound({...a,charges:[false,false,false]},false,loss,false,false));
}
assert.ok(trace.slice(2).every(x=>x.plan==='semi'));
out.findings.push({id:'M01',confirmed:'Controlled all-dead/all-utilities-consumed loss sequence remains on Semi from round 3 through 10.',trace});

for(const map of ['patio','horizonte','enlace'] as const)for(const opponent of ['balanced','experienced'] as const)for(const seed of [2701061,2701069])for(const initialAttack of ['A','B'] as const){
 const initial=createSession({...draft,map,opponent,seed},'smoke');
 const game=simulateMap(initial.profiles,{map,seed,initialAttack,overtimePairLimit:3,plans:{A:draft.plan,B:draft.plan},maxRounds:30});
 assert.equal(game.state.phase,'finished');assert.ok(game.rounds.length<=30);
 assert.equal(game.state.score.A+game.state.score.B,game.rounds.length);
 assert.ok([...game.state.teams.A,...game.state.teams.B].every(a=>a.credits>=0&&a.credits<=12000));
 out.matches.push({map,opponent,seed,initialAttack,score:game.state.score,rounds:game.rounds.length});
}
mkdirSync('validation/beta13',{recursive:true});
writeFileSync('validation/beta13/baseline-audit.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({trainingCases:out.trainingCases,trainingSessions:out.trainingSessions,syntheticMatches:out.matches.length,findings:out.findings}));
