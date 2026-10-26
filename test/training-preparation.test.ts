import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace,suggestAssignments,encodeSave,decodeSave,beginMatch,nextMatch,advanceSession,automaticBuys} from '../lib/game.ts';
import {trainingPreparation,trainingChoice} from '../lib/training-preparation.ts';
import {newDevelopment,previewTraining,growthFor} from '../lib/development.ts';
import {commitWorkspace,loadWorkspace} from '../lib/storage.ts';
const ids=['J02','J24','J22','J05','J03'];
const workspace=()=>{const w=freshWorkspace();w.draft=suggestAssignments({...w.draft,selected:ids});return w;};
test('an unconfirmed attribute choice survives durable reload without consuming training or granting XP',async()=>{
 const w=workspace(),baseline=structuredClone(w.development);w.trainingPreparation={...trainingPreparation(w.draft),attribute:6};
 let rev=await commitWorkspace(w,0);let restored=await loadWorkspace();assert.ok(restored&&'data' in restored);
 assert.equal(restored.data.trainingPreparation!.kind,'attribute');assert.equal(restored.data.trainingPreparation!.attribute,6);assert.deepEqual(restored.data.development,baseline);
 // Switching mode must retain the attribute selection and all personal agent choices.
 const agentDraft={...restored.data.trainingPreparation!,kind:'agent' as const,agents:{...restored.data.trainingPreparation!.agents,J02:'Farol' as const,J24:'Bruma' as const}};
 rev=await commitWorkspace({...restored.data,trainingPreparation:agentDraft},rev);restored=await loadWorkspace();assert.ok(restored&&'data' in restored);
 assert.deepEqual(restored.data.trainingPreparation,agentDraft);assert.deepEqual(restored.data.development,baseline);
 const attributeDraft={...agentDraft,kind:'attribute' as const};
 await commitWorkspace({...restored.data,trainingPreparation:attributeDraft},rev);restored=await loadWorkspace();assert.ok(restored&&'data' in restored);
 assert.equal(restored.data.trainingPreparation!.attribute,6);assert.equal(restored.data.trainingPreparation!.agents.J02,'Farol');
});
test('agent training is independent of the assigned match agent and retains individual choices',()=>{
 const w=workspace(),assignments=structuredClone(w.draft.assignments),p=trainingPreparation(w.draft);p.kind='agent';p.agents.J02='Bastião';p.agents.J24='Véu';
 const choice=trainingChoice(w.draft,p);assert.equal(choice.agents!.J02,'Bastião');assert.equal(choice.agents!.J24,'Véu');
 const trained=previewTraining(w.development!,ids,choice).development;
 assert.deepEqual(w.draft.assignments,assignments);assert.deepEqual(growthFor(trained,'J02').attrs,growthFor(w.development,'J02').attrs);
 assert.equal(decodeSave(encodeSave({...w,development:trained})).development!.receipt!.choice.agents!.J02,'Bastião');
});
test('changing the roster drops only departed players and defaults the replacement by its own identity',()=>{
 const w=workspace(),p=trainingPreparation(w.draft);p.kind='agent';p.attribute=4;p.agents.J02='Véu';p.agents.J24='Pulso';
 const draft={...w.draft,selected:['J01',...ids.slice(1)]},next=trainingPreparation(draft,p);
 assert.equal(next.agents.J02,undefined);assert.equal(next.agents.J24,'Pulso');assert.equal(next.attribute,4);assert.equal(Object.keys(next.agents).length,5);
 assert.equal(next.agents.J01,trainingPreparation(draft).agents.J01);
 assert.doesNotThrow(()=>decodeSave(encodeSave({...w,draft,trainingPreparation:next})));
});
test('schema 2 saves from Beta 1.1 remain readable without a training draft',()=>{
 const w=workspace(),text=JSON.parse(encodeSave(w));text.beta='1.1.0';assert.deepEqual(decodeSave(JSON.stringify(text)),w);
});
test('invalid saved training targets are rejected before rendering',()=>{
 const w=workspace();w.trainingPreparation={...trainingPreparation(w.draft),attribute:8};assert.throws(()=>decodeSave(encodeSave(w)),/Escolhas de treino/);
 w.trainingPreparation={...trainingPreparation(w.draft),agents:{unknown:'Estalo'}};assert.throws(()=>decodeSave(encodeSave(w)),/Escolhas de treino/);
 w.trainingPreparation={...trainingPreparation(w.draft),agents:{J02:'unknown' as never}};assert.throws(()=>decodeSave(encodeSave(w)),/Escolhas de treino/);
});
test('confirmed attribute training uses the saved target exactly once after reload',()=>{
 const w=workspace();w.trainingPreparation={...trainingPreparation(w.draft),attribute:5};const restored=decodeSave(encodeSave(w));
 const trained=previewTraining(restored.development!,ids,trainingChoice(restored.draft,restored.trainingPreparation!)).development;
 const saved=decodeSave(encodeSave({...restored,development:trained,trainingPreparation:undefined}));
 assert.equal(saved.trainingPreparation,undefined);assert.equal(saved.development!.receipt!.choice.attribute,5);
 for(const id of ids){assert.equal(growthFor(saved.development,id).attributeXP[0],0);assert.ok(saved.development!.receipt!.gains.find(g=>g.id===id)!.gainedXP>0);}
 assert.throws(()=>previewTraining(saved.development!,ids,{kind:'attribute',attribute:5}),/já foi/);
});
test('a new full match clears the previous preparation and preserves confirmed growth',()=>{
 let w=workspace();w.development=previewTraining(newDevelopment(),ids,{kind:'attribute',attribute:2}).development;w=beginMatch(w,'cycle');
 while(w.session!.state.phase!=='finished'){const s=w.session!;w.session=advanceSession(s,{id:`r-${s.state.rounds}`,revision:s.state.rounds,plans:{A:w.draft.plan,B:w.draft.plan},buys:automaticBuys(s)});}
 w.trainingPreparation={...trainingPreparation(w.draft),attribute:7};const before=structuredClone(w.development!.players),next=nextMatch(w);
 assert.equal(next.trainingPreparation,undefined);assert.equal(next.development!.used,false);assert.deepEqual(next.development!.players,before);
});
