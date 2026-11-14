import {mkdirSync,writeFileSync} from 'node:fs';
import {freshWorkspace,defaultDraft,suggestAssignments,advanceSession,automaticBuys,encodeSave} from '../lib/game.ts';
import {startCareer,advanceCareer,startCareerMatch,acceptCareerResult} from '../lib/career.ts';
const dir='validation/calendar/browser';mkdirSync(dir,{recursive:true});
const base={...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),org:'QA Calendário',tag:'QAC',selected:['J12','J09','J02','J05','J24']})};
writeFileSync(`${dir}/legacy-fixture.json`,encodeSave(base));
let w=startCareer(base,'qa-day28',20261110);
while(w.career!.day<28){
 w=advanceCareer(w,'event');if(w.career!.day===28)break;w=startCareerMatch(w);
 while(w.session!.state.phase==='buy'){const s=w.session!;w=acceptCareerResult(w,advanceSession(s,{id:`r${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:w.draft.plan,B:w.draft.plan}}));}
}
writeFileSync(`${dir}/day28-fixture.json`,encodeSave(w));
