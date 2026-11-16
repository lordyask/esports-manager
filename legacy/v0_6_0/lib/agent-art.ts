import raw from '../data/agent-art.json' with {type:'json'};
import type {Agent} from '../src/abilities.ts';
export interface ArtAsset {src:string;width:number;height:number;}
export interface AgentArt {classLabel:string;card:ArtAsset;keyart:ArtAsset;preview:ArtAsset;}
/** Presentation-only catalog. It never participates in mechanics, saved profiles or agent IDs. */
export const AGENT_ART:Record<Agent,AgentArt>=raw;
export const artUrl=(asset:ArtAsset)=>`${process.env.NEXT_PUBLIC_BASE_PATH??''}${asset.src}`;
