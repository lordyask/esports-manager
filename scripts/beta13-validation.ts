import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {PLAYERS,defaultDraft,suggestAssignments,createSession,encodeSave,decodeSave} from '../lib/game.ts';
import {AGENTS} from '../src/abilities.ts';
import {newDevelopment,previewTraining,attributeCost,agentCost,validateDevelopment,sessionsToGain} from '../lib/development.ts';
import type {TrainingChoice} from '../lib/development.ts';
import {simulateMap} from '../src/autonomous.ts';
import {validateHistory,HISTORY_LIMIT,SAVE_LIMIT,historyJSON,readHistory} from '../lib/history.ts';
import {matchAnalysis} from '../lib/match-analysis.ts';
const cheap=[...PLAYERS].sort((a,b)=>a.salary-b.salary);
const result:any={date:'2026-10-28',scope:'Synthetic Beta 1.3 RC1 verification; no global balance or UI certification.',trainingCases:0,trainingSessions:0,blockedCases:0,matches:[],history:{}};
for(const player of PLAYERS)for(const mode of ['collective','individual'] as const)for(const kind of ['attribute','agent'] as const)for(let focus=0;focus<8;focus++){
 const ids=[player.id,...cheap.filter(p=>p.id!==player.id).slice(0,4).map(p=>p.id)];
 const choice:TrainingChoice={mode,...(mode==='individual'?{playerId:player.id}:{}),kind,...(kind==='attribute'?{attribute:focus}:{agents:Object.fromEntries(ids.map(id=>[id,AGENTS[focus]]))})};
 let dev=newDevelopment(),firstGainAt:number|undefined;
 const forecast=sessionsToGain(dev,player.id,choice);
 for(let n=1;n<=12;n++){
  if(mode==='individual'&&sessionsToGain(dev,player.id,choice)===null){result.blockedCases++;break;}
  const before=structuredClone(dev),trained=previewTraining(dev,ids,choice);validateDevelopment(trained.development);assert.deepEqual(dev,before);
  for(const gain of trained.gains){let cost=0;for(let value=gain.before;value<gain.after;value++)cost+=kind==='attribute'?attributeCost(value):agentCost(value);assert.equal(gain.xpBefore+gain.gainedXP,cost+gain.xpAfter);}
  const target=trained.gains.find(g=>g.id===player.id)!;if(target.after>target.before&&!firstGainAt)firstGainAt=n;
  if(mode==='individual'){assert.equal(trained.gains.length,1);for(const id of ids.slice(1))assert.equal(trained.development.players[id],undefined);}
  assert.throws(()=>previewTraining(trained.development,ids,choice),/já foi/);
  dev=trained.development;dev.used=false;delete dev.receipt;result.trainingSessions++;
 }
 if(forecast!==null&&forecast<=12)assert.equal(firstGainAt,forecast);
 result.trainingCases++;
}
const ids=['J02','J24','J22','J05','J03'],draft=suggestAssignments({...defaultDraft(),selected:ids});
for(const map of ['patio','horizonte','enlace'] as const)for(const opponent of ['development','balanced','experienced'] as const)for(const seed of [281001,281017,281053,281081])for(const initialAttack of ['A','B'] as const){
 const s=createSession({...draft,map,opponent,seed},`${map}-${opponent}-${seed}-${initialAttack}`);
 const match=simulateMap(s.profiles,{map,seed,initialAttack,overtimePairLimit:3,maxRounds:30,plans:{A:draft.plan,B:draft.plan}});
 assert.equal(match.state.phase,'finished');assert.ok(match.rounds.length<=30);assert.equal(match.state.score.A+match.state.score.B,match.rounds.length);
 result.matches.push({map,opponent,seed,initialAttack,score:match.state.score,rounds:match.rounds.length});
}
// Build records with the public session API so the history fixture is fully importable.
const {advanceSession,automaticBuys}=await import('../lib/game.ts');
let s=createSession(draft,'capacity');while(s.state.phase!=='finished')s=advanceSession(s,{id:'r'+s.state.rounds,revision:s.state.rounds,plans:{A:draft.plan,B:draft.plan},buys:automaticBuys(s)});
const history=Array.from({length:HISTORY_LIMIT},(_,i)=>({...structuredClone(s),id:`capacity-${i}`}));validateHistory(history);
const w={draft,session:null,development:newDevelopment(),history};
const t=performance.now(),save=encodeSave(w);assert.deepEqual(decodeSave(save),w);assert.deepEqual(readHistory(historyJSON(history)),history);
const bytes=new TextEncoder().encode(save).length;assert.ok(bytes<SAVE_LIMIT);
result.history={entries:history.length,bytes,encodeDecodeAndHistoryRoundtripMs:Math.round(performance.now()-t),fixtureRounds:s.records.length};
const analysis=matchAnalysis(s);assert.ok(analysis.priorities.length<=2);assert.equal(analysis.players.length,5);
mkdirSync('validation/beta13',{recursive:true});writeFileSync('validation/beta13/rc1-validation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({trainingCases:result.trainingCases,trainingSessions:result.trainingSessions,blockedCases:result.blockedCases,matches:result.matches.length,history:result.history}));
