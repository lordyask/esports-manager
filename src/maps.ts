import type {MapId,Range,Sector} from './rules.ts';
import {DOCA_V2_AREAS} from './doca-v2.ts';

export const MAP_IDS = ['patio','horizonte','enlace','doca','cume','doca-v2'] as const;
export const isMapId = (id:unknown):id is MapId => typeof id==='string' && (MAP_IDS as readonly string[]).includes(id);
export const ACTIVE_MAP_IDS=['doca-v2'] as const;
export const isActiveMapId=(id:unknown):id is 'doca-v2'=>id==='doca-v2';
const generic = {attack:'Base atacante',defense:'Base defensora',A:'Ponto A',mid:'Meio',B:'Ponto B'};
interface MapDefinition {
 name:string; travel?:readonly [number,number,number,number,number]; range:Range;
 sectors:Partial<Record<Sector,string>>; image?:string;
}
/** Travel costs in seconds: attack-site, attack-mid, mid-site, defense-site, defense-mid.
 * Art and marker layout never participate in simulation geometry. */
export const MAP_CATALOG:Record<MapId,MapDefinition> = {
 patio:{name:'Pátio',travel:[12,8,6,7,9],range:'short',sectors:generic},
 horizonte:{name:'Horizonte',travel:[18,12,10,10,12],range:'long',sectors:generic},
 enlace:{name:'Enlace',travel:[16,8,6,9,8],range:'medium',sectors:generic},
 doca:{name:'Doca',travel:[12,8,6,7,9],range:'short',image:'/maps/doca.png',sectors:{attack:'Base Sul',defense:'Base Norte',A:'Armazém',mid:'Pátio de Carga',B:'Atracadouro'}},
 cume:{name:'Cume',travel:[16,8,6,9,8],range:'medium',image:'/maps/cume.png',sectors:{attack:'Base Sul',defense:'Base Norte',A:'Observatório',mid:'Passagem Central',B:'Estabilizador'}},
 'doca-v2':{name:'Doca V2',range:'medium',sectors:Object.fromEntries(Object.entries(DOCA_V2_AREAS).map(([id,a])=>[id,a.name]))},
};
