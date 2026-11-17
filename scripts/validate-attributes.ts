import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {MECHANICS} from '../src/content.ts';
import {sha256} from '../src/hash.ts';
import {probe} from './attribute-probe.ts';
import type {Variant} from './attribute-probe.ts';

const holdout=process.argv.includes('--holdout'),group=holdout?'holdout':'exploratory';
const seeds=Array.from({length:8},(_,i)=>parseInt(sha256(`nexus-attributes-${group}-${i}`).slice(0,8),16)||1);
const cases=[];
for(const seed of seeds)for(const site of ['A','B'] as const)for(const attacking of ['A','B'] as const){
 cases.push(probe(seed,attacking,site,'equal',null));
 for(const variant of ['aim','positioning','combat','utility'] as Variant[])for(const boosted of ['A','B'] as const)cases.push(probe(seed,attacking,site,variant,boosted));
}
const meta={mechanics:MECHANICS,group,seeds,scope:'Stationary 1v1 in the live round resolver; other eight actors in spawn; no AI or abilities; same main weapon and shield. First two shots record the actual probability and RNG state passed to the engine. Each seed is reused in mirrored cases; cases are not independent.'};
const destination=process.env.NEXUS_ATTRIBUTE_OUTPUT??`validation/attributes/${group}.json`;
mkdirSync(dirname(resolve(destination)),{recursive:true});
writeFileSync(destination,`{\n  "meta": ${JSON.stringify(meta)},\n  "cases": [\n${cases.map(c=>'    '+JSON.stringify(c)).join(',\n')}\n  ]\n}\n`);
console.log(JSON.stringify({group,seeds,cases:cases.length,destination}));
