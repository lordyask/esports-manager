import type {Career} from './career-state.ts';
import {cashCents,clubFinance} from './club-finance.ts';

export const analysts={
 lia:{name:'Lia Costa',nationality:'Brasileira',age:26,circuits:3,field:'Objetivos',reference:2000},
 caio:{name:'Caio Mendes',nationality:'Argentino',age:29,circuits:4,field:'Desempenho individual',reference:2500},
 rafael:{name:'Rafael Moura',nationality:'Uruguaio',age:34,circuits:7,field:'Estratégias',reference:3000},
 helena:{name:'Helena Duarte',nationality:'Chilena',age:36,circuits:9,field:'Análise integrada',reference:4000},
};
export type Analyst=keyof typeof analysts;
const minimum={lia:1700,caio:2400,rafael:2600,helena:4400};
export interface Staff {offers:Partial<Record<Analyst,number[]>>;hire?:{id:Analyst;amount:number;day:number}}
export function accepted(id:Analyst,amount:number|undefined){return amount!==undefined&&amount>=minimum[id];}
export function negotiate(c:Career,id:Analyst,offer:number|'confirm'){
 const x=c.circuit;
 if(!x||!c.fixtures[0]?.result||x.closed||x.staff?.hire||!Object.hasOwn(analysts,id))throw Error('Contratação indisponível.');
 const staff:Staff=structuredClone(x.staff??{offers:{}});
 const prior=staff.offers[id]??[],last=prior.at(-1);
 const amount=offer==='confirm'?last:offer;
 if(!amount||!Number.isSafeInteger(amount)||amount<=0||amount*100>cashCents(x.finance))throw Error('Informe um valor inteiro positivo dentro do caixa disponível.');
 if(offer==='confirm'){
  if(!accepted(id,last))throw Error('A proposta precisa ser aceita.');
  staff.hire={id,amount,day:c.day};
 }else{
  if(prior.length>=2||accepted(id,last))throw Error('Esta negociação não recebe novas ofertas.');
  staff.offers[id]=[...prior,amount];
 }
 return {...c,circuit:{...x,staff,finance:staff.hire?clubFinance(c.roster,x.finance.closedThrough,undefined,x.sponsor,staff.hire):x.finance}};
}
export function validateStaff(c:Career){
 const s=c.circuit?.staff;if(s===undefined)return;
 if(!s?.offers||typeof s.offers!=='object'||Array.isArray(s.offers)||!c.fixtures[0]?.result)throw Error('Registro de staff inválido.');
 for(const [id,offers] of Object.entries(s.offers)){
  if(!Object.hasOwn(analysts,id)||!Array.isArray(offers)||offers.length<1||offers.length>2||offers.some(n=>!Number.isSafeInteger(n)||n<=0)||offers.length===2&&accepted(id as Analyst,offers[0]))throw Error('Ofertas inconsistentes.');
 }
 const h=s.hire;
 if(h!==undefined&&(!h||!Object.hasOwn(analysts,h.id)||!accepted(h.id,h.amount)||s.offers[h.id]?.at(-1)!==h.amount||!Number.isInteger(h.day)||h.day<c.fixtures[0].day||h.day>c.day))throw Error('Contrato de staff inconsistente.');
}
