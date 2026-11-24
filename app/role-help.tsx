import type {RefObject} from 'react';
const roles={
 IGL:'Coordena as chamadas e as decisões táticas da equipe durante a rodada.',
 Entry:'Entra primeiro nas disputas por espaço e abre caminho para o time.',
 Second:'Acompanha o Entry e fica pronto para a troca se ele cair.',
 Support:'Usa utilitários para preparar e facilitar as jogadas da equipe.',
 Anchor:'Sustenta uma área na defesa e ganha tempo para a rotação do time.',
 Lurker:'Atua separado do grupo para ler rotações, vigiar flancos e aproveitar brechas.',
 'Main OP':'É a referência da equipe com o rifle de precisão e segura linhas longas.',
};
export function RoleHelp({dialog}:{dialog:RefObject<HTMLDialogElement|null>}){
 return <dialog ref={dialog} className="preferences-dialog fa-dialog" aria-labelledby="roles-title"><h2 id="roles-title">Funções táticas</h2>
 <dl>{Object.entries(roles).map(([name,meaning])=><div key={name}><dt>{name}</dt><dd>{meaning}</dd></div>)}</dl>
 <button className="secondary" onClick={()=>dialog.current?.close()}>Fechar ajuda</button></dialog>;
}
