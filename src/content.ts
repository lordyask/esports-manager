import {AGENTS,ABILITIES} from './abilities.ts';
import {MAP_CATALOG} from './maps.ts';
import {ENGINE_VERSION,RULES_VERSION,SKILL_COSTS,WEAPONS,CADENCE_PRECISION,RANGE_SCORE,MONEY_CAP,ROUND_MS,PREPARATION_MS,PLANT_MS,DEFUSE_MS,DETONATION_MS} from './rules.ts';
import {DOCA_V2_REVISION,DOCA_V2_AREAS,DOCA_V2_MOVEMENT,DOCA_V2_SIGHT,DOCA_V2_FIRE} from './doca-v2.ts';
import type {TacticalPolicy} from './tactical-types.ts';
import {sha256} from './hash.ts';
const content={AGENTS,ABILITIES,MAP_CATALOG,SKILL_COSTS,combat:[WEAPONS,CADENCE_PRECISION,RANGE_SCORE],economy:{MONEY_CAP},timers:[ROUND_MS,PREPARATION_MS,PLANT_MS,DEFUSE_MS,DETONATION_MS],mapRevision:DOCA_V2_REVISION,spatial:[DOCA_V2_AREAS,DOCA_V2_MOVEMENT,DOCA_V2_SIGHT,DOCA_V2_FIRE],resolver:'doca-v2-r2',ai:'doca-v2-tactical-r4',clubs:'independent-repertoire-r2',seeds:'domain-separated-r1',receipts:'round-equipment-r1',sideRotation:'regulation-6-rounds-overtime-pairs-r1'};
const mechanicsFor=(ai:TacticalPolicy)=>({engine:ENGINE_VERSION,rules:RULES_VERSION,contentHash:sha256(JSON.stringify({...content,ai}))});
export const PREVIOUS_MECHANICS=mechanicsFor('doca-v2-tactical-r4');
export const MECHANICS=mechanicsFor('doca-v2-tactical-r5');
const previous=JSON.stringify(PREVIOUS_MECHANICS),current=JSON.stringify(MECHANICS);
export const mechanicsMatch=(value:unknown)=>{const encoded=JSON.stringify(value);return encoded===current||encoded===previous;};
export function tacticalPolicyFor(value:unknown):TacticalPolicy {
 const encoded=JSON.stringify(value);if(encoded===current)return 'doca-v2-tactical-r5';if(encoded===previous)return 'doca-v2-tactical-r4';
 throw new Error('Revisão mecânica da partida incompatível.');
}
