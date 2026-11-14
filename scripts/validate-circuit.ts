import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {freshWorkspace,defaultDraft,suggestAssignments,advanceSession,automaticBuys,encodeSave,decodeSave} from '../lib/game.ts';
import type {Workspace} from '../lib/game.ts';
import {startCircuitCareer,advanceCareer,startCareerMatch,acceptCareerResult,trainCareer} from '../lib/career.ts';
import {pendingNpc,standings} from '../lib/circuit-state.ts';
import {simulateNpc,acceptNpcResult} from '../lib/circuit.ts';
import {clubPlan} from '../lib/club-policy.ts';
import {cashCents,salaryAccrued,PRIZES} from '../lib/club-finance.ts';
import {OPPONENTS} from '../lib/opponents.ts';
import {sha256} from '../src/hash.ts';
const directory=process.env.NEXUS_VALIDATION_DIRECTORY??'validation/circuit',temporary=process.env.NEXUS_CIRCUIT_FIXTURES??'/tmp/nexus-circuit-validation';mkdirSync(directory,{recursive:true});mkdirSync(temporary,{recursive:true});
const npcHash=sha256(JSON.stringify(OPPONENTS)),results:Record<string,unknown>[]=[];
const rosters=[['J12','J09','J02','J05','J24'],['J01','J02','J03','J04','J17']];
let preserved:Workspace['history']=[],maximumBytes=0;
for(let roster=0;roster<rosters.length;roster++)for(const mode of ['none','collective','individual'] as const){
 const started=performance.now(),seed=902111+roster*71+['none','collective','individual'].indexOf(mode)*19;
 let w=startCircuitCareer({...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected:rosters[roster]}),...(roster===1&&mode==='individual'?{history:preserved}:{})},`matrix:${roster}:${mode}`,seed);
 function finishRound(input:Workspace){let next=startCareerMatch(input);while(next.session!.state.phase!=='finished'){const s=next.session!;next=acceptCareerResult(next,advanceSession(s,{id:`r${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:clubPlan('vrt',s.seed,s.state.rounds),B:clubPlan(s.metadata!.opponentId!,s.seed,s.state.rounds)}}));if(next.session!.state.rounds===2)next=decodeSave(encodeSave(next));}
  if(roster===0&&mode==='none'&&next.career!.day===4)writeFileSync(`${temporary}/pending.json`,encodeSave(next));
  let m=pendingNpc(next.career!);while(m){next=decodeSave(encodeSave(acceptNpcResult(next,m.id,simulateNpc(m))));m=pendingNpc(next.career!);}return next;
 }
 if(mode==='none'){while(!w.career!.agendaCompleted)w=finishRound(advanceCareer(w,'event'));}
 else for(let day=1;day<=28;day++){
  w=trainCareer(w,{kind:'attribute',attribute:(day-1)%8,...(mode==='individual'?{mode:'individual',playerId:rosters[roster][(day-1)%5]}:{})});
  if(day%4===0)w=finishRound(w);if(day<28)w=advanceCareer(w,'day');
 }
 w=decodeSave(encodeSave(w));const c=w.career!,x=c.circuit!,rows=standings(x.matches,x.draws),place=rows.findIndex(r=>r.id==='user')+1,own=rows[place-1],bytes=Buffer.byteLength(encodeSave(w));maximumBytes=Math.max(maximumBytes,bytes);
 assert.equal(x.closed,true);assert.equal(x.matches.length,28);assert.ok(x.matches.every(m=>m.result));assert.ok(rows.every(r=>r.played===7));assert.equal(rows.reduce((n,r)=>n+r.difference,0),0);assert.equal(rows.reduce((n,r)=>n+r.points,0),x.matches.reduce((n,m)=>n+(m.result!.winner===null?2:3),0));assert.equal(sha256(JSON.stringify(OPPONENTS)),npcHash);
 assert.equal(cashCents(x.finance)-PRIZES[place-1]*100,3000000-100000-salaryAccrued(c.roster,28)-280000);assert.equal(x.finance.ledger.filter(e=>e.kind==='prize').length,1);assert.ok(bytes<64*1024*1024);
 if(!preserved.length)preserved=Array.from({length:20},(_,i)=>({...structuredClone(w.history![0]),id:`old:${i}`}));
 if(roster===1&&mode==='individual'){assert.equal(w.history!.length,20);writeFileSync(`${temporary}/complete.json`,encodeSave(w));}
 const result={roster,mode,seed,matches:28,rounds:x.matches.reduce((n,m)=>n+m.result!.rounds,0),trainings:c.days.filter(d=>d.status==='trained').length,place,wins:own.wins,draws:own.drawn,losses:own.lost,cashCents:cashCents(x.finance),baseCashCents:cashCents(x.finance)-PRIZES[place-1]*100,historyLength:w.history!.length,saveBytes:bytes,elapsedMs:Math.round(performance.now()-started),fixtures:c.fixtures.map(f=>({day:f.day,map:f.map,opponent:f.opponentId,score:f.result!.score}))};results.push(result);console.log(JSON.stringify(result));
}
writeFileSync(`${directory}/results.json`,JSON.stringify({scope:'Integration sample: complete circuits, two legal rosters, three training routines. Not global balance certification or browser QA.',campaigns:results.length,matches:results.length*28,rounds:results.reduce((n,r)=>n+Number(r.rounds),0),npcHash,npcUnchanged:true,maximumSaveBytes:maximumBytes,results},null,2)+'\n');
