/** Doca V2: abstract tactical areas, not coordinates in metres. */
export const DOCA_V2_REVISION='doca-v2-central-1';
export const DOCA_V2_AREAS={
 attack:{name:'Base atacante',x:50,y:91},
 reception:{name:'Recepção',x:18,y:66},
 corridor_a:{name:'Corredor A',x:18,y:48},
 A:{name:'Armazém · ponto A',x:22,y:30},
 cover_a:{name:'Cobertura do Armazém',x:28,y:34},
 triage:{name:'Triagem',x:50,y:76},
 bend_south:{name:'Curva sul',x:44,y:64},
 bend_north:{name:'Curva norte',x:50,y:55},
 mid:{name:'Inspeção',x:50,y:43},
 link_a:{name:'Ligação A',x:36,y:40},
 link_b:{name:'Ligação B',x:64,y:40},
 maintenance:{name:'Manutenção',x:82,y:70},
 corridor_b:{name:'Corredor B',x:82,y:52},
 B:{name:'Atracadouro · ponto B',x:78,y:33},
 cover_b:{name:'Cobertura do Atracadouro',x:72,y:37},
 gallery_a:{name:'Galeria · acesso A',x:22,y:20},
 gallery:{name:'Galeria de Serviço · centro',x:50,y:22},
 gallery_b:{name:'Galeria · acesso B',x:78,y:20},
 defense:{name:'Base defensora',x:50,y:9},
} as const;
export type DocaArea=keyof typeof DOCA_V2_AREAS;
export type DocaEdge=readonly [DocaArea,DocaArea,number];
/** Traversal is bidirectional. Milliseconds exclude a one-second post-arrival recovery. */
export const DOCA_V2_MOVEMENT:readonly DocaEdge[]=[
 ['attack','reception',4500],['reception','corridor_a',2500],['corridor_a','A',3500],['A','cover_a',1500],
 ['attack','maintenance',4500],['maintenance','corridor_b',2500],['corridor_b','B',3500],['B','cover_b',1500],
 ['attack','triage',3000],['triage','bend_south',2500],['bend_south','bend_north',2500],['bend_north','mid',2500],
 ['mid','link_a',2500],['link_a','A',2500],['mid','link_b',2500],['link_b','B',2500],
 ['defense','gallery',2000],['gallery','gallery_a',3000],['gallery_a','A',3000],['gallery','gallery_b',3000],['gallery_b','B',3000],
];
const key=(a:string,b:string)=>[a,b].sort().join(':');
/** Explicit unobstructed sight lines between area positions. Other adjacent areas have a turn, wall or cover. */
export const DOCA_V2_SIGHT:readonly (readonly [DocaArea,DocaArea])[]=[
 ['reception','corridor_a'],['corridor_a','A'],['maintenance','corridor_b'],['corridor_b','B'],
 ['mid','link_a'],['link_a','A'],['mid','link_b'],['link_b','B'],
 ['gallery','gallery_a'],['gallery_a','A'],['gallery','gallery_b'],['gallery_b','B'],
];
/** Fire/throw permissions are separate from movement; sight does not automatically authorize an attack. */
export const DOCA_V2_FIRE:readonly (readonly [DocaArea,DocaArea])[]=[
 ['reception','corridor_a'],['corridor_a','A'],['maintenance','corridor_b'],['corridor_b','B'],
 ['mid','link_a'],['link_a','A'],['mid','link_b'],['link_b','B'],
 ['gallery','gallery_a'],['gallery_a','A'],['gallery','gallery_b'],['gallery_b','B'],
];
export const isDocaArea=(v:unknown):v is DocaArea=>typeof v==='string'&&Object.hasOwn(DOCA_V2_AREAS,v);
export const docaAdjacent=(a:DocaArea,b:DocaArea)=>DOCA_V2_MOVEMENT.some(([x,y])=>x===a&&y===b||x===b&&y===a);
export const docaSightLink=(a:DocaArea,b:DocaArea)=>a===b||DOCA_V2_SIGHT.some(([x,y])=>key(x,y)===key(a,b));
export const docaFireLink=(a:DocaArea,b:DocaArea)=>a===b||DOCA_V2_FIRE.some(([x,y])=>key(x,y)===key(a,b));
/** The caller advances `remaining` as simulated time passes. */
export interface DocaPosition {sector:DocaArea;movement?:{from:DocaArea;to:DocaArea;remaining:number;initial?:number}|null;}
const progress=(m:NonNullable<DocaPosition['movement']>)=>Math.max(0,Math.min(1,1-m.remaining/(m.initial??DOCA_V2_MOVEMENT.find(([a,b])=>key(a,b)===key(m.from,m.to))?.[2]??1)));
const exposed=(p:DocaPosition):DocaArea[]=>{
 if(!p.movement)return [p.sector];
 const m=p.movement,t=progress(m);
 if(docaSightLink(m.from,m.to))return [m.from,m.to];
 return t<=0.25?[m.from]:t>=0.75?[m.to]:[];
};
/** Visibility yields the links whose smoke/barriers must also be checked by the engine. */
export function docaSight(a:DocaPosition,b:DocaPosition):{visible:boolean;edges:string[]} {
 const am=a.movement,bm=b.movement;
 if(am&&bm&&key(am.from,am.to)===key(bm.from,bm.to)){
  const p=progress(am),q=am.from===bm.from?progress(bm):1-progress(bm);
  if(Math.abs(p-q)<=0.25)return {visible:true,edges:[key(am.from,am.to)]};
 }
 for(const x of exposed(a))for(const y of exposed(b))if(docaSightLink(x,y)){
  const edges=[...(am?[key(am.from,am.to)]:[]),...(bm?[key(bm.from,bm.to)]:[]),...(x===y?[]:[key(x,y)])];
  return {visible:true,edges:[...new Set(edges)]};
 }
 return {visible:false,edges:[]};
}
/** A straight projectile/targeted ability must use an allowed firing line as well as visibility. */
export function docaCanFire(a:DocaPosition,b:DocaPosition):boolean {
 const sight=docaSight(a,b);if(!sight.visible)return false;
 if(a.movement||b.movement)return true;
 return docaFireLink(a.sector,b.sector);
}
