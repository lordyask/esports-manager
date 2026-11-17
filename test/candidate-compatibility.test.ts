import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace,defaultDraft,suggestAssignments,createSession,advanceSession,encodeSave,decodeSave,prepareImport} from '../lib/game.ts';
import {commitWorkspace,loadWorkspace} from '../lib/storage.ts';
import {archiveFromText,readArchive} from '../lib/archive.ts';
import {historyJSON,readHistory} from '../lib/history.ts';
import {BETA_VERSION} from '../lib/release.ts';
import {MECHANICS} from '../src/content.ts';
import {freshWorkspace as legacyFresh,encodeSave as legacyEncode} from '../legacy/v0_4_1/lib/game.ts';
test('candidate identity preserves a development checkpoint and resumes exactly the same next round',async()=>{
 const draft=suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']}),command={id:'first',revision:0,buys:'eco' as const,plans:{A:draft.plan,B:draft.plan}};
 const session=advanceSession(createSession(draft,'candidate'),command),workspace={...freshWorkspace(),draft,session,development:{...freshWorkspace().development!,used:true,matchId:session.id}};
 const development=JSON.parse(encodeSave(workspace));development.beta='2.0.0-dev.reworks';
 const restored=decodeSave(JSON.stringify(development));assert.deepEqual(restored,workspace);
 const encoded=JSON.parse(encodeSave(restored));assert.equal(encoded.beta,BETA_VERSION);assert.equal(encoded.schema,6);assert.deepEqual(encoded.mechanics,MECHANICS);
 const next={...command,id:'second',revision:1};assert.deepEqual(advanceSession(restored.session!,next),advanceSession(session,next));
 const revision=(await loadWorkspace())?.revision??0;await commitWorkspace(restored,revision);assert.deepEqual((await loadWorkspace() as {data:unknown}).data,restored);
});
test('Beta 1.3 save is archived with its exact bytes and never becomes an active candidate campaign',()=>{
 const raw=legacyEncode(legacyFresh()),prepared=prepareImport(raw);assert.equal(prepared.archiveOnly,true);assert.equal(prepared.data.session,null);assert.equal(prepared.data.career,undefined);assert.equal(prepared.data.archives![0].text,raw);assert.equal(readArchive(prepared.data.archives![0]).engine,'0.4.1');
});
test('history remains compatible when the optional product version is absent',()=>{
 const e=JSON.parse(historyJSON([]));assert.equal(e.beta,BETA_VERSION);delete e.beta;assert.deepEqual(readHistory(JSON.stringify(e)),[]);
});
test('archived history displays its recorded product version without changing its contents',()=>{
 const raw=historyJSON([]),archive=archiveFromText(raw);assert.equal(readArchive(archive).beta,BETA_VERSION);assert.equal(archive.text,raw);
 const old=JSON.parse(raw);delete old.beta;assert.equal(readArchive(archiveFromText(JSON.stringify(old))).beta,'histórico sem versão identificada');
});
test('RC1 saves and history remain readable after the official product version changes',()=>{
 const workspace=freshWorkspace(),save=JSON.parse(encodeSave(workspace));save.beta='2.0.0-rc.1';assert.deepEqual(decodeSave(JSON.stringify(save)),workspace);
 const history=JSON.parse(historyJSON([]));history.beta='2.0.0-rc.1';assert.deepEqual(readHistory(JSON.stringify(history)),[]);
});
