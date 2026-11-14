import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {profiles,plans} from '../test/fixtures.ts';
import {profiles as oldProfiles} from '../legacy/v0_4_1/test/fixtures.ts';
import {simulateRound} from '../src/simulation.ts';
import {simulateRound as oldRound} from '../legacy/v0_4_1/src/simulation.ts';
import {AGENTS} from '../src/abilities.ts';
import type {Agent} from '../src/abilities.ts';
import {MECHANICS} from '../src/content.ts';
import {OPPONENTS} from '../lib/opponents.ts';
import {sha256} from '../src/hash.ts';
const start=performance.now(),rows:any[]=[],events:Record<string,number>={},npcHash=sha256(JSON.stringify(OPPONENTS));
const sets:Agent[][]=[['Estalo','Farol','Prisma','Trava','Bastião'],['Ímpeto','Pulso','Bruma','Prisma','Bastião']];
for(const map of ['doca','cume'] as const)for(const attack of ['A','B'] as const)for(let composition=0;composition<2;composition++)for(const tier of [45,60,75])for(const seed of [101,207,409,613,919]){
 const p=profiles();for(const u of p){const i=Number(u.id.slice(1));u.agent=sets[u.team==='A'?composition:1-composition][i];u.attrs=Array(8).fill(u.team==='A'?tier:60) as any;}
 const options={map,attacking:attack,seed,plans},result=simulateRound(p,options),mirror=simulateRound([...p].reverse(),options);assert.deepEqual(result,mirror);
 for(const event of result.events)events[event.kind]=(events[event.kind]??0)+1;
 const frozen=oldProfiles();for(const u of frozen){const current=p.find(x=>x.id===u.id)!;Object.assign(u,{...current,agent:current.agent==='Prisma'?'Véu':current.agent});}
 const before=oldRound(frozen,options);rows.push({map,attack,composition,tier,seed,winner:result.winner,reason:result.reason,ms:result.at,oldWinner:before.winner,oldMs:before.at,protection:result.events.filter(e=>e.kind==='damage_prevented').reduce((n,e)=>n+(e.amount??0),0),casts:result.abilityUses});
}
assert.equal(sha256(JSON.stringify(OPPONENTS)),npcHash);assert.ok(events.effect_deployed>0&&events.damage_prevented>0&&events.optical_penalty>0);
const slices=[];for(const map of ['doca','cume'])for(const attack of ['A','B'])for(const tier of [45,60,75]){const subset=rows.filter(r=>r.map===map&&r.attack===attack&&r.tier===tier);slices.push({map,attack,tier,rounds:subset.length,userWins:subset.filter(r=>r.winner==='A').length,oldUserWins:subset.filter(r=>r.oldWinner==='A').length});}
const summary={scope:'Controlled integration sample of individual full-kit rounds; not tournament balance certification. Same profiles/seed/plans, Prisma versus old Véu and reworked Bastião versus old kit. Cast policy and effects intentionally differ.',mechanics:MECHANICS,rounds:rows.length,frozenComparisonRounds:rows.length,reversedInputReplays:rows.length,npcHash,npcUnchanged:true,allActiveAgents:AGENTS,events,slices,elapsedMs:Math.round(performance.now()-start),rows};mkdirSync('validation/reworks',{recursive:true});writeFileSync('validation/reworks/round-matrix.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({rounds:rows.length,events,slices,elapsedMs:summary.elapsedMs}));
