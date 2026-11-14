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
const {CircuitEntry,CircuitPanel,FinancePanel}=await import('../../app/circuit-panel.tsx');
const {CalendarPanel}=await import('../../app/calendar-panel.tsx');
const {HomeDashboard}=await import('../../app/home-dashboard.tsx');
const {freshWorkspace,defaultDraft,suggestAssignments,decodeSave}=await import('../../lib/game.ts');
const {startCircuitCareer}=await import('../../lib/career.ts');
const directory=process.env.NEXUS_CIRCUIT_FIXTURES??'/tmp/nexus-circuit-validation',noop=()=>{},checks=[];
function render(name,Component,props){const before=JSON.stringify(props.workspace);const html=renderToStaticMarkup(createElement(Component,props));assert.equal(JSON.stringify(props.workspace),before);checks.push(name);return html;}
let emptyHtml=render('incomplete roster cannot confirm registration',CircuitEntry,{workspace:freshWorkspace(),busy:false,onStart:noop});assert.match(emptyHtml,/<button[^>]*disabled=""[^>]*>Confirmar inscrição e iniciar circuito/);assert.ok(emptyHtml.includes('Selecione cinco titulares'));
const base={...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']})};
let html=render('entry displays costs before confirmation',CircuitEntry,{workspace:base,busy:false,onStart:noop});assert.ok(html.includes('Confirmar inscrição e iniciar circuito'));assert.ok(html.includes('29.000'));assert.ok(html.includes('365 dias'));
html=render('calendar entry delegates to the competitive flow',CalendarPanel,{workspace:base,busy:false,onStart:noop,onAdvance:noop,onTrain:noop,onPrepare:noop,onProcessNpc:noop});assert.ok(html.includes('Confirmar inscrição e iniciar circuito'));
html=render('new circuit shows initial cash and contracts',FinancePanel,{workspace:startCircuitCareer(base,'ui',33)});assert.ok(html.includes('29.000,00 cr.'));assert.ok(html.includes('365'));
const pending=decodeSave(readFileSync(directory+'/pending.json','utf8'));
html=render('dashboard points unfinished rounds to the calendar',HomeDashboard,{workspace:pending,busy:false,onRoster:noop,onPlan:noop,onPrepare:noop,onCalendar:noop,onTrain:noop,onMatch:noop,onReport:noop});assert.ok(html.includes('Conclua a rodada.'));assert.ok(html.includes('Jogos restantes da rodada'));
html=render('unfinished NPC processing exposes recovery action',CircuitPanel,{workspace:pending,busy:false,onProcess:noop});assert.ok(html.includes('Rodada em processamento'));assert.ok(html.includes('Processar jogos restantes'));
html=render('busy processing disables duplicate request',CircuitPanel,{workspace:pending,busy:true,onProcess:noop});assert.match(html,/<button[^>]*disabled=""[^>]*>Processar jogos restantes/);
const complete=decodeSave(readFileSync(directory+'/complete.json','utf8'));
html=render('completed circuit presents champion and all 28 match records',CircuitPanel,{workspace:complete,busy:false,onProcess:noop});assert.ok(html.includes('Campeão:'));assert.ok(html.includes('Resumo da sua equipe'));assert.equal((html.match(/class="circuit-result"/g)??[]).length,28);assert.ok(!html.includes('Processar jogos restantes'));
html=render('final finance lists one prize and 337 contract days',FinancePanel,{workspace:complete});assert.ok(html.includes('337'));assert.equal((html.match(/Premiação pela colocação/g)??[]).length,1);
writeFileSync(process.env.NEXUS_VALIDATION_DIRECTORY?process.env.NEXUS_VALIDATION_DIRECTORY+'/panels-results.json':new URL('./panels-results.json',import.meta.url),JSON.stringify({method:'React server rendering; no browser, CSS or event-dispatch verification',checks,passed:checks.length},null,2)+'\n');console.log(`${checks.length} panel states verified without mutating campaign data.`);
