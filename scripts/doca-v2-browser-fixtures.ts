// Synthetic fixtures only. Never include a user's save in the repository.
import {writeFileSync} from 'node:fs';
import {freshWorkspace,defaultDraft,suggestAssignments,createSession,encodeSave} from '../lib/game.ts';
import {freshWorkspace as oldFresh,defaultDraft as oldDraft,suggestAssignments as oldSuggest,createSession as oldSession,encodeSave as oldEncode} from '../legacy/v0_5_1/lib/game.ts';
const ids=['J12','J09','J02','J05','J24'];
const current=freshWorkspace();current.draft=suggestAssignments({...defaultDraft(),selected:ids});current.session=createSession(current.draft,'qa-doca-v2');current.session.state.initialAttack='B';current.development!.used=true;current.development!.matchId=current.session.id;
writeFileSync('/tmp/nexus-doca-v2-browser-save.json',encodeSave(current));
const old=oldFresh();old.draft=oldSuggest({...oldDraft(),selected:ids});old.session=oldSession(old.draft,'qa-old');old.development!.used=true;old.development!.matchId=old.session.id;
writeFileSync('/tmp/nexus-doca-v2-browser-old.json',oldEncode(old));
