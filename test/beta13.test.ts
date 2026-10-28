import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,defaultDraft,suggestAssignments,advanceSession,automaticBuys,decodeSave,encodeSave,beginMatch,randomSeed,nextMatch,prepareImport} from '../lib/game.ts';
import type {Workspace} from '../lib/game.ts';
import {initializeHistory,archiveResult,deleteHistory,addHistory,historyJSON,readHistory,mergeHistory,playersCSV,roundsCSV,HISTORY_LIMIT} from '../lib/history.ts';
import {newDevelopment,previewTraining,growthFor,xpPerSession,sessionsToGain,validateDevelopment} from '../lib/development.ts';
import {trainingPreparation,trainingChoice} from '../lib/training-preparation.ts';
import {reviewRound} from '../lib/insights.ts';
import {matchAnalysis} from '../lib/match-analysis.ts';
import {commitWorkspace,loadWorkspace} from '../lib/storage.ts';
const ids=['J02','J24','J22','J05','J03'];
const draft=suggestAssignments({...defaultDraft(),selected:ids});
function finished(){let s=createSession(draft,'synthetic-history');while(s.state.phase!=='finished')s=advanceSession(s,{id:'r'+s.state.rounds,revision:s.state.rounds,plans:{A:draft.plan,B:draft.plan},buys:automaticBuys(s)});return s;}
const fixture=finished();
function workspace():Workspace{return {draft:structuredClone(draft),session:null,development:newDevelopment()};}
test('schema 2 remains readable and migration archives only finished current/previous once',()=>{
 const w=workspace();w.session=structuredClone(fixture);w.previous=structuredClone(fixture);w.development!.used=true;w.development!.matchId=fixture.id;
 const raw=JSON.parse(encodeSave(w));raw.schema=2;raw.beta='1.1.1';
 const old=decodeSave(JSON.stringify(raw));assert.equal(old.history,undefined);
 const migrated=initializeHistory(old);assert.equal(migrated.history!.length,1);assert.deepEqual(initializeHistory(migrated),migrated);
 assert.deepEqual(prepareImport(JSON.stringify(raw)).data.history,[fixture]);
 assert.equal(initializeHistory({...workspace(),session:createSession(draft,'ongoing')}).history!.length,0);
});
test('new match gets crypto seed while reload and export retain its exact identity',()=>{
 const w=workspace();w.development!.used=true;
 const a=beginMatch(w,'one'),b=beginMatch(w,'two');assert.notEqual(a.session!.seed,w.draft.seed);assert.notEqual(a.session!.seed,b.session!.seed);
 assert.deepEqual(decodeSave(encodeSave(a)),a);
 let n=0;assert.equal(randomSeed([9],()=>[0,9,42][n++]),42);assert.throws(()=>randomSeed([],()=>0),/gerar/);
});
test('history roundtrip, merge, conflict detection and independent snapshots',()=>{
 const w=archiveResult({...workspace(),session:structuredClone(fixture)});
 assert.equal(w.history!.length,1);assert.deepEqual(readHistory(historyJSON(w.history!)),w.history);
 assert.equal(mergeHistory(w,readHistory(historyJSON(w.history!))).history!.length,1);
 const changed=structuredClone(fixture);changed.names[changed.profiles[0].id]='changed';assert.throws(()=>addHistory(w.history!,changed),/identificador/);
 w.session!.profiles[0].attrs[0]++;assert.notEqual(w.history![0].profiles[0].attrs[0],w.session!.profiles[0].attrs[0]);
 const corrupt=JSON.parse(historyJSON([fixture]));corrupt.data[0].seed++;assert.throws(()=>readHistory(JSON.stringify(corrupt)),/incompleto/);
});
test('limit never evicts matches and reserves capacity for an active match',()=>{
 const history=Array.from({length:HISTORY_LIMIT},(_,i)=>({...structuredClone(fixture),id:'match-'+i}));
 const w={...workspace(),history};w.development!.used=true;
 assert.throws(()=>beginMatch(w,'next'),/Histórico cheio/);assert.equal(w.history.length,20);
 assert.throws(()=>addHistory(history,fixture),/Histórico cheio/);
 const active=beginMatch(workspaceWithTraining(),'active');assert.throws(()=>mergeHistory(active,history),/Reserve/);
 const reduced=deleteHistory(w,'match-0');assert.equal(reduced.history!.length,19);assert.doesNotThrow(()=>beginMatch(reduced,'next'));
});
function workspaceWithTraining(){const w=workspace();w.development!.used=true;return w;}
test('deleted previous is not resurrected by migration and history import preserves ongoing work',()=>{
 const w=initializeHistory({...workspace(),previous:fixture});const deleted=deleteHistory(w,fixture.id);
 assert.equal(initializeHistory(deleted).history!.length,0);assert.equal(deleted.previous,undefined);
 const active=beginMatch(workspaceWithTraining(),'active'),merged=mergeHistory(active,[fixture]);assert.deepEqual(merged.session,active.session);assert.deepEqual(merged.development,active.development);
});
test('CSV contains profiles, all rounds, safe cells and both sides',()=>{
 const s=structuredClone(fixture);s.names[s.profiles[0].id]='=DANGEROUS;"\nname';
 const csv=playersCSV([s]);assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes("'=DANGEROUS"));assert.ok(csv.includes('familiaridade'));assert.ok(csv.includes('B:0'));
 const rounds=roundsCSV([s]);assert.equal(rounds.split('\r\n').length,s.records.length+1);assert.ok(rounds.includes('compras_realizadas_rival'));
});
test('individual training doubles XP only for its target and persists after save',()=>{
 for(const kind of ['attribute','agent'] as const){
  const w=workspace(),p={...trainingPreparation(draft),mode:'individual' as const,playerId:ids[0],kind,attribute:6};w.trainingPreparation=p;
  const restored=decodeSave(encodeSave(w)),choice=trainingChoice(draft,restored.trainingPreparation!),out=previewTraining(restored.development!,ids,choice);
  assert.equal(out.gains.length,1);assert.equal(out.gains[0].gainedXP,2*xpPerSession(72));
  for(const id of ids.slice(1))assert.deepEqual(growthFor(out.development,id),growthFor(w.development,id));
  const saved=decodeSave(encodeSave({...w,development:out.development,trainingPreparation:undefined}));assert.equal(saved.development!.receipt!.gains.length,1);
  assert.throws(()=>previewTraining(saved.development!,ids,{kind:'attribute',attribute:0}),/já foi/);
 }
});
test('forecast respects XP remainder, individual mode and caps; receipt rejects fake modes',()=>{
 const dev=newDevelopment(),choice={kind:'attribute' as const,attribute:0};
 assert.equal(sessionsToGain(dev,ids[0],choice),2);assert.equal(sessionsToGain(dev,ids[0],{...choice,mode:'individual',playerId:ids[0]}),1);
 dev.players[ids[0]]=growthFor(dev,ids[0]);dev.players[ids[0]].attrs[0]=100;assert.equal(sessionsToGain(dev,ids[0],choice),null);
 assert.throws(()=>previewTraining(newDevelopment(),ids,{...choice,mode:'individual',playerId:'unknown'}),/titular/);
 const trained=previewTraining(newDevelopment(),ids,{...choice,mode:'individual',playerId:ids[0]}).development;trained.receipt!.choice.mode='bad' as never;assert.throws(()=>validateDevelopment(trained),/Comprovante/);
});
test('analysis uses historical profiles and actual initial side without changing results',()=>{
 const before=JSON.stringify(fixture),a=matchAnalysis(fixture);assert.equal(JSON.stringify(fixture),before);assert.ok(a.priorities.length<=2);assert.equal(a.players.length,5);
 const s=createSession(draft,'other-side');s.state.initialAttack='B';const next=advanceSession(s,{id:'one',revision:0,plans:{A:draft.plan,B:draft.plan},buys:'eco'});
 assert.equal(reviewRound(next,next.records[0]).attacking,'B');
 const older=structuredClone(fixture);const analyzed=matchAnalysis(older);const w={...workspace(),previous:older};w.development=previewTraining(w.development!,ids,{kind:'attribute',attribute:0}).development;assert.deepEqual(matchAnalysis(w.previous!),analyzed);
});
test('finished history persists atomically and stale-tab deletion cannot erase a newer save',async()=>{
 const w=workspace();w.session=structuredClone(fixture);w.development!.used=true;w.development!.matchId=fixture.id;
 const archived=archiveResult(w),revision=await commitWorkspace(archived,0),loaded=await loadWorkspace();assert.ok(loaded&&'data' in loaded);assert.equal(loaded.data.history!.length,1);
 const next=nextMatch(archived);await commitWorkspace(next,revision);
 await assert.rejects(()=>commitWorkspace(deleteHistory(archived,fixture.id),revision),/Outra aba/);
 const after=await loadWorkspace();assert.ok(after&&'data' in after);assert.equal(after.data.history!.length,1);
});
