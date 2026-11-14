import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {AGENTS} from '../src/abilities.ts';
import {AGENT_ART} from '../lib/agent-art.ts';
const exported=process.argv.includes('--export'),directory=exported?'out':'public';
const manifest=JSON.parse(readFileSync('validation/agent-art/sources.json','utf8'));
function dimensions(b:Buffer){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');for(let i=12;i+8<b.length;){const type=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4),p=i+8;if(type==='VP8X')return [b.readUIntLE(p+4,3)+1,b.readUIntLE(p+7,3)+1];if(type==='VP8 ')return [b.readUInt16LE(p+6)&16383,b.readUInt16LE(p+8)&16383];if(type==='VP8L'){const bits=b.readUInt32LE(p+1);return [(bits&16383)+1,((bits>>>14)&16383)+1];}i=p+n+(n%2);}throw new Error('WebP dimensions not found');}
assert.deepEqual(Object.keys(AGENT_ART).sort(),[...AGENTS].sort());const paths=new Set<string>(),checks=[];
for(const agent of AGENTS)for(const kind of ['card','keyart','preview'] as const){const asset=AGENT_ART[agent][kind];assert.ok(!paths.has(asset.src));paths.add(asset.src);const path=directory+asset.src;assert.ok(existsSync(path),path);const bytes=readFileSync(path),record=manifest.originals.flatMap((s:any)=>s.deployed).find((s:any)=>s.path==='public'+asset.src);assert.ok(record,path);assert.equal(bytes.length,record.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);assert.deepEqual(dimensions(bytes),[asset.width,asset.height]);checks.push({agent,kind,path,bytes:bytes.length,width:asset.width,height:asset.height});}
assert.equal(paths.size,24);const result={exported,base:process.env.PAGES_BASE_PATH??'',files:checks.length,bytes:checks.reduce((n,x)=>n+x.bytes,0),checks};writeFileSync(`validation/agent-art/assets-${exported?(process.env.PAGES_BASE_PATH?'subpath':'root'):'source'}.json`,JSON.stringify(result,null,2)+'\n');console.log(`24 agent assets verified in ${directory}: dimensions, hashes and paths.`);
