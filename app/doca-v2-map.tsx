'use client';
import {useState} from 'react';
import {DOCA_V2_AREAS,DOCA_V2_MOVEMENT} from '../src/doca-v2';
import type {DocaArea} from '../src/doca-v2';
import type {RoundRecord,Session} from '../lib/game';

const k=(a:string,b:string)=>[a,b].sort().join(':');
const bends:Record<string,string>={
 [k('attack_west','reception')]:'40,91 18,91 18,66',
 [k('attack_east','maintenance')]:'60,91 82,91 82,70',
 [k('triage','bend_south')]:'50,76 50,69 44,69 44,64',
 [k('bend_south','bend_north')]:'44,64 44,60 50,60 50,55',
 [k('gallery_a','gallery')]:'22,20 22,16 38,16 38,22 50,22',
 [k('gallery','gallery_b')]:'50,22 64,22 64,16 78,16 78,20',
 [k('A','cover_a')]:'22,30 22,36 28,36 28,34',
 [k('B','cover_b')]:'78,33 78,39 72,39 72,37',
};
const labels:Partial<Record<DocaArea,string>>={attack:'BASE ATACANTE',defense:'BASE DEFENSORA',reception:'RECEPÇÃO',corridor_a:'CORREDOR A',A:'ARMAZÉM · A',maintenance:'MANUTENÇÃO',corridor_b:'CORREDOR B',B:'ATRACADOURO · B',triage:'TRIAGEM',mid:'INSPEÇÃO',link_a:'LIGAÇÃO A',link_b:'LIGAÇÃO B',gallery:'GALERIA DE SERVIÇO'};
const color=(a:DocaArea,b:DocaArea)=>a.startsWith('gallery')||b.startsWith('gallery')||a.startsWith('defense')||b.startsWith('defense')?'#bf9ff5':[a,b].some(x=>['reception','corridor_a','A','cover_a','attack_west'].includes(x))?'#63deb2':[a,b].some(x=>['maintenance','corridor_b','B','cover_b','attack_east'].includes(x))?'#eec778':'#62c8e4';
export function DocaV2Map({session,record}:{session?:Session;record?:RoundRecord}){
 const [selected,setSelected]=useState<DocaArea>('triage'),actors=record?.result.actors??[];
 const names=DOCA_V2_AREAS,grouped=actors.filter(a=>a.sector===selected);
 const position=(id:string)=>{const a=names[id as DocaArea];return `${a.x},${a.y}`;};
 const number=(id:string)=>{const p=session?.profiles.find(p=>p.id===id);return `${p?.team??''}${(session?.profiles.filter(q=>q.team===p?.team).findIndex(q=>q.id===id)??0)+1}`;};
 return <section className="tactical-map doca-v2-map" aria-label="Mapa Doca V2">
  <div className="panel-title"><h3>Doca V2 · áreas táticas</h3><span className="pill">{record?`FIM DA RODADA ${record.command.revision+1}`:'PLANTA DA PARTIDA'}</span></div>
  <svg viewBox="0 0 100 100" role="img" aria-label="Planta da Doca V2: três saídas do ataque, rotas A e B, meio com curvas e galeria contínua atrás dos pontos.">
   <rect x="1" y="1" width="98" height="98" rx="2" fill="#15212c" stroke="#62727b" strokeWidth=".4"/>
   {DOCA_V2_MOVEMENT.map(([a,b])=>{const points=bends[k(a,b)]??`${position(a)} ${position(b)}`;return <g key={k(a,b)}><polyline points={points} fill="none" stroke="#080e14" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/><polyline points={points} fill="none" stroke="#adbab9" strokeWidth="3.7" strokeLinejoin="round" strokeLinecap="round"/><polyline points={points} fill="none" stroke={color(a,b)} strokeWidth=".35" strokeDasharray="1.3 1"/></g>;})}
   <rect x="35" y="5" width="30" height="8" fill="#ab9dba" stroke="#080e14" strokeWidth=".8"/>
   <rect x="34" y="87" width="32" height="9" fill="#91afa5" stroke="#080e14" strokeWidth=".8"/>
   <rect x="10" y="24" width="24" height="15" fill="#94b7a6" stroke="#080e14" strokeWidth=".8"/>
   <rect x="66" y="27" width="24" height="16" fill="#bcb091" stroke="#080e14" strokeWidth=".8"/>
   <rect x="40" y="25" width="20" height="11" fill="#101923" stroke="#080e14" strokeWidth=".8"/><text x="50" y="31" textAnchor="middle" fill="#8799a3" fontSize="1.8">BLOCO TÉCNICO</text>
   <rect x="23.5" y="29.5" width="3.5" height="3.5" fill="#455a66" stroke="#17232c" strokeWidth=".5"/>
   <rect x="73" y="32" width="3.5" height="3.5" fill="#455a66" stroke="#17232c" strokeWidth=".5"/>
   {(Object.keys(names) as DocaArea[]).map(id=>{const p=names[id],members=actors.filter(a=>a.sector===id);return <g key={id} className="doca-area" role="button" tabIndex={0} aria-label={`Área ${p.name}`} aria-pressed={selected===id} onClick={()=>setSelected(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(id);}}}>
    <circle cx={p.x} cy={p.y} r={selected===id?1.5:1.05} fill={selected===id?'#fff':'#1a3440'} stroke="#f2fbfa" strokeWidth=".25"/>
    {labels[id]&&<text x={p.x} y={p.y-2.1} textAnchor="middle" className="doca-area-label">{labels[id]}</text>}
    {members.map((a,i)=><text key={a.id} x={p.x+(i%3-1)*1.6} y={p.y+3.2+Math.floor(i/3)*1.8} textAnchor="middle" className={a.team==='A'?'doca-marker-a':'doca-marker-b'}>{number(a.id)}{a.vital.life<=0?'×':''}</text>)}
   </g>;})}
  </svg>
  <p className="small muted">Conexões são bidirecionais. A imagem é esquemática; os tempos e a visão são calculados pelas áreas do motor. Escolha uma área para ver suas conexões.</p>
  <label className="field"><span>Consultar área</span><select value={selected} onChange={e=>setSelected(e.target.value as DocaArea)}>{(Object.keys(names) as DocaArea[]).map(id=><option key={id} value={id}>{names[id].name}</option>)}</select></label>
  <div className="map-details"><h3>{names[selected].name}</h3><p className="small">Conexões: {DOCA_V2_MOVEMENT.filter(([a,b])=>a===selected||b===selected).map(([a,b,ms])=>`${names[a===selected?b:a].name} · ${(ms/1000).toLocaleString('pt-BR')} s`).join(' / ')}</p>
   {record&&<ul className="map-roster">{grouped.length?grouped.map(a=><li key={a.id}>{number(a.id)} · {session?.names[a.id]} · {a.vital.life>0?'vivo':'eliminado'}</li>):<li>Nenhum jogador nesta área ao fim da rodada.</li>}</ul>}
  </div>
 </section>;
}
