import {WEAPONS} from '../src/rules.ts';
import type {Team} from '../src/rules.ts';
import type {Profile} from '../src/tactical-types.ts';

/** Equipment actually entering combat, after retained items, partial purchases and gifts. */
export type RoundEquipment=Pick<Profile,'id'|'agent'|'attrs'|'weapon'|'shield'|'charges'|'ult'>;
export type EquipmentByTeam=Record<Team,RoundEquipment[]>;
export function snapshotEquipment(profiles:Profile[]):EquipmentByTeam {
 const snapshot=(team:Team)=>profiles.filter(p=>p.team===team).map(({id,agent,attrs,weapon,shield,charges,ult})=>({id,agent,attrs:[...attrs] as Profile['attrs'],weapon,shield,charges:[...charges] as Profile['charges'],ult}));
 return {A:snapshot('A'),B:snapshot('B')};
}
export function validateEquipment(value:EquipmentByTeam,profiles:Profile[]){
 for(const team of ['A','B'] as const){
  const rows=value?.[team],expected=profiles.filter(p=>p.team===team);
  if(!Array.isArray(rows)||rows.length!==5||new Set(rows.map(r=>r?.id)).size!==5)throw new Error('Equipamento inicial ausente ou duplicado.');
  for(const row of rows){const p=expected.find(x=>x.id===row?.id);
   if(!p||row.agent!==p.agent||JSON.stringify(row.attrs)!==JSON.stringify(p.attrs)||!Object.hasOwn(WEAPONS,row.weapon)||!Number.isFinite(row.shield)||row.shield<0||row.shield>50||!Array.isArray(row.charges)||row.charges.length!==3||row.charges.some(c=>typeof c!=='boolean')||!Number.isSafeInteger(row.ult)||row.ult<0||row.ult>8)throw new Error('Equipamento inicial inválido.');
  }
 }
}
