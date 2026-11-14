'use client';
import type {Agent} from '../src/abilities';
import {AGENT_ART,artUrl} from '../lib/agent-art';
export function AgentIdentity({agent,label='Agente escalado'}:{agent:Agent;label?:string}){
 const art=AGENT_ART[agent],image=art.preview;
 return <span className="agent-identity"><img src={artUrl(image)} width={image.width} height={image.height} alt={`Arte oficial de ${agent}`} loading="lazy" decoding="async"/><span><small>{label}</small><strong>{agent}</strong><small>{art.classLabel}</small></span></span>;
}
export function AgentGallery({agent}:{agent:Agent}){
 const art=AGENT_ART[agent];
 return <div className="agent-gallery"><figure className="agent-poster"><a href={artUrl(art.keyart)} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar arte oficial de ${agent} em nova aba`}><img src={artUrl(art.preview)} srcSet={`${artUrl(art.preview)} ${art.preview.width}w, ${artUrl(art.keyart)} ${art.keyart.width}w`} sizes="(max-width: 600px) 220px, 240px" width={art.preview.width} height={art.preview.height} alt={`Arte cinematográfica oficial de ${agent}`} loading="lazy" decoding="async"/><span>Ampliar arte ↗</span></a></figure><details className="agent-art"><summary>Ver card oficial de {agent}</summary><img src={artUrl(art.card)} alt={`Card oficial de ${agent}, com apresentação das quatro habilidades`} width={art.card.width} height={art.card.height} loading="lazy" decoding="async"/><a className="art-link" href={artUrl(art.card)} target="_blank" rel="noopener noreferrer">Ampliar card de {agent} em nova aba ↗</a><p className="small muted">O card apresenta a identidade visual. Consulte abaixo os efeitos usados nas partidas.</p></details></div>;
}
