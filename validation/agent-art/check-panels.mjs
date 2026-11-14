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

const {AgentsPanel,TrainingPanel}=await import('../../app/beta-panels.tsx');
const {AssignmentCards}=await import('../../app/assignment-cards.tsx');
const {AGENT_ART,artUrl}=await import('../../lib/agent-art.ts');
const {AGENTS,PLAYERS,freshWorkspace,defaultDraft,suggestAssignments,encodeSave}=await import('../../lib/game.ts');
const noop=()=>{},checks=[];
function render(name,Component,props){const before=JSON.stringify(props),html=renderToStaticMarkup(createElement(Component,props));assert.equal(JSON.stringify(props),before);checks.push(name);return html;}
const workspace={...freshWorkspace(),draft:suggestAssignments({...defaultDraft(),selected:['J12','J09','J02','J05','J24']})},before=encodeSave(workspace);
let html=render('all eight agents show their own key art, card, class and four live ability names',AgentsPanel,{draft:workspace.draft,development:workspace.development});
assert.equal((html.match(/<article/g)??[]).length,8);assert.equal((html.match(/class="agent-poster"/g)??[]).length,8);assert.equal((html.match(/<li>/g)??[]).length,32);
for(const agent of AGENTS){const a=AGENT_ART[agent];for(const kind of ['card','keyart','preview'])assert.ok(html.includes(artUrl(a[kind])));assert.ok(html.includes(a.classLabel));assert.ok(html.includes(`Ver card oficial de ${agent}`));assert.ok(html.includes(`alt="Arte cinematográfica oficial de ${agent}"`));assert.ok(html.includes(`width="${a.card.width}" height="${a.card.height}"`));}
assert.ok(!html.includes('>Véu<'));assert.ok(html.includes('Consulte abaixo os efeitos usados nas partidas.'));
const players=workspace.draft.selected.map(id=>PLAYERS.find(p=>p.id===id));
html=render('preparation displays assigned agents without replacing athlete identities',AssignmentCards,{players,draft:workspace.draft,development:workspace.development,disabled:false,onChange:noop});for(const p of players){assert.ok(html.includes(p.name));assert.ok(html.includes(artUrl(AGENT_ART[workspace.draft.assignments[p.id].agent].preview)));}assert.equal((html.match(/class="agent-identity"/g)??[]).length,5);
html=render('locked preparation retains visuals and disables all fifteen existing controls',AssignmentCards,{players,draft:workspace.draft,development:workspace.development,disabled:true,onChange:noop});assert.equal((html.match(/disabled=""/g)??[]).length,15);
const changed=structuredClone(workspace.draft);for(const agent of AGENTS){changed.assignments[players[0].id].agent=agent;html=render(`controlled preparation props select matching ${agent} artwork`,AssignmentCards,{players:[players[0]],draft:changed,development:workspace.development,disabled:false,onChange:noop});assert.ok(html.includes(artUrl(AGENT_ART[agent].preview)));}
const athlete=PLAYERS.find(p=>p.id==='J11');html=render('athlete Prisma J11 keeps main Farol; no alias to agent Prisma',AssignmentCards,{players:[athlete],draft:{...defaultDraft(),selected:['J11']},disabled:false,onChange:noop});assert.ok(html.includes('<h3>Prisma</h3>'));assert.ok(html.includes(artUrl(AGENT_ART.Farol.preview)));assert.ok(!html.includes(artUrl(AGENT_ART.Prisma.preview)));
const trainingProps={draft:workspace.draft,development:workspace.development,onChange:noop,onConfirm:noop,onSkip:noop,disabled:false,saved:true};
html=render('attribute training illustrates assigned agent',TrainingPanel,trainingProps);assert.equal((html.match(/class="agent-identity"/g)??[]).length,5);assert.ok(html.includes('Agente escalado'));
const preparation={kind:'agent',attribute:0,agents:Object.fromEntries(workspace.draft.selected.map(id=>[id,'Prisma']))};html=render('agent training illustrates focus without modifying assignment',TrainingPanel,{...trainingProps,preparation});assert.ok(html.includes('Foco do treino'));assert.equal((html.match(/alt="Arte oficial de Prisma"/g)??[]).length,5);assert.equal(encodeSave(workspace),before);
writeFileSync(`validation/agent-art/panels-${process.env.NEXT_PUBLIC_BASE_PATH?'subpath':'root'}.json`,JSON.stringify({method:'React static rendering only; no browser events, CSS layout, focus, opening links or image network load verification.',base:process.env.NEXT_PUBLIC_BASE_PATH??'',checks,passed:checks.length},null,2)+'\n');console.log(`${checks.length} artwork component states verified.`);
