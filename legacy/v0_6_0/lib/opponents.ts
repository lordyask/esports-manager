import raw from '../data/opponents.json' with {type:'json'};
import type {Profile} from '../src/tactical-types.ts';
import type {Agent} from '../src/abilities.ts';
import type {Attributes} from '../src/rules.ts';

/** Author override: NPC attributes and familiarities never train or scale in this beta. */
for(const team of raw.teams){for(const player of team.players){Object.freeze(player.attrs);Object.freeze(player);}Object.freeze(team.players);Object.freeze(team);}Object.freeze(raw.teams);
export const OPPONENTS:typeof raw.teams=raw.teams;
export function opponentFor(id:string){const t=OPPONENTS.find(t=>t.id===id);if(!t)throw new Error('Adversário de calendário inválido.');return structuredClone(t);}
export function opponentProfiles(id:string):Profile[]{
 return opponentFor(id).players.map(p=>({id:`B:${p.id}`,team:'B',agent:p.main as Agent,role:p.role as Profile['role'],igl:p.igl,attrs:[...p.attrs] as Attributes,agentFamiliarity:85,mapFamiliarity:50,morale:70,fatigue:10,weapon:p.role==='Main OP'?'precision':'basic',shield:0,charges:[false,false,false],ult:0}));
}
