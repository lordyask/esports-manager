import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DOCA_V2_AREAS,DOCA_V2_MOVEMENT,docaSight,docaCanFire} from '../src/doca-v2.ts';
import type {DocaArea} from '../src/doca-v2.ts';
function route(a:DocaArea,b:DocaArea,blocked:DocaArea[]=[]):DocaArea[]|null{
 const queue:[[DocaArea,DocaArea[]]]|[DocaArea,DocaArea[]][]=[[a,[a]]],seen=new Set(blocked);
 while(queue.length){const [x,path]=queue.shift()!;if(x===b)return path;if(seen.has(x))continue;seen.add(x);for(const [l,r] of DOCA_V2_MOVEMENT){const n=l===x?r:r===x?l:null;if(n&&!seen.has(n))queue.push([n,[...path,n]]);}}return null;
}
test('Doca V2 preserves the approved three independent exits, sites and continuous gallery',()=>{
 assert.ok(route('attack','A',['triage']));assert.ok(route('attack','B',['triage']));assert.ok(route('attack','mid',['reception','maintenance']));
 assert.ok(route('A','B',['defense']));assert.deepEqual(route('gallery_a','gallery_b',['defense']),['gallery_a','gallery','gallery_b']);
 assert.equal(DOCA_V2_MOVEMENT.some(([a,b])=>[a,b].includes('mid')&&[a,b].includes('gallery')),false);
 for(const a of Object.keys(DOCA_V2_AREAS) as DocaArea[])for(const b of Object.keys(DOCA_V2_AREAS) as DocaArea[])assert.ok(route(a,b));
});
test('walls and cover separate sight from travel, including exposure on a curved route',()=>{
 assert.equal(docaSight({sector:'attack'},{sector:'defense'}).visible,false);
 assert.equal(docaSight({sector:'A'},{sector:'cover_a'}).visible,false);assert.ok(route('A','cover_a'));
 assert.equal(docaSight({sector:'attack'},{sector:'reception'}).visible,false);
 const moving={sector:'attack' as const,movement:{from:'attack' as const,to:'reception' as const,initial:4500,remaining:500}};
 assert.equal(docaSight(moving,{sector:'reception'}).visible,true);assert.equal(docaSight({sector:'reception'},moving).visible,true);
 assert.equal(docaCanFire({sector:'attack'},{sector:'reception'}),false);
});
