import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
test('approved initial catalog preserves 24 unique players and valid affordable selections',()=>{
  const ps=data.players;assert.equal(ps.length,24);assert.equal(new Set(ps.map((p:any)=>p.id)).size,24);
  let combinations=0;
  for(let a=0;a<20;a++)for(let b=a+1;b<21;b++)for(let c=b+1;c<22;c++)for(let d=c+1;d<23;d++)for(let e=d+1;e<24;e++)
    if([a,b,c,d,e].reduce((s,i)=>s+ps[i].salary,0)<=12000)combinations++;
  assert.equal(combinations,5485);
  for(const p of ps){assert.equal(p.attrs.reduce((s:number,x:number)=>s+x,0)/8,p.overall);assert.ok(p.potential>=p.overall);if(p.potential>=85)assert.ok(p.salary>=2500);}
  for(const name of new Set(ps.map((p:any)=>p.main)))assert.equal(ps.filter((p:any)=>p.main===name).length,3);
});
