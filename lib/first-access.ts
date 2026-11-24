import {PLAYERS,SALARY_CAP,salary,suggestAssignments,validateDraft} from './game.ts';
import type {Draft,Onboarding,Workspace} from './game.ts';
import {startCircuitCareer} from './career.ts';

export const paths={
 balanced:{name:'Elenco equilibrado',ids:['J01','J10','J12','J05','J08'],captain:'J12'},
 economy:{name:'Elenco econômico',ids:['J01','J02','J04','J05','J24'],captain:'J04'},
 manual:{name:'Montar manualmente',ids:[],captain:''},
} satisfies Record<NonNullable<Onboarding['path']>,{name:string;ids:string[];captain:string}>;

export const credits=(n:number)=>n.toLocaleString('pt-BR')+' cr.';
export function rosterTotals(ids:string[]){
 const players=ids.map(id=>PLAYERS.find(p=>p.id===id)!);
 const payroll=players.reduce((sum,p)=>sum+p.salary,0);
 return {payroll,margin:SALARY_CAP-payroll,average:players.length?players.reduce((sum,p)=>sum+p.overall,0)/players.length:0};
}
export function withRoster(d:Draft,selected:string[],captain=d.igl):Draft{
 const igl=selected.includes(captain)?captain:selected.find(id=>PLAYERS.find(p=>p.id===id)?.style==='IGL')??selected[0]??'';
 return {...d,selected,igl,assignments:{}};
}
export function swapPlayer(d:Draft,from:string,to:string){
 if(!d.selected.includes(from)||d.selected.includes(to)||!PLAYERS.some(p=>p.id===to))throw new Error('Escolha outro candidato disponível.');
 const next=withRoster(d,d.selected.map(id=>id===from?to:id),d.igl===from?to:d.igl);
 if(salary(next)>SALARY_CAP)throw new Error('A troca excede o teto salarial.');
 return next;
}
export function registrationDraft(d:Draft){
 const next=suggestAssignments(d);
 next.igl=d.igl;
 validateDraft(next);
 return next;
}
export function registerCircuit(w:Workspace,id:string){
 if(w.onboarding?.stage!=='registration'||w.career||w.session)throw new Error('Inscrição indisponível.');
 const {onboarding,...base}=w;
 return startCircuitCareer({...base,draft:registrationDraft(w.draft)},id);
}
