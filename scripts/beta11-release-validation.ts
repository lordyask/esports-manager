import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {simulateMap} from '../src/autonomous.ts';
import {profiles} from '../test/fixtures.ts';
import {ENGINE_VERSION, RULES_VERSION} from '../src/rules.ts';
import {ATTACKS,DEFENSES,validateStrategy} from '../src/strategies.ts';
import {defaultDraft,suggestAssignments,beginMatch,nextMatch,advanceSession,automaticBuys,decodeSave,encodeSave} from '../lib/game.ts';
import {newDevelopment,previewTraining,growthFor} from '../lib/development.ts';
import type {Workspace} from '../lib/game.ts';
import type {AttackPlan,DefensePlan,TeamPlan} from '../src/tactical-types.ts';
const coreSHA256=createHash('sha256').update(readdirSync('src').filter(p=>p.endsWith('.ts')).sort().map(p=>'src/'+p).map(p=>p+'\n'+readFileSync(p,'utf8')).join('\n')).digest('hex');
const rows:any[]=[],errors:any[]=[],levels=[[45,45],[60,60],[75,75],[45,75],[75,45]],start=performance.now();
const attackInstructions=['none','trade','utility','preserve'] as const,defenseInstructions=['none','trade','cautious','resources'] as const;
for(const map of ['patio','horizonte','enlace'] as const)for(const [a,b] of levels)for(let c=0;c<4;c++)for(const initialAttack of ['A','B'] as const){
 const attack=Object.keys(ATTACKS)[c] as AttackPlan,defense=Object.keys(DEFENSES)[c] as DefensePlan;
 const plan:TeamPlan={attack,defense,site:c%2?'B':'A',attackInstruction:attackInstructions[c],defenseInstruction:defenseInstructions[c]};
 // Replace an incompatible complement with another valid, explicit choice.
 if(attack==='fast'&&plan.attackInstruction==='preserve')plan.attackInstruction='trade';
 if(defense==='aggressive'&&plan.defenseInstruction==='resources')plan.defenseInstruction='cautious';validateStrategy(plan);
 const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Estalo','Farol','Bruma','Trava','Bastião'] as const)[i%5];p.role=(['Entry','Second','Support','Main OP','Anchor'] as const)[i%5];p.weapon=i%5===3?'precision':'main';p.attrs=Array(8).fill(p.team==='A'?a:b) as any;});
 const seed=26001000+c+(a*7+b)*31;
 try{const g=simulateMap(ps,{map,seed,initialAttack,plans:{A:plan,B:plan},maxRounds:500,overtimePairLimit:3});rows.push({map,levels:[a,b],plan,initialAttack,seed,rounds:g.rounds.length,winner:g.state.winner});}
 catch(error){errors.push({map,a,b,c,initialAttack,error:String(error)});}
}
// Every valid main-plan/complement combination gets a paired-side full match.
const combinations:any[]=[];
for(const attack of Object.keys(ATTACKS) as AttackPlan[])for(const defense of Object.keys(DEFENSES) as DefensePlan[])for(const attackInstruction of attackInstructions)for(const defenseInstruction of defenseInstructions){
 const plan={attack,defense,site:'A' as const,attackInstruction,defenseInstruction};try{validateStrategy(plan);}catch{continue;}
 // Rotate the map and seed across combinations; this is coverage, not a factorial map comparison.
 const map=(['patio','horizonte','enlace'] as const)[combinations.length%3],seed=26400000+combinations.length;
 for(const initialAttack of ['A','B'] as const){try{const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Estalo','Farol','Bruma','Trava','Bastião'] as const)[i%5];p.role=(['Entry','Second','Support','Main OP','Anchor'] as const)[i%5];});const g=simulateMap(ps,{map,seed,initialAttack,plans:{A:plan,B:plan},maxRounds:500,overtimePairLimit:3});combinations.push({map,seed,plan,initialAttack,rounds:g.rounds.length,winner:g.state.winner});}catch(error){errors.push({plan,initialAttack,error:String(error)});}}
}
const regressions:any[]=[];
for(const c of [{attack:'split',defense:'aggressive',composition:1,seed:20261102,initialAttack:'A',before:204},{attack:'split',defense:'balanced',composition:1,seed:20261222,initialAttack:'B',before:246}] as const){
 const ps=profiles();ps.forEach((p,i)=>{p.agent=(['Ímpeto','Pulso','Véu','Trava','Bastião'] as const)[i%5];p.role=(['Entry','Support','Lurker','Main OP','Anchor'] as const)[i%5];p.weapon=i%5===3?'precision':'main';});const plan={attack:c.attack,defense:c.defense,site:'A' as const};
 try{const g=simulateMap(ps,{map:'enlace',seed:c.seed,initialAttack:c.initialAttack,plans:{A:plan,B:plan},maxRounds:500,overtimePairLimit:3});regressions.push({...c,after:g.rounds.length});}catch(error){errors.push({regression:c,error:String(error)});}
}
const selected=['J01','J02','J05','J03','J24'],draft=suggestAssignments({...defaultDraft(),selected});
let w:Workspace={draft,session:null,development:newDevelopment()};const cycles:any[]=[];
for(let n=0;n<30;n++){
 try{if(n){w=nextMatch(w);w.draft.seed=2026102600+n;}
 const old=w.previous?JSON.stringify(w.previous):null;
 const focus=n%2?{kind:'agent' as const,agents:Object.fromEntries(selected.map(id=>[id,'Estalo' as const]))}:{kind:'attribute' as const,attribute:0};
 w.development=previewTraining(w.development!,selected,focus).development;w=decodeSave(encodeSave(w));
 assert.throws(()=>previewTraining(w.development!,selected,focus),/já foi/);
 if(old)assert.equal(JSON.stringify(w.previous),old);
 w=beginMatch(w,'cycle-'+n);while(w.session!.state.phase!=='finished'&&w.session!.records.length<500){const s=w.session!;w.session=advanceSession(s,{id:'r'+s.state.rounds,revision:s.state.rounds,plans:{A:w.draft.plan,B:{attack:'fast',defense:'balanced',site:'A'}},buys:automaticBuys(s)});}
 assert.equal(w.session!.state.phase,'finished');w=decodeSave(encodeSave(w));cycles.push({cycle:n+1,rounds:w.session!.state.rounds,score:w.session!.state.score});
 }catch(error){errors.push({cycle:n+1,error:String(error)});break;}
}
const summary={engine:ENGINE_VERSION,overtimePairLimit:3,rules:RULES_VERSION,coreSHA256,elapsedMs:Math.round(performance.now()-start),errors,levelMaps:rows.length,combinationMaps:combinations.length,trainingMatches:cycles.length,maxRounds:Math.max(...rows.map(r=>r.rounds),...combinations.map(r=>r.rounds),...cycles.map(r=>r.rounds)),levels:rows,combinations,regressions,cycles,progress:Object.fromEntries(selected.map(id=>[id,growthFor(w.development,id)]))};
mkdirSync('validation/beta11/rc1',{recursive:true});writeFileSync('validation/beta11/rc1/extended.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,levels:undefined,combinations:undefined,cycles:undefined,progress:undefined}));if(errors.length)process.exitCode=1;
