import {AGENTS,ABILITIES} from './abilities.ts';
import {MAP_CATALOG} from './maps.ts';
import {ENGINE_VERSION,RULES_VERSION,SKILL_COSTS} from './rules.ts';
import {DOCA_V2_REVISION,DOCA_V2_AREAS,DOCA_V2_MOVEMENT,DOCA_V2_SIGHT,DOCA_V2_FIRE} from './doca-v2.ts';
import {sha256} from './hash.ts';
export const MECHANICS={engine:ENGINE_VERSION,rules:RULES_VERSION,contentHash:sha256(JSON.stringify({AGENTS,ABILITIES,MAP_CATALOG,SKILL_COSTS,mapRevision:DOCA_V2_REVISION,spatial:[DOCA_V2_AREAS,DOCA_V2_MOVEMENT,DOCA_V2_SIGHT,DOCA_V2_FIRE],resolver:'doca-v2-r2',ai:'doca-v2-tactical-r2',clubs:'independent-repertoire-r2',seeds:'domain-separated-r1'}))};
export const mechanicsMatch=(value:unknown)=>JSON.stringify(value)===JSON.stringify(MECHANICS);
