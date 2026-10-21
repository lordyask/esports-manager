import {WEAPONS, SKILL_COSTS, MONEY_CAP, clamp, integer, finite} from './rules.ts';
import type {Weapon} from './rules.ts';
export type Plan = 'eco' | 'semi' | 'full';
export type BuyPlan = Plan | Record<string,Plan>;
export interface Account {id: string; credits: number; weapon: Weapon; shield: number; charges: [boolean,boolean,boolean]; ult: number;}
export interface Purchase {from: string; to: string; kind: string; cost: number;}
export function validateAccount(a: Account) {
  if (!a.id || !(a.weapon in WEAPONS) || a.charges.length!==3 || a.charges.some(c=>typeof c!=='boolean')) throw new Error('Invalid account');
  integer(a.credits,0,MONEY_CAP,'credits'); finite(a.shield,0,50,'shield'); integer(Math.round(a.shield*100),0,5000,'shield precision'); integer(a.ult,0,8,'ultimate');
}
export function quoteBuy(input: Account[], instruction: BuyPlan, options: {help?: boolean; precision?: string[]; ecoBudget?: number} = {}) {
  const planFor=(id:string):Plan=>typeof instruction==='string'?instruction:instruction[id];
  if(input.some(a=>!['eco','semi','full'].includes(planFor(a.id))))throw new Error('Invalid purchase plan');
  if (new Set(input.map(a=>a.id)).size!==input.length) throw new Error('Duplicate player');
  input.forEach(validateAccount);
  const accounts: Account[] = structuredClone(input), purchases: Purchase[]=[];
  const missing: string[]=[];
  const ecoBudget=integer(options.ecoBudget??1000,0,1000,'eco budget');
  const budget = new Map(accounts.map(a=>[a.id, Math.min(a.credits,planFor(a.id)==='eco'?ecoBudget:a.credits)]));
  const pay=(from: Account,to: Account,kind: string,cost: number,apply: ()=>void) => {
    if (cost>budget.get(from.id)!) return false;
    from.credits-=cost; budget.set(from.id,budget.get(from.id)!-cost); apply();
    if(cost) purchases.push({from:from.id,to:to.id,kind,cost}); return true;
  };
  const rank=(w: Weapon)=>w==='basic'?0:w==='intermediate'?1:2;
  const wantedFor=(id:string)=>planFor(id)==='full'?2:planFor(id)==='semi'?1:0;
  for(const a of accounts) {
    const plan=planFor(a.id),wanted=wantedFor(a.id);
    if(rank(a.weapon)<wanted) {
      const target: Weapon = plan==='full' ? options.precision?.includes(a.id)?'precision':'main':'intermediate';
      pay(a,a,target,WEAPONS[target].price,()=>a.weapon=target);
    }
    const targetShield=plan==='full'?50:25;
    const points=Math.round(Math.min(Math.max(0,targetShield-a.shield),budget.get(a.id)!/20)*100)/100;
    pay(a,a,'shield',Math.ceil(points*20-1e-8),()=>a.shield=Math.round((a.shield+points)*100)/100);
    const targetSkills=plan==='full'?3:2;
    for(let i=0;i<targetSkills;i++) if(!a.charges[i])pay(a,a,`skill:${i}`,SKILL_COSTS[i],()=>a.charges[i]=true);
  }
  // All own purchases are reserved before helping. Input order is manager priority.
  if(options.help) {
    const recipients=accounts.filter(a=>rank(a.weapon)<wantedFor(a.id)).sort((a,b)=>rank(a.weapon)-rank(b.weapon)||accounts.indexOf(a)-accounts.indexOf(b));
    for(const to of recipients) {
      const plan=planFor(to.id);
      const target: Weapon = plan==='full' ? options.precision?.includes(to.id)?'precision':'main':'intermediate';
      for(const from of accounts) if(from.id!==to.id && pay(from,to,`gift:${target}`,WEAPONS[target].price,()=>to.weapon=target))break;
    }
  }
  for(const a of accounts) {
    const plan=planFor(a.id),wanted=wantedFor(a.id);
    const shield=plan==='full'?50:25;
    if(rank(a.weapon)<wanted || a.shield<shield || a.charges.slice(0,plan==='full'?3:2).some(c=>!c))missing.push(a.id);
    validateAccount(a);
  }
  return {accounts,purchases,missing,total: purchases.reduce((s,p)=>s+p.cost,0)};
}
export function settleRound(a: Account, won: boolean, lossStreak: number, survived: boolean, killed: boolean): Account {
  validateAccount(a);integer(lossStreak,0,1000000,'loss streak');
  if(!won && lossStreak<1)throw new Error('Loss streak includes current loss');
  const out=structuredClone(a);
  out.credits=Math.min(MONEY_CAP,a.credits+(won?4000:Math.min(3000,1500+500*lossStreak)));
  if(!survived){out.weapon='basic';out.shield=0;}
  out.ult=clamp(out.ult+1+(killed?1:0),0,8);
  return out;
}
export function halfReset(a: Account): Account {validateAccount(a);return {...a,credits:1000,weapon:'basic',shield:0,charges:[false,false,false]};}
export function overtimeKit(a: Account, precision=false): Account {validateAccount(a);return {...a,weapon:precision?'precision':'main',shield:50,charges:[true,true,true]};}
