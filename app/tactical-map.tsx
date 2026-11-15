'use client';
import {DocaV2Map} from './doca-v2-map';
import {useState} from 'react';
import type {CSSProperties} from 'react';
import type {MapId,Sector} from '../src/rules';
import {mapEdges} from '../src/rules';
import {MAP_CATALOG} from '../src/maps';
import type {RoundRecord,Session} from '../lib/game';

const regions:Partial<Record<Sector,[number,number,number,number]>>={
 defense:[32,17,35,13],attack:[32,74,35,12],A:[9,39,23,25],mid:[36,40,28,25],B:[68,39,22,25],
};
const order:Sector[]=['defense','A','mid','B','attack'];
/** Slots group actors by their recorded sector; never infer physical coordinates from artwork. */
export function TacticalMap({map,session,record}:{map:MapId;session?:Session;record?:RoundRecord}){
 const [selected,setSelected]=useState<Sector>('mid');
 if(map==='doca-v2')return <DocaV2Map session={session} record={record}/>;
 const definition=MAP_CATALOG[map];if(!definition.image)return null;
 const actors=record?.result.actors??[];
 const label=(sector:Sector)=>`${sector==='A'||sector==='B'?sector+' · ':''}${definition.sectors[sector]}`;
 const number=(id:string)=>{const p=session?.profiles.find(p=>p.id===id);return `${p?.team??''}${(session?.profiles.filter(q=>q.team===p?.team).findIndex(q=>q.id===id)??0)+1}`;};
 const grouped=actors.filter(a=>a.sector===selected);
 return <section className="tactical-map" aria-label={`Mapa ${definition.name}`}>
  <div className="panel-title"><h3>{definition.name} · visão por setores</h3><span className="pill">{record?`FIM DA RODADA ${record.command.revision+1}`:'PRÉVIA DO MAPA'}</span></div>
  <div className="map-art">
   <img src={`${process.env.NEXT_PUBLIC_BASE_PATH??''}${definition.image}`} width="1672" height="941" alt={`Mapa ${definition.name}: Base Norte, ponto A, meio, ponto B e Base Sul.`}/>
   {order.map(sector=>{const [x,y,w,h]=regions[sector]!;return <button type="button" key={sector} aria-label={`Setor ${label(sector)}`} aria-pressed={selected===sector} onClick={()=>setSelected(sector)} className={`map-region ${selected===sector?'active':''}`} style={{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`} as CSSProperties}>
    <span className="map-region-label">{sector==='attack'?'SUL':sector==='defense'?'NORTE':sector.toUpperCase()}</span>
    <span className="map-markers">{actors.filter(a=>a.sector===sector).map(a=><span key={a.id} title={`${session?.names[a.id]} · ${a.vital.life>0?'vivo':'eliminado'}`} className={`map-marker team-${a.team} ${a.vital.life<=0?'eliminated':''}`}>{number(a.id)}{a.vital.life<=0?'×':''}</span>)}</span>
   </button>;})}
  </div>
  <p className="small muted">{record?'Posições registradas ao fim da rodada. A1–A5: sua equipe; B1–B5: adversários; ×: eliminado. O setor de saída é mantido durante uma travessia.':'Selecione uma área para consultar suas conexões.'} Indicadores agrupados por setor. As coberturas da imagem são visuais.</p>
  <div className="map-details" aria-live="polite"><h3>{label(selected)}</h3>
   <p className="small">Conexões: {mapEdges(map).filter(([a,b])=>a===selected||b===selected).map(([a,b,ms])=>`${label(a===selected?b:a)} · ${ms/1000} s`).join(' / ')}</p>
   {record&&<ul className="map-roster">{grouped.length?grouped.map(a=><li key={a.id}>{number(a.id)} · {session?.names[a.id]} · {a.vital.life>0?'vivo':'eliminado'}</li>):<li>Nenhum jogador neste setor ao fim da rodada.</li>}</ul>}
  </div>
 </section>;
}
