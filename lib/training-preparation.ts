import raw from '../data/catalog.json' with {type:'json'};
import {AGENTS} from '../src/abilities.ts';
import type {Agent} from '../src/abilities.ts';
import type {Draft} from './game.ts';
import type {TrainingChoice} from './development.ts';

/** A saved decision, not a consumed session. Keep both modes when switching focus. */
export interface TrainingPreparation {kind:'attribute'|'agent';attribute:number;agents:Record<string,Agent>;}
export function trainingPreparation(draft:Draft,stored?:TrainingPreparation,recorded?:TrainingChoice):TrainingPreparation {
 return {kind:stored?.kind??recorded?.kind??'attribute',attribute:stored?.attribute??recorded?.attribute??0,
  agents:Object.fromEntries(draft.selected.map(id=>{
   const p=raw.players.find(p=>p.id===id);if(!p)throw new Error('Jogador de treino inválido.');
   return [id,stored?.agents[id]??recorded?.agents?.[id]??draft.assignments[id]?.agent??p.main];
  })) as Record<string,Agent>};
}
export function trainingChoice(draft:Draft,preparation:TrainingPreparation):TrainingChoice {
 const p=trainingPreparation(draft,preparation);
 return p.kind==='attribute'?{kind:p.kind,attribute:p.attribute}:{kind:p.kind,agents:p.agents};
}
export function validateTrainingPreparation(p:TrainingPreparation,ids:string[]) {
 if(!p||!['attribute','agent'].includes(p.kind)||!Number.isInteger(p.attribute)||p.attribute<0||p.attribute>7||!p.agents||typeof p.agents!=='object'||Array.isArray(p.agents)||Object.entries(p.agents).some(([id,a])=>!ids.includes(id)||!AGENTS.includes(a)))throw new Error('Escolhas de treino salvas inválidas.');
}
