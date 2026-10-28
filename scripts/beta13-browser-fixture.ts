import {writeFileSync} from 'node:fs';
import {defaultDraft,suggestAssignments,createSession,advanceSession,automaticBuys,encodeSave} from '../lib/game.ts';
import {newDevelopment} from '../lib/development.ts';
const draft=suggestAssignments({...defaultDraft(),org:'QA Beta 1.3',tag:'QA13',selected:['J02','J24','J22','J05','J03']});
let session=createSession(draft,'qa-old-save');
while(session.state.phase!=='finished')session=advanceSession(session,{id:`r${session.state.rounds}`,revision:session.state.rounds,plans:{A:draft.plan,B:draft.plan},buys:automaticBuys(session)});
const development=newDevelopment();development.used=true;development.matchId=session.id;
const envelope=JSON.parse(encodeSave({draft,session,development}));envelope.schema=2;envelope.beta='1.1.1';
writeFileSync('/tmp/beta13-browser-fixture.json',JSON.stringify(envelope));
