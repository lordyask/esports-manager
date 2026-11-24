import type {ReactNode} from 'react';
import {AGENTS,ATTRS,CLASS,ROLE_NAMES,familiarity} from '../lib/game';
import type {Player} from '../lib/game';
import {countryLabel} from '../lib/countries';
const fmt=(n:number)=>n.toLocaleString('pt-BR');
function CardBody({p,selected,children}:{p:Player;selected:boolean;children:ReactNode}){return <article className={`player-card ${selected?'selected':''}`}>
 <div className="player-top"><span className="avatar">{p.name.slice(0,2).toUpperCase()}</span><div><small>{CLASS[p.main]} · {p.profile}</small><h3>{p.name}</h3><span className="muted">{p.main} · {p.style} · {countryLabel(p.country)}</span></div><span className="rating">{p.overall.toFixed(1)}<small>OVR</small></span></div>
 <div className="player-numbers"><div><small>POTENCIAL</small><strong>{p.potential}<span>/100</span></strong></div><div><small>SALÁRIO MENSAL</small><strong>{fmt(p.salary)} <span>cr.</span></strong></div></div>
 <div className="meter"><span style={{width:`${p.overall}%`}}/><i style={{left:`${p.potential}%`}}/></div>
 <div className="card-tags"><span>{p.mental}</span><span>IGL {p.apt.IGL.toFixed(0)}</span></div>
 {children}</article>;}
export function PlayerSheet({p}:{p:Player}){
 return <><h3>Atributos</h3><div className="attribute-grid">{ATTRS.map((a,i)=><div key={a}><span>{a}</span><b>{p.attrs[i]}</b></div>)}</div>
 <h3>Aptidões nas funções</h3><div className="attribute-grid">{Object.entries(p.apt).map(([r,v])=><div key={r}><span>{r}</span><b>{v.toLocaleString('pt-BR',{maximumFractionDigits:1})}</b></div>)}</div>
 <h3>Afinidades iniciais</h3><div className="attribute-grid">{AGENTS.map(agent=><div key={agent}><span>{agent}</span><b>{familiarity(p,agent)}</b></div>)}</div></>;
}
export function RecruitCard({p,selected,onSheet,children}:{p:Player;selected:boolean;onSheet:()=>void;children:ReactNode}){
 return <CardBody p={p} selected={selected}><div className="fa-card-actions"><button type="button" className="secondary" onClick={onSheet}>Ver ficha</button>{children}</div></CardBody>;
}
export function PlayerCard({p,selected,disabled,locked,toggle}:{p:Player;selected:boolean;disabled:boolean;locked:boolean;toggle:()=>void}){
 return <CardBody p={p} selected={selected}><details><summary>Ver atributos e afinidades</summary><PlayerSheet p={p}/></details>
 <button className={`pick ${selected?'picked':''}`} onClick={toggle} disabled={locked||disabled&&!selected}>{selected?'✓ No elenco':'+ Selecionar jogador'}</button></CardBody>;
}
