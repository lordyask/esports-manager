import {sha256} from './hash.ts';
import {integer} from './rules.ts';
const derive=(domain:string,parts:(string|number)[])=>parseInt(sha256(JSON.stringify(['nexus-doca-v2-seeds-1',domain,...parts])).slice(0,8),16)||1;
export function matchSeed(careerId:string,careerSeed:number,matchId:string){
 if(!careerId||!matchId)throw new Error('Identificação de partida ausente.');integer(careerSeed,1,0xffffffff,'career seed');
 return derive('match',[careerId,careerSeed,matchId]);
}
export function roundSeed(matchId:string,seed:number,round:number){
 if(!matchId)throw new Error('Identificação de partida ausente.');integer(seed,1,0xffffffff,'match seed');integer(round,0,2000,'round');
 return derive('round',[matchId,seed,round]);
}
