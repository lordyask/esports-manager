// Shared deterministic engine. Browser-local Beta is untrusted; production must keep authoritative state on the server.
export {simulateMap,economicPlan} from './autonomous.ts';
export {simulateRound} from './simulation.ts';
export {createMap,beginRound,completeRound,attackingTeam} from './map.ts';
export {ENGINE_VERSION,RULES_VERSION} from './rules.ts';
export {AGENTS,ABILITIES} from './abilities.ts';
export type {Profile,TeamPlan,SimulationOptions,SimulationResult} from './tactical-types.ts';
export type {AutonomousOptions} from './autonomous.ts';
