// Synthetic browser fixtures only; never include a user's save in the repository.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {acceptCareerResult,advanceCareer,startCareerMatch,startCircuitCareer,trainCareer} from '../lib/career.ts';
import {clubPlan} from '../lib/club-policy.ts';
import {acceptNpcResult,createNpcSession,npcCommand} from '../lib/circuit.ts';
import {pendingNpc} from '../lib/circuit-state.ts';
import {advanceSession,automaticBuys,decodeSave,defaultDraft,encodeSave,freshWorkspace,suggestAssignments} from '../lib/game.ts';
import type {Workspace} from '../lib/game.ts';

const directory=resolve(process.env.NEXUS_ARENA_FIXTURES??'/tmp/nexus-arena-command-fixtures');mkdirSync(directory,{recursive:true});
function save(name:string,w:Workspace){const raw=encodeSave(w);decodeSave(raw);writeFileSync(`${directory}/${name}.json`,raw);}
const ids=['J12','J09','J02','J05','J24'];
const partial=freshWorkspace();partial.draft.selected=[ids[0]];save('partial',partial);
let w=startCircuitCareer({...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),org:'Organização NEXUS de Teste',tag:'NXQA',selected:ids})},'arena-interface-fixture',7331);
w=trainCareer(w,{kind:'attribute',attribute:0});w=advanceCareer(w,'event');w=startCareerMatch(w);
while(w.session!.state.phase==='buy'){
 const s=w.session!;w=acceptCareerResult(w,advanceSession(s,{id:`fixture-${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:w.draft.plan,B:clubPlan(s.metadata!.opponentId!,s.seed,s.state.rounds)}}));
}
save('processing',w);
let match=pendingNpc(w.career!);
while(match){let npc=createNpcSession(match);while(npc.state.phase==='buy')npc=advanceSession(npc,npcCommand(match,npc));w=acceptNpcResult(w,match.id,npc);match=pendingNpc(w.career!);}
w=advanceCareer(w,'event');save('career',w);
save('history',{...freshWorkspace(),history:structuredClone(w.history??[])});
save('active',startCareerMatch(w));
save('trained',trainCareer(w,{kind:'attribute',attribute:1}));
const long=structuredClone(w);long.draft.org='ORGANIZAÇÃO NEXUS INTERNACIONAL DE ELITE';long.draft.tag='NEXUS';save('long',long);
console.log(JSON.stringify({directory,day:w.career!.day,completed:w.career!.fixtures.filter(f=>f.result).length,fixtures:['partial','processing','career','history','active','trained','long']}));
