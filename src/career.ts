import {clamp,finite,integer} from './rules.ts';
import type {Attributes} from './rules.ts';
export const overall=(attrs: Attributes)=>attrs.reduce((a,b)=>a+b,0)/8;
export function trainAttribute(attrs: Attributes,index: number,potential: number) {
  integer(index,0,7,'attribute index');attrs.forEach(x=>finite(x,1,100,'attribute'));finite(potential,overall(attrs),100,'potential');
  const next=[...attrs] as Attributes;
  const gain=Math.min(.1,100-next[index],Math.max(0,(potential-overall(attrs))*8));
  if(gain<.00001)throw new Error('Training has no effect');
  next[index]=Math.round((next[index]+gain)*100)/100;
  return next;
}
export function renewedSalary(reference: number, referenceOverall: number, currentOverall: number) {
  integer(reference,1,100000000,'salary');finite(referenceOverall,1,100,'reference overall');finite(currentOverall,1,100,'overall');
  return Math.round(reference*(1+.03*Math.max(0,currentOverall-referenceOverall))/50)*50;
}
export function moraleAfterMap(morale: number, emotional: number, won: boolean) {
  finite(morale,0,100,'morale');finite(emotional,0,100,'emotional');
  return Math.round(clamp(morale+(won?4:-(4-.02*emotional)),0,100)*100)/100;
}
export interface Contract {id: string; monthlySalary: number; accruedCents: number;}
export function accrueWeek(c: Contract): Contract {
  integer(c.monthlySalary,1,100000000,'salary');integer(c.accruedCents,0,1e12,'accrual');
  return {...c,accruedCents:c.accruedCents+c.monthlySalary*25};
}
export function dismiss(c: Contract,cashCents: number) {
  integer(c.monthlySalary,1,100000000,'salary');integer(c.accruedCents,0,1e12,'accrual');integer(cashCents,-1e12,1e12,'cash');
  const charge=c.accruedCents+c.monthlySalary*100;
  return {cashCents:cashCents-charge,chargeCents:charge,debtCents:Math.max(0,charge-cashCents)};
}
