export const AGENTS = ['Estalo','Ímpeto','Farol','Pulso','Bruma','Véu','Trava','Bastião'] as const;
export type Agent = typeof AGENTS[number];
export type Slot = 0|1|2|3;
export type EffectKind = 'blind'|'dash'|'blast'|'speed'|'smoke'|'position'|'scan'|'track'|'sweep'|'disorient'|'interrupt'|'sensor'|'zone'|'slow'|'step'|'teleport'|'alarm'|'trap'|'delay'|'confinement'|'barrier'|'guard'|'safe'|'fortress';
export interface Ability {name:string;kind:EffectKind;cast:number;duration:number;targets:number;value:number;warning:number;}
const skill=(name:string,kind:EffectKind,duration=0,value=0,targets=1,warning=0,cast=500):Ability=>({name,kind,cast,duration,value,targets,warning});
export const ABILITIES:Record<Agent,[Ability,Ability,Ability,Ability]>={
  Estalo:[skill('Clarão','blind',2000,.25,2),skill('Arranque','dash'),skill('Carga de ruptura','blast',0,3500,2,1000),skill('Detonação','blast',0,6000,3,2000,1000)],
  'Ímpeto':[skill('Aceleração','speed',6000,.7),skill('Cortina curta','smoke',4000),skill('Salto tático','position',3000,10),skill('Sobrecarga','speed',8000,.6,1,0,1000)],
  Farol:[skill('Sondagem','scan',6000),skill('Marca','track',3000),skill('Luz de abertura','blind',2000,.25,2),skill('Varredura','sweep',3000,0,1,0,1000)],
  Pulso:[skill('Abalo','disorient',3000,.15,2),skill('Interferência','interrupt'),skill('Sensor próximo','sensor',6000),skill('Onda de choque','disorient',4000,.25,3,0,1000)],
  Bruma:[skill('Nuvem','smoke',8000),skill('Linha opaca','smoke',10000,0,2),skill('Zona incandescente','zone',5000,1000),skill('Domínio cinzento','smoke',12000,0,2,0,1000)],
  'Véu':[skill('Véu local','smoke',6000),skill('Campo viscoso','slow',4000,1.5),skill('Passo oculto','step'),skill('Travessia','teleport',0,0,1,0,3000)],
  Trava:[skill('Alarme','alarm'),skill('Laço','trap'),skill('Bloqueio','delay',8000,2000),skill('Confinamento','confinement',8000,.15,1,0,1000)],
  'Bastião':[skill('Barreira','barrier',6000),skill('Guarda','guard',5000,2500),skill('Posição segura','safe',6000,.15),skill('Fortaleza','fortress',6000,2500,5,0,1000)],
};
