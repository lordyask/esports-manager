'use client';
import {AgentIdentity} from './agent-art';
import {AGENTS,ROLES,ROLE_NAMES} from '../lib/game';
import type {Draft,Player,Role} from '../lib/game';
import type {Agent} from '../src/abilities';
import {growthFor} from '../lib/development';
import type {Development} from '../lib/development';
export function AssignmentCards({players,draft,development,disabled,onChange}:{players:Player[];draft:Draft;development?:Development;disabled:boolean;onChange:(p:Partial<Draft>)=>void}){
 return <div className="assignment-list">{players.map(p=>{const a=draft.assignments[p.id]??{agent:p.main as Agent,role:p.style as Role},familiarities=growthFor(development,p.id).familiarities;return <div className="assignment-card" key={p.id}><div className="assignment-name"><span className="avatar">{p.name.slice(0,2).toUpperCase()}</span><div><h3>{p.name}</h3><small>Geral {p.overall.toFixed(1)} · Mental {p.attrs[7]}</small></div></div><label className="field"><span>Agente</span><AgentIdentity agent={a.agent}/><select aria-label={`Agente de ${p.name}`} value={a.agent} disabled={disabled} onChange={e=>onChange({assignments:{...draft.assignments,[p.id]:{...a,agent:e.target.value as Agent}}})}>{AGENTS.map(x=><option key={x} value={x}>{x} · {familiarities[x]}</option>)}</select></label><label className="field"><span>Responsabilidade inicial</span><select aria-label={`Responsabilidade de ${p.name}`} value={a.role} disabled={disabled} onChange={e=>onChange({assignments:{...draft.assignments,[p.id]:{...a,role:e.target.value as Role}}})}>{ROLES.map(x=><option key={x} value={x}>{ROLE_NAMES[x]}</option>)}</select></label><label className="igl"><input type="radio" name="igl" checked={draft.igl===p.id} disabled={disabled} onChange={()=>onChange({igl:p.id})}/><span>IGL<small>Aptidão {(p.attrs[3]*.35+p.attrs[5]*.30+p.attrs[6]*.20+p.attrs[7]*.15).toFixed(0)}</small></span></label></div>;})}</div>;
}
