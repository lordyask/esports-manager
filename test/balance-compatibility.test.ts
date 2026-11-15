import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace as beforeFresh,defaultDraft as beforeDraft,suggestAssignments as beforeSuggest,encodeSave as beforeEncode} from '../legacy/v0_5_0/lib/game.ts';
import {startCircuitCareer as beforeCareer,trainCareer as beforeTrain} from '../legacy/v0_5_0/lib/career.ts';
import {freshWorkspace as oldFresh,encodeSave as oldEncode} from '../legacy/v0_4_1/lib/game.ts';
import {decodeSave,encodeSave,prepareImport} from '../lib/game.ts';
import {readArchive,legacyWorkspace} from '../lib/archive.ts';
const ids=['J12','J09','J02','J05','J24'];
test('prior 0.5.0 campaign and its embedded acervo remain read-only, exportable and directly accessible',()=>{
 const old=oldEncode(oldFresh()),child={id:(awaitHash(old)),text:old};let w=beforeCareer({...beforeFresh(),draft:beforeSuggest({...beforeDraft(),selected:ids}),archives:[child]},'prior-mechanics',13);w=beforeTrain(w,{kind:'attribute',attribute:0});const raw=beforeEncode(w),out=legacyWorkspace(raw);assert.throws(()=>decodeSave(raw),/preservado/i);
 assert.equal(out.career,undefined);assert.equal(out.session,null);assert.equal(out.archives!.length,2);assert.equal(out.development!.completed,0);assert.deepEqual(out.development!.players,{});
 const parent=out.archives!.find(a=>a.text===raw)!;assert.ok(parent);assert.deepEqual(readArchive(parent).data.career,w.career);assert.equal(readArchive(parent).engine,'0.5.0');assert.equal(out.archives!.find(a=>a.id===child.id)!.text,old);assert.deepEqual(decodeSave(encodeSave(out)),out);assert.equal(prepareImport(raw).archiveOnly,true);assert.equal(prepareImport(raw).data.archives!.length,2);
});
import {sha256 as awaitHash} from '../src/hash.ts';

import {createSession as beforeSession,advanceSession as beforeAdvance,automaticBuys as beforeBuys} from '../legacy/v0_5_0/lib/game.ts';
import {historyJSON as beforeHistory} from '../legacy/v0_5_0/lib/history.ts';
import {advanceSession as currentAdvance} from '../lib/game.ts';
test('completed prior sessions and history exports preserve their original mechanics without continuation',()=>{
 const draft=beforeSuggest({...beforeDraft(),selected:ids});let session=beforeSession(draft,'prior-history');while(session.state.phase!=='finished')session=beforeAdvance(session,{id:'r'+session.state.rounds,revision:session.state.rounds,buys:beforeBuys(session),plans:{A:draft.plan,B:draft.plan}});
 const raw=beforeHistory([session]),out=prepareImport(raw);assert.equal(out.archiveOnly,true);assert.equal(out.data.archives![0].text,raw);assert.deepEqual(readArchive(out.data.archives![0]).data.history,[session]);assert.throws(()=>currentAdvance(session as any,{id:'no-mixing',revision:session.state.rounds,buys:'eco',plans:{A:draft.plan,B:draft.plan}}),/incompatível/);
});
test('prior decoder rejects incompatible mechanics and an additional nested prior archive level',()=>{
 const child=beforeEncode(beforeFresh()),middle=beforeEncode({...beforeFresh(),archives:[{id:awaitHash(child),text:child}]}),root=beforeEncode({...beforeFresh(),archives:[{id:awaitHash(middle),text:middle}]});assert.throws(()=>prepareImport(root),/aninhados/);
 const bad=JSON.parse(child);bad.mechanics.contentHash='altered';assert.throws(()=>prepareImport(JSON.stringify(bad)),/incompatível/);
});
