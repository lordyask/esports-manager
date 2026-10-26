import raw from '../data/catalog.json' with {type:'json'};
import {AGENTS} from '../src/abilities.ts';
import type {Agent} from '../src/abilities.ts';
import type {Attributes} from '../src/rules.ts';
import {integer,finite} from '../src/rules.ts';
export interface Growth {attrs:Attributes;attributeXP:number[];familiarities:Record<string,number>;agentXP:Record<string,number>;}
export interface TrainingChoice {kind:'attribute'|'agent';attribute?:number;agents?:Record<string,Agent>;}
export interface TrainingGain {id:string;before:number;after:number;xpBefore:number;xpAfter:number;gainedXP:number;target:string;blocked:boolean;}
export interface Development {players:Record<string,Growth>;used:boolean;matchId:string|null;completed:number;receipt?:{choice:TrainingChoice;gains:TrainingGain[]};}
export const newDevelopment=():Development=>({players:{},used:false,matchId:null,completed:0});
export const baseFamiliarity=(id:string,a:string)=>{const p=raw.players.find(p=>p.id===id);if(!p)throw new Error('Jogador inválido.');return a===p.main?85:a===p.second?65:a===p.third?45:10;};
export const xpPerSession=(potential:number)=>100+2*(Math.min(95,Math.max(70,finite(potential,0,100,'potential')))-70);
export const attributeCost=(n:number)=>n<60?200:n<70?300:n<80?400:n<90?600:800;
export const agentCost=(n:number)=>n<50?50:n<70?75:n<85?100:n<95?150:200;
export function growthFor(dev:Development|undefined,id:string):Growth{
 const p=raw.players.find(p=>p.id===id);if(!p)throw new Error('Jogador inválido.');
 return structuredClone(dev?.players[id]??{attrs:p.attrs as Attributes,attributeXP:Array(8).fill(0),familiarities:Object.fromEntries(AGENTS.map(a=>[a,baseFamiliarity(id,a)])),agentXP:Object.fromEntries(AGENTS.map(a=>[a,0]))});
}
export function validateDevelopment(d:Development){
 if(!d||typeof d.used!=='boolean'||d.matchId!==null&&typeof d.matchId!=='string'||!d.players||typeof d.players!=='object')throw new Error('Desenvolvimento salvo inválido.');
 integer(d.completed,0,1000000,'completed matches');
 for(const [id,g] of Object.entries(d.players)){
  const p=raw.players.find(p=>p.id===id);if(!p||g.attrs.length!==8||g.attributeXP.length!==8)throw new Error('Desenvolvimento de jogador inválido.');
  for(let i=0;i<8;i++){integer(g.attrs[i],p.attrs[i],100,'trained attribute');integer(g.attributeXP[i],0,10000000,'attribute XP');}
  if(g.attrs.reduce((a,b)=>a+b,0)>p.potential*8)throw new Error('Potencial geral ultrapassado.');
  for(const a of AGENTS){integer(g.familiarities[a],baseFamiliarity(id,a),100,'familiarity');integer(g.agentXP[a],0,10000000,'agent XP');}
 }
 if(d.matchId!==null&&!d.used)throw new Error('Preparação da partida não foi confirmada.');
 if(d.receipt){
  const {choice,gains}=d.receipt;
  if(!d.used||!choice||!['attribute','agent'].includes(choice.kind)||!Array.isArray(gains)||gains.length!==5||new Set(gains.map(g=>g.id)).size!==5)throw new Error('Comprovante de treino inválido.');
  if(choice.kind==='attribute')integer(choice.attribute!,0,7,'trained attribute index');
  for(const g of gains){
   if(!raw.players.some(p=>p.id===g.id)||typeof g.blocked!=='boolean'||(choice.kind==='attribute'?g.target!==String(choice.attribute):!AGENTS.includes(choice.agents?.[g.id] as Agent)||g.target!==choice.agents?.[g.id]))throw new Error('Foco registrado inválido.');
   integer(g.before,0,100,'training before');integer(g.after,g.before,100,'training after');
   integer(g.xpBefore,0,10000000,'training XP before');integer(g.xpAfter,0,10000000,'training XP after');integer(g.gainedXP,0,150,'training earned XP');
  }
 }
}
export function previewTraining(dev:Development,ids:string[],choice:TrainingChoice){
 validateDevelopment(dev);
 if(dev.used||dev.matchId)throw new Error('A oportunidade desta partida já foi utilizada.');
 if(ids.length!==5||new Set(ids).size!==5)throw new Error('Selecione os cinco titulares antes do treino.');
 if(!choice||!['attribute','agent'].includes(choice.kind))throw new Error('Escolha o foco do treino.');
 if(choice.kind==='attribute')integer(choice.attribute!,0,7,'attribute index');
 const next=structuredClone(dev),gains:TrainingGain[]=[];
 for(const id of ids){
  const p=raw.players.find(p=>p.id===id);if(!p)throw new Error('Jogador inválido.');const g=growthFor(dev,id),earned=xpPerSession(p.potential);
  if(choice.kind==='attribute'){
   const i=choice.attribute!,before=g.attrs[i],xpBefore=g.attributeXP[i],blocked=before>=100||g.attrs.reduce((a,b)=>a+b,0)+1>p.potential*8;
   if(!blocked){g.attributeXP[i]+=earned;while(g.attrs[i]<100&&g.attributeXP[i]>=attributeCost(g.attrs[i])&&g.attrs.reduce((a,b)=>a+b,0)+1<=p.potential*8){g.attributeXP[i]-=attributeCost(g.attrs[i]);g.attrs[i]++;}}
   gains.push({id,before,after:g.attrs[i],xpBefore,xpAfter:g.attributeXP[i],gainedXP:blocked?0:earned,target:String(i),blocked});
  }else{
   const agent=choice.agents?.[id];if(!agent||!AGENTS.includes(agent))throw new Error('Defina um agente de treino para cada titular.');
   const before=g.familiarities[agent],xpBefore=g.agentXP[agent],blocked=before===100;
   if(!blocked){g.agentXP[agent]+=earned;while(g.familiarities[agent]<100&&g.agentXP[agent]>=agentCost(g.familiarities[agent])){g.agentXP[agent]-=agentCost(g.familiarities[agent]);g.familiarities[agent]++;}}
   gains.push({id,before,after:g.familiarities[agent],xpBefore,xpAfter:g.agentXP[agent],gainedXP:blocked?0:earned,target:agent,blocked});
  }
  next.players[id]=g;
 }
 if(gains.every(g=>g.blocked))throw new Error('Todos atingiram o limite nesse foco. Escolha outro treino.');
 next.used=true;next.receipt={choice:structuredClone(choice),gains};return {development:next,gains};
}
