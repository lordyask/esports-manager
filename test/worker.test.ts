import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {once} from 'node:events';
import {createSession,defaultDraft,suggestAssignments,advanceSession} from '../lib/game.ts';
test('worker message protocol produces the same serialized round and reports errors',async()=>{
 const worker=new Worker(new URL('./worker-fixture.mjs',import.meta.url));
 try{
  const [ready]=await once(worker,'message');assert.equal(ready.ready,true);
  const draft=suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']}),session=createSession(draft,'worker');
  const command={id:'round-1',revision:0,buys:'eco' as const,plans:{A:draft.plan,B:draft.plan}},expected=advanceSession(session,command);
  worker.postMessage({id:'request-1',session,command});const [reply]=await once(worker,'message');assert.equal(reply.id,'request-1');assert.deepEqual(reply.session,expected);
  worker.postMessage({id:'request-2',session:expected,command:{...command,id:'stale'}});const [error]=await once(worker,'message');assert.equal(error.id,'request-2');assert.match(error.error,/outra operação/);
 }finally{await worker.terminate();}
});
