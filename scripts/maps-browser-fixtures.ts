import {mkdirSync,writeFileSync} from 'node:fs';
import {defaultDraft,suggestAssignments,encodeSave} from '../lib/game.ts';
import {newDevelopment} from '../lib/development.ts';
mkdirSync('validation/maps/browser',{recursive:true});
for(const map of ['doca','cume'] as const){
 const draft=suggestAssignments({...defaultDraft(),map,org:`QA ${map}`,selected:['J12','J09','J02','J05','J24']});
 const development=newDevelopment();development.used=true;
 writeFileSync(`validation/maps/browser/${map}-fixture.json`,encodeSave({draft,development,session:null,history:[]}));
}
