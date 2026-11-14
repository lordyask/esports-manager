import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createSession,defaultDraft,suggestAssignments,salary} from '../lib/game.ts';
import {simulateMap} from '../src/autonomous.ts';
import {ATTACKS,DEFENSES} from '../src/strategies.ts';
import type {AttackPlan,DefensePlan,TeamPlan} from '../src/tactical-types.ts';
const rosters=[['J02','J24','J22','J05','J03'],['J12','J09','J02','J05','J24']];
const rows:any[]=[],eventCounts:Record<string,number>={},abilities:Record<string,number>={};
for(const map of ['doca','cume'] as const)for(const opponent of ['development','balanced','experienced'] as const)for(const [roster,selected] of rosters.entries())for(const attack of Object.keys(ATTACKS) as AttackPlan[])for(const defense of Object.keys(DEFENSES) as DefensePlan[])for(const initialAttack of ['A','B'] as const){
 const seed=111000+Object.keys(ATTACKS).indexOf(attack)*101+Object.keys(DEFENSES).indexOf(defense)*17;
 const site=(Object.keys(ATTACKS).indexOf(attack)+Object.keys(DEFENSES).indexOf(defense))%2?'B':'A';
 const plan:TeamPlan={attack,defense,site},draft=suggestAssignments({...defaultDraft(),map,opponent,selected,seed,plan});assert.ok(salary(draft)<=12000);
 const s=createSession(draft,`${map}-${rows.length}`),g=simulateMap(s.profiles,{map,seed,initialAttack,plans:{A:plan,B:plan},overtimePairLimit:3,maxRounds:30});
 assert.equal(g.state.phase,'finished');assert.equal(g.state.score.A+g.state.score.B,g.rounds.length);
 let attackWins=0;for(const [i,r] of g.rounds.entries()){
  const side=i<12?initialAttack:i<24?(initialAttack==='A'?'B':'A'):(i-24)%2===0?initialAttack:initialAttack==='A'?'B':'A';if(r.winner===side)attackWins++;
  assert.ok(Number.isFinite(r.at)&&r.at>=0&&r.at<=140001);assert.equal(r.actors.length,10);
  for(const a of r.actors){assert.ok(['attack','defense','A','mid','B'].includes(a.sector));assert.ok(a.vital.life>=0&&a.vital.life<=10000);}
  for(const e of r.events)eventCounts[e.kind]=(eventCounts[e.kind]??0)+1;
  for(const [name,n] of Object.entries(r.abilityUses))abilities[name]=(abilities[name]??0)+n;
 }
 rows.push({map,opponent,roster,selected,salary:salary(draft),seed,initialAttack,plan,score:g.state.score,winner:g.state.winner,rounds:g.rounds.length,attackWins,plants:g.summary.plants,defuses:g.summary.defuses});
}
const summarize=(rs:typeof rows)=>({matches:rs.length,rounds:rs.reduce((n,r)=>n+r.rounds,0),wins:rs.filter(r=>r.winner==='A').length,draws:rs.filter(r=>r.winner===null).length,attackWinRate:rs.reduce((n,r)=>n+r.attackWins,0)/rs.reduce((n,r)=>n+r.rounds,0),plants:rs.reduce((n,r)=>n+r.plants,0),defuses:rs.reduce((n,r)=>n+r.defuses,0)});
const output={scope:'Integration sample, not global balance certification. Real catalog rosters under salary cap; no training; same plan on both teams. Paired starts and deterministic seeds; target alternates across plan cells. No win-rate target.',summary:summarize(rows),byMap:Object.fromEntries(['doca','cume'].map(map=>[map,summarize(rows.filter(r=>r.map===map))])),byDifficulty:Object.fromEntries(['development','balanced','experienced'].map(op=>[op,summarize(rows.filter(r=>r.opponent===op))])),byRoster:Object.fromEntries(rosters.map((selected,i)=>[i,{selected,...summarize(rows.filter(r=>r.roster===i))}])),eventCounts,abilities,matches:rows};
assert.equal(rows.length,384);mkdirSync('validation/maps',{recursive:true});writeFileSync('validation/maps/results.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({...output,matches:undefined}));
