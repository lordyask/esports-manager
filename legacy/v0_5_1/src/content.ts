import {AGENTS,ABILITIES} from './abilities.ts';
import {MAP_CATALOG} from './maps.ts';
import {ENGINE_VERSION,RULES_VERSION,SKILL_COSTS} from './rules.ts';
import {sha256} from './hash.ts';
export const MECHANICS={engine:ENGINE_VERSION,rules:RULES_VERSION,contentHash:sha256(JSON.stringify({AGENTS,ABILITIES,MAP_CATALOG,SKILL_COSTS,resolver:'rework-effects-r1',ai:'tactical-r3',clubs:'fixed-repertoire-r1'}))};
export const mechanicsMatch=(value:unknown)=>JSON.stringify(value)===JSON.stringify(MECHANICS);
