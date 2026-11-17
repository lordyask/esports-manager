import catalog from '../data/catalog.json' with {type:'json'};
export const PRIZES=[8000,5000,3000,2000,1000,1000,0,0] as const;
export interface ClubContract {playerId:string;monthlySalary:number;startDay:1;endDayExclusive:366;}
export interface LedgerEntry {id:string;day:number;kind:'initial'|'entry'|'salary'|'operation'|'prize';cents:number;}
export interface ClubFinance {closedThrough:number;contracts:ClubContract[];ledger:LedgerEntry[];}
export function payroll(roster:string[]){return roster.reduce((n,id)=>{const p=catalog.players.find(p=>p.id===id);if(!p)throw new Error('Atleta contratual desconhecido.');return n+p.salary;},0);}
export function salaryAccrued(roster:string[],days:number){return Math.round(payroll(roster)*100*days/30);}
/** Reconstruct the unique ledger from elapsed days, never increment an already-settled balance. */
export function clubFinance(roster:string[],closedThrough:number,place?:number):ClubFinance {
 if(!Number.isInteger(closedThrough)||closedThrough<0||closedThrough>28||place!==undefined&&(!Number.isInteger(place)||place<1||place>8||closedThrough!==28))throw new Error('Fechamento financeiro inválido.');
 const ledger:LedgerEntry[]=[{id:'initial',day:1,kind:'initial',cents:3000000},{id:'entry',day:1,kind:'entry',cents:-100000}];
 for(const day of [7,14,21,28])if(day<=closedThrough){ledger.push({id:`salary:${day}`,day,kind:'salary',cents:-(salaryAccrued(roster,day)-salaryAccrued(roster,day-7))},{id:`operation:${day}`,day,kind:'operation',cents:-70000});}
 if(place!==undefined)ledger.push({id:'prize',day:28,kind:'prize',cents:PRIZES[place-1]*100});
 return {closedThrough,contracts:roster.map(playerId=>({playerId,monthlySalary:catalog.players.find(p=>p.id===playerId)!.salary,startDay:1,endDayExclusive:366})),ledger};
}
export const cashCents=(finance:ClubFinance)=>finance.ledger.reduce((n,e)=>n+e.cents,0);
