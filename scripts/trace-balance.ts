import {TacticalRound} from '../src/simulation.ts';
import {TacticalRound as BeforeRound} from '../legacy/v0_5_0/src/simulation.ts';
import type {Profile} from '../src/tactical-types.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
const p:Profile[]=(['A','B'] as const).flatMap(team=>(['Estalo','Farol','Trava','Prisma','Bastião'] as const).map((agent,i)=>({id:team+i,team,agent,attrs:[60,60,60,60,60,60,60,60],agentFamiliarity:85,mapFamiliarity:50,morale:70,fatigue:10,weapon:'main',shield:50,charges:[true,true,true],ult:0,role:(['Entry','Support','Second','Support','Anchor'] as const)[i]})));
const plan={attack:'fast' as const,defense:'balanced' as const,site:'A' as const},r=new (process.env.NEXUS_TRACE_TAG==='before'?BeforeRound:TacticalRound)(p,{map:'doca',attacking:'A',seed:10001,plans:{A:plan,B:plan}});const records:any[]=[];
for(let at=0;at<=30000&&!r.result;at+=250){r.advance(at);records.push({at,units:r.units.filter(u=>u.team==='A').map(u=>({id:u.id,role:u.role,sector:u.sector,life:u.vital.life,move:u.movement?`${u.movement.from}→${u.movement.to}`:null,action:u.action?.kind,visible:r.observeFor(u.id).visible,devices:r.observeFor(u.id).devices})),events:r.events.filter(e=>e.at===at&&['cast_start','cast_complete','move_start','destroy_start','destroyed','eliminated','arrived','round_end'].includes(e.kind))});}
r.run();
mkdirSync('validation/balance',{recursive:true});writeFileSync(`validation/balance/trace-${process.env.NEXUS_TRACE_TAG??'before'}.json`,JSON.stringify({result:r.result?.reason,records},null,2)+'\n');console.log(JSON.stringify(r.events.filter(e=>['move_start','eliminated','arrived','round_end'].includes(e.kind))));
