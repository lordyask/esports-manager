import type {TeamPlan,AttackPlan,DefensePlan} from './tactical-types.ts';
export const ATTACKS={
 fast:{name:'Execução rápida',description:'Chegada coordenada ao ponto antes da resposta defensiva.',strong:'Pressiona defesas que demoram a responder.',weak:'Contenção e utilitários preparados.',attributes:'Movimentação, mira e utilitários'},
 control:{name:'Controle e leitura',description:'Preparar o meio, coletar informação e escolher a entrada.',strong:'Explora exposição da defesa avançada.',weak:'Consumo de tempo e defesa paciente.',attributes:'Leitura, disciplina e comunicação'},
 split:{name:'Pressão dividida',description:'Aproximar por rotas diferentes e reunir pressão no ponto.',strong:'Estica a defesa concentrada.',weak:'Isolamento e entradas desencontradas.',attributes:'Comunicação, posicionamento e movimentação'},
 feint:{name:'Finta e rotação',description:'Pressionar o ponto oposto por 18 s e mudar o foco.',strong:'Explora rotações antecipadas.',weak:'Pressão que identifica a finta.',attributes:'Leitura, comunicação e movimentação'},
} satisfies Record<AttackPlan,{name:string;description:string;strong:string;weak:string;attributes:string}>;
export const DEFENSES={
 balanced:{name:'Contenção',description:'Manter jogadores nos pontos e contestar as entradas.',strong:'Recebe execuções diretas com presença local.',weak:'Pressão em rotas diferentes.',attributes:'Posicionamento, disciplina e utilitários'},
 aggressive:{name:'Pressão avançada',description:'Contestar o meio cedo e disputar informação.',strong:'Encontra grupos isolados antes da entrada.',weak:'Exposição a um ataque que observa e pune.',attributes:'Mira, movimentação e leitura'},
 retake:{name:'Retomada',description:'Distribuir contenção e reserva para reagrupar após o plant.',strong:'Concentra resposta no ponto identificado.',weak:'Espaço cedido e retomada sem coordenação.',attributes:'Comunicação, utilitários e movimentação'},
 reading:{name:'Leitura e resposta',description:'Manter posições até observar presença antes de rotacionar.',strong:'Resiste a informação incompleta e fintas.',weak:'Resposta tardia a execução rápida.',attributes:'Leitura, comunicação e disciplina'},
} satisfies Record<DefensePlan,{name:string;description:string;strong:string;weak:string;attributes:string}>;
export const ATTACK_INSTRUCTIONS={none:'Sem complemento',trade:'Priorizar trades',utility:'Preparar entrada com utilitários',preserve:'Preservar jogadores'} as const;
export const DEFENSE_INSTRUCTIONS={none:'Sem complemento',trade:'Priorizar trades',cautious:'Rotacionar com cautela',resources:'Preservar recursos para a retomada'} as const;
export function validateStrategy(p:TeamPlan){
 if(!p||!(p.attack in ATTACKS)||!(p.defense in DEFENSES)||!['A','B'].includes(p.site))throw new Error('Plano tático inválido.');
 if(p.attackInstruction!==undefined&&!(p.attackInstruction in ATTACK_INSTRUCTIONS)||p.defenseInstruction!==undefined&&!(p.defenseInstruction in DEFENSE_INSTRUCTIONS))throw new Error('Instrução tática inválida.');
 if(p.attack==='fast'&&p.attackInstruction==='preserve')throw new Error('Execução rápida exige entrada coordenada; escolha trades ou utilitários.');
 if(p.defense==='aggressive'&&p.defenseInstruction==='resources')throw new Error('Pressão avançada e reserva para retomada são ordens incompatíveis.');
}
