export const AGENTS = ['Estalo','Ímpeto','Farol','Pulso','Bruma','Prisma','Trava','Bastião'] as const;
export type Agent = typeof AGENTS[number];
export type Slot = 0|1|2|3;
export type ReworkKind='optical_wall'|'distortion'|'optical_filter'|'refraction'|'cover'|'interposition'|'route_cover'|'redoubt';
export type EffectKind = ReworkKind|'blind'|'dash'|'blast'|'speed'|'smoke'|'position'|'scan'|'track'|'sweep'|'disorient'|'interrupt'|'sensor'|'zone'|'slow'|'step'|'teleport'|'alarm'|'trap'|'delay'|'confinement'|'barrier'|'guard'|'safe'|'fortress';
export interface Ability {name:string;kind:EffectKind;cast:number;duration:number;targets:number;value:number;warning:number;}
const skill=(name:string,kind:EffectKind,duration=0,value=0,targets=1,warning=0,cast=500):Ability=>({name,kind,cast,duration,value,targets,warning});
export const ABILITIES:Record<Agent,[Ability,Ability,Ability,Ability]>={
  Estalo:[skill('Clarão','blind',2000,.25,2),skill('Arranque','dash'),skill('Carga de ruptura','blast',0,3500,2,1000),skill('Detonação','blast',0,6000,3,2000,1000)],
  'Ímpeto':[skill('Aceleração','speed',6000,.7),skill('Cortina curta','smoke',4000),skill('Salto tático','position',3000,10),skill('Sobrecarga','speed',8000,.6,1,0,1000)],
  Farol:[skill('Sondagem','scan',6000),skill('Marca','track',3000),skill('Luz de abertura','blind',2000,.25,2),skill('Varredura','sweep',3000,0,1,0,1000)],
  Pulso:[skill('Abalo','disorient',3000,.15,2),skill('Interferência','interrupt'),skill('Sensor próximo','sensor',6000),skill('Onda de choque','disorient',4000,.25,3,0,1000)],
  Bruma:[skill('Nuvem','smoke',8000),skill('Linha opaca','smoke',10000,0,2),skill('Zona incandescente','zone',5000,1000),skill('Domínio cinzento','smoke',12000,0,2,0,1000)],
  Prisma:[skill('Plano Prismático','optical_wall',6000),skill('Desvio','distortion',6000,800),skill('Ângulo Morto','optical_filter',4000),skill('Câmara de Refração','refraction',10000,1200,2,1000,1000)],
  Trava:[skill('Alarme','alarm'),skill('Laço','trap'),skill('Bloqueio','delay',8000,2000),skill('Confinamento','confinement',8000,.15,1,0,1000)],
  'Bastião':[skill('Anteparo','cover',6000,6000),skill('Interposição','interposition',5000,3000),skill('Rota Segura','route_cover',12000,2500),skill('Último Reduto','redoubt',10000,5000,2,1000,1000)],
};
export const REWORK_KINDS:readonly EffectKind[]=['optical_wall','distortion','optical_filter','refraction','cover','interposition','route_cover','redoubt'];
