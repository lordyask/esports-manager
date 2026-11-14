import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {freshWorkspace,defaultDraft,suggestAssignments,advanceSession,automaticBuys,encodeSave,decodeSave} from '../lib/game.ts';
import {startCareer,trainCareer,advanceCareer,startCareerMatch,acceptCareerResult} from '../lib/career.ts';
import {OPPONENTS,opponentProfiles} from '../lib/opponents.ts';
import {growthFor} from '../lib/development.ts';
import {sha256} from '../src/hash.ts';
const rosters=[['J02','J24','J22','J05','J03'],['J12','J09','J02','J05','J24']];
const baseline=sha256(JSON.stringify(OPPONENTS)),results=[];
for(const [roster,selected] of rosters.entries())for(const mode of ['collective','individual','jump'] as const){
 let w=startCareer({...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected})},`validation-${roster}-${mode}`,11102026+roster),rounds=0;
 while(!w.career!.agendaCompleted){
  const c=w.career!;
  if(mode!=='jump')w=trainCareer(w,{mode,playerId:mode==='individual'?selected[(c.day-1)%5]:undefined,kind:'attribute',attribute:(c.day-1)%8});
  if(c.day%4===0){
   w=startCareerMatch(w);assert.deepEqual(w.session!.profiles.filter(p=>p.team==='B'),opponentProfiles(w.session!.metadata!.opponentId!));
   while(w.session!.state.phase!=='finished'){
    const s=w.session!;w=acceptCareerResult(w,advanceSession(s,{id:`r${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:w.draft.plan,B:{attack:'fast',defense:'balanced',site:'A'}}}));
   }
   rounds+=w.session!.state.rounds;
  }
  w=decodeSave(encodeSave(w));assert.equal(sha256(JSON.stringify(OPPONENTS)),baseline);
  if(!w.career!.agendaCompleted)w=advanceCareer(w,mode==='jump'?'event':'day');
 }
 const row={roster,mode,seed:w.career!.seed,days:w.career!.day,trainings:w.career!.days.filter(d=>d.status==='trained').length,missed:w.career!.days.filter(d=>d.status!=='trained').length,matches:w.career!.fixtures.length,rounds,results:w.career!.fixtures.map(f=>({day:f.day,map:f.map,opponent:f.opponentId,...f.result})),finalPlayers:selected.map(id=>({id,...growthFor(w.development,id)})),npcHash:baseline};
 assert.equal(row.matches,7);assert.equal(row.days,28);assert.equal(row.trainings,mode==='jump'?0:28);results.push(row);console.log(JSON.stringify({roster,mode,days:row.days,trainings:row.trainings,matches:row.matches,rounds}));
}
const summary={scope:'Calendar/training integration, fixed NPCs, two legal rosters, three routines. No global balance or financial/standings certification.',campaigns:results.length,matches:results.reduce((n,r)=>n+r.matches,0),rounds:results.reduce((n,r)=>n+r.rounds,0),dailySessions:results.reduce((n,r)=>n+r.trainings,0),npcUnchanged:true,npcHash:baseline,results};
mkdirSync('validation/calendar',{recursive:true});writeFileSync('validation/calendar/results.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,results:undefined}));
