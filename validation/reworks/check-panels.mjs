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

const {RestartDialog}=await import('../../app/restart-dialog.tsx');
const {ArchivePanel}=await import('../../app/archive-panel.tsx');
const {AgentsPanel}=await import('../../app/beta-panels.tsx');
const {freshWorkspace,defaultDraft,suggestAssignments}=await import('../../lib/game.ts');
const {startCircuitCareer}=await import('../../lib/career.ts');
const {restartCareer}=await import('../../lib/archive.ts');

const noop=()=>{},checks=[];
function render(name,Component,props){const before=JSON.stringify(props);const html=renderToStaticMarkup(createElement(Component,props));assert.equal(JSON.stringify(props),before);checks.push(name);return html;}
let html=render('career reset explicitly lists what clears and preserves, with export and cancel',RestartDialog,{dialogRef:null,organization:false,busy:false,error:'',onExport:noop,onCancel:noop,onConfirm:noop});
for(const text of ['Reiniciar carreira','serão mantidos','Cancelar','Exportar antes de reiniciar','Confirmar reinício da carreira','acervo'])assert.ok(html.includes(text));
html=render('organization reset explicitly also clears identity',RestartDialog,{dialogRef:null,organization:true,busy:false,error:'',onExport:noop,onCancel:noop,onConfirm:noop});assert.ok(html.includes('também voltarão ao padrão'));
html=render('save in progress disables duplicate actions and exposes save errors',RestartDialog,{dialogRef:null,organization:false,busy:true,error:'Outra aba atualizou o progresso.',onExport:noop,onCancel:noop,onConfirm:noop});assert.equal((html.match(/disabled=""/g)??[]).length,3);assert.ok(html.includes('role="alert"'));
const w={...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']})};
html=render('new eight-agent catalog has both approved cards and precise rules',AgentsPanel,{draft:w.draft,development:w.development});for(const text of ['Plano Prismático','Câmara de Refração','Último Reduto','/agents/prisma-card.webp','/agents/bastiao-card.webp','Neutralizar exige'])assert.ok(html.includes(text));assert.ok(!html.includes('>Véu<'));
const reset=restartCareer(startCircuitCareer(w,'render',23));html=render('interrupted campaign appears in read-only acervo with original export',ArchivePanel,{workspace:reset,busy:false,onExport:noop,onRemove:noop});assert.ok(html.includes('Somente consulta'));assert.ok(html.includes('Circuito interrompido'));assert.ok(html.includes('Exportar arquivo original'));assert.ok(!html.includes('Processar jogos restantes'));
writeFileSync('validation/reworks/panels-results.json',JSON.stringify({method:'React static rendering; no CSS layout, browser, click, focus, Escape, native download or IndexedDB-in-browser validation.',checks,passed:checks.length},null,2)+'\n');console.log(`${checks.length} new component states passed.`);
