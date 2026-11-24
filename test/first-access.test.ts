import test from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace,encodeSave,decodeSave,validateDraft} from '../lib/game.ts';
import {paths,withRoster,rosterTotals,swapPlayer,registrationDraft,registerCircuit} from '../lib/first-access.ts';
import {cashCents} from '../lib/club-finance.ts';

test('recommendations use catalog IDs and a cap independent of club cash',()=>{
 assert.deepEqual(rosterTotals(paths.balanced.ids),{payroll:12000,margin:0,average:58.8});
 assert.deepEqual(rosterTotals(paths.economy.ids),{payroll:8200,margin:3800,average:51});
 assert.deepEqual(rosterTotals(paths.manual.ids),{payroll:0,margin:12000,average:0});
});
test('replacing the captain transfers leadership and enforces the cap',()=>{
 const base=freshWorkspace().draft;
 const saved=withRoster(base,paths.economy.ids,paths.economy.captain);
 const next=swapPlayer(saved,'J04','J12');
 assert.equal(next.igl,'J12');assert.equal(next.selected[2],'J12');
 assert.deepEqual(rosterTotals(next.selected),{payroll:9900,margin:2100,average:54});
 assert.equal(rosterTotals(next.selected).payroll-rosterTotals(saved.selected).payroll,1700);
 assert.throws(()=>swapPlayer(next,'J01','J15'),/teto/);
 assert.throws(()=>swapPlayer(next,'J01','J12'));
 assert.equal(saved.igl,'J04');
});
test('both plans register exactly five assignments and keep the reviewed captain',()=>{
 for(const plan of [paths.economy,paths.balanced]){
  const w=freshWorkspace();
  w.draft=registrationDraft(withRoster(w.draft,plan.ids,plan.captain));
  validateDraft(w.draft);
  w.onboarding={stage:'registration',path:'manual'};
  const saved=registerCircuit(decodeSave(encodeSave(w)),'local-test');
  assert.deepEqual(saved.career!.roster,plan.ids);
  assert.equal(saved.draft.igl,plan.captain);
  assert.equal(new Set(plan.ids.map(id=>saved.draft.assignments[id].agent)).size,5);
  const finance=saved.career!.circuit!.finance;
  assert.equal(cashCents(finance),2900000);assert.equal(finance.contracts.length,5);
  assert.equal(finance.ledger.filter(e=>e.kind==='entry').length,1);
  assert.ok(!saved.onboarding);assert.throws(()=>registerCircuit(saved,'duplicate'));
  assert.deepEqual(decodeSave(encodeSave(saved)),saved);
 }
});
test('manual partial drafts round-trip without inventing a career or changing the captain',()=>{
 const w=freshWorkspace();w.draft=withRoster(w.draft,['J01','J05','J04'],'J05');
 w.onboarding={stage:'roster',path:'manual'};
 const loaded=decodeSave(encodeSave(w));assert.deepEqual(loaded,w);
 assert.deepEqual(rosterTotals(loaded.draft.selected).margin,7500);
 assert.throws(()=>registrationDraft(loaded.draft));
 assert.equal(decodeSave(encodeSave(freshWorkspace())).onboarding,undefined);
});
