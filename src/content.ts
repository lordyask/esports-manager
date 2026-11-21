import {CURRENT_TACTICAL_POLICY} from './tactical-types.ts';
import {AGENTS,ABILITIES} from './abilities.ts';
import {MAP_CATALOG} from './maps.ts';
import {ENGINE_VERSION,RULES_VERSION,SKILL_COSTS,WEAPONS,CADENCE_PRECISION,RANGE_SCORE,MONEY_CAP,ROUND_MS,PREPARATION_MS,PLANT_MS,DEFUSE_MS,DETONATION_MS} from './rules.ts';
import {DOCA_V2_REVISION,DOCA_V2_AREAS,DOCA_V2_MOVEMENT,DOCA_V2_SIGHT,DOCA_V2_FIRE} from './doca-v2.ts';
import type {MovementPolicy,TacticalPolicy} from './tactical-types.ts';
import {sha256} from './hash.ts';
const content={AGENTS,ABILITIES,MAP_CATALOG,SKILL_COSTS,combat:[WEAPONS,CADENCE_PRECISION,RANGE_SCORE],economy:{MONEY_CAP},timers:[ROUND_MS,PREPARATION_MS,PLANT_MS,DEFUSE_MS,DETONATION_MS],mapRevision:DOCA_V2_REVISION,spatial:[DOCA_V2_AREAS,DOCA_V2_MOVEMENT,DOCA_V2_SIGHT,DOCA_V2_FIRE],resolver:'doca-v2-r2',ai:'doca-v2-tactical-r4',clubs:'independent-repertoire-r2',seeds:'domain-separated-r1',receipts:'round-equipment-r1',sideRotation:'regulation-6-rounds-overtime-pairs-r1'};
const mechanicsFor=(ai:TacticalPolicy,resolver='doca-v2-r2')=>({engine:ENGINE_VERSION,rules:RULES_VERSION,contentHash:sha256(JSON.stringify({...content,resolver,ai}))});
export const PREVIOUS_MECHANICS=mechanicsFor('doca-v2-tactical-r4');
export const PREVIOUS_MOVEMENT_MECHANICS=mechanicsFor('doca-v2-tactical-r5');
export const BETA_2_1_MECHANICS=mechanicsFor('doca-v2-tactical-r5','doca-v2-r3');
export const MECHANICS=mechanicsFor(CURRENT_TACTICAL_POLICY,'doca-v2-r3');

const revisions=new Map<string,{tactical:TacticalPolicy;movement:MovementPolicy}>([
 [JSON.stringify(PREVIOUS_MECHANICS),{tactical:'doca-v2-tactical-r4',movement:'legacy-r1'}],
 [JSON.stringify(PREVIOUS_MOVEMENT_MECHANICS),{tactical:'doca-v2-tactical-r5',movement:'legacy-r1'}],
 [JSON.stringify(BETA_2_1_MECHANICS),{tactical:'doca-v2-tactical-r5',movement:'require-ready-r2'}],
 [JSON.stringify(MECHANICS),{tactical:CURRENT_TACTICAL_POLICY,movement:'require-ready-r2'}],
]);
export const mechanicsMatch=(value:unknown)=>revisions.has(JSON.stringify(value));
function policiesFor(value:unknown){
 const policies=revisions.get(JSON.stringify(value));
 if(!policies)throw new Error('Revisão mecânica da partida incompatível.');
 return policies;
}
export const tacticalPolicyFor=(value:unknown):TacticalPolicy=>policiesFor(value).tactical;
export const movementPolicyFor=(value:unknown):MovementPolicy=>policiesFor(value).movement;
