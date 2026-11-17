import {sha256} from '../src/hash.ts';
import type {TeamPlan,AttackPlan,DefensePlan} from '../src/tactical-types.ts';
const repertoire:Record<string,{attack:AttackPlan[];defense:DefensePlan[]}>= {
 pzr:{attack:['fast','split'],defense:['aggressive','balanced']},
 frv:{attack:['control','split'],defense:['balanced','reading']},
 mra:{attack:['split','control'],defense:['retake','balanced']},
 vrt:{attack:['feint','control'],defense:['reading','balanced']},
 fsk:{attack:['fast','split'],defense:['aggressive','retake']},
 blt:{attack:['control','feint'],defense:['balanced','retake']},
 crn:{attack:['control','split','feint'],defense:['reading','retake']},
};
/** Uses only club identity, public match seed and round index; never reads the user's plan. */
export function clubPlan(id:string,seed:number,round:number):TeamPlan {
 const r=repertoire[id];if(!r)throw new Error('Política de clube desconhecida.');
 const draw=(domain:string)=>parseInt(sha256(`${id}:${seed}:${round}:${domain}`).slice(0,8),16);
 return {attack:r.attack[draw('attack')%r.attack.length],defense:r.defense[draw('defense')%r.defense.length],site:draw('site')%2?'A':'B'};
}
