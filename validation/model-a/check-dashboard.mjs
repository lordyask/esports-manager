// Static component verification. This does not measure CSS, viewport layout or browser interaction.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {registerHooks} from 'node:module';
import swc from 'next/dist/build/swc/index.js';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
await swc.loadBindings();
registerHooks({
 resolve(specifier,context,nextResolve){
  if(specifier.startsWith('.')&&context.parentURL&&!/\.[a-z]+$/i.test(specifier)){
   for(const ext of ['.ts','.tsx']){const url=new URL(specifier+ext,context.parentURL);if(existsSync(fileURLToPath(url)))return nextResolve(url.href,context);}
  }
  return nextResolve(specifier,context);
 },
 load(url,context,nextLoad){
  if(url.endsWith('.tsx'))return {format:'module',source:swc.transformSync(readFileSync(fileURLToPath(url),'utf8'),{filename:fileURLToPath(url),jsc:{parser:{syntax:'typescript',tsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'es6'}}).code,shortCircuit:true};
  return nextLoad(url,context);
 }
});
const {HomeDashboard}=await import('../../app/home-dashboard.tsx');
const {freshWorkspace,defaultDraft,suggestAssignments,automaticBuys,advanceSession}=await import('../../lib/game.ts');
const {startCareer,trainCareer,advanceCareer,startCareerMatch,acceptCareerResult}=await import('../../lib/career.ts');
const {opponentFor}=await import('../../lib/opponents.ts');
const noop=()=>{},results=[];
function render(name,workspace,busy=false){
 const before=JSON.stringify(workspace);
 const html=renderToStaticMarkup(createElement(HomeDashboard,{workspace,busy,onRoster:noop,onPlan:noop,onPrepare:noop,onCalendar:noop,onTrain:noop,onMatch:noop,onReport:noop}));
 assert.equal(JSON.stringify(workspace),before,'Rendering must not mutate the save');
 results.push({state:name,passed:true});return html;
}
function button(html,label){const buttons=[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];const b=buttons.find(([,attrs,content])=>content.replace(/<[^>]*>/g,'')===label);assert.ok(b,`Missing action: ${label}`);return {disabled:/\bdisabled=""/.test(b[1])};}
let w=freshWorkspace();assert.equal(button(render('new organization',w),'Montar meu elenco').disabled,false);
w={...w,draft:suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']})};
assert.equal(button(render('five selected players',w),'Abrir treinamento').disabled,false);
w=startCareer(w,'dashboard-check',902111);
let html=render('career day 1',w);assert.ok(html.includes(opponentFor(w.career.fixtures[0].opponentId).name));assert.equal(button(html,'Treinar hoje').disabled,false);
assert.equal(button(render('trained day',trainCareer(w,{kind:'attribute',attribute:0})),'Treinar hoje').disabled,true);
w=advanceCareer(w,'event');assert.equal(button(render('match day',w),'Preparar confronto').disabled,false);
html=render('busy match day',w,true);assert.ok([...html.matchAll(/<button\b([^>]*)>/g)].every(m=>/\bdisabled=""/.test(m[1])));
w=startCareerMatch(w);html=render('active match',w);assert.equal(button(html,'Continuar minha partida').disabled,false);assert.equal(button(html,'Treinar hoje').disabled,true);
function finish(input){let next=input;while(next.session.state.phase==='buy'){const s=next.session;next=acceptCareerResult(next,advanceSession(s,{id:`r${s.state.rounds}`,revision:s.state.rounds,buys:automaticBuys(s),plans:{A:next.draft.plan,B:{attack:'fast',defense:'balanced',site:'A'}}}));}return next;}
w=finish(w);html=render('finished match',w);assert.equal(button(html,'Ver relatório da partida').disabled,false);assert.equal(button(html,'Treinar hoje').disabled,true);
while(!w.career.agendaCompleted)w=finish(startCareerMatch(advanceCareer(w,'event')));
html=render('completed cycle',w);assert.ok(html.includes('Sua agenda está concluída.'));assert.equal(button(html,'Treinar hoje').disabled,true);
writeFileSync(new URL('./dashboard-states.json',import.meta.url),JSON.stringify({method:'React server render; no browser/CSS verification',states:results},null,2)+'\n');
console.log(`${results.length} dashboard states verified; save state preserved while rendering.`);
