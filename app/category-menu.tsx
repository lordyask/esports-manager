'use client';
import {UiIcon} from './ui-icons';

export const MENU_LABELS=['Visão geral','Elenco','Preparação','Partida','Relatório','Treinamento','Agentes','Histórico','Calendário','Circuito','Finanças','Acervo','Staff'];
const ICONS=['home','players','tactics','match','report','training','agents','history','calendar','report','finance','history','players'];
const DESCRIPTIONS=[
 'Resumo da organização e próximo compromisso.',
 'Consulte os titulares e seus perfis.',
 'Organize a composição e o plano tático.',
 'Acompanhe os rounds e tome decisões.',
 'Analise o confronto mais recente.',
 'Defina o desenvolvimento dos jogadores.',
 'Consulte habilidades e familiaridades.',
 'Consulte as partidas concluídas.',
 'Rotina do dia e avanço da carreira.',
 'Equipes, rodadas e classificação.',
 'Acompanhe o caixa e os compromissos.',
 'Acesse as carreiras preservadas.',
 'Negocie com analistas e consulte seus relatórios.',
];
export const MENU_GROUPS=[
 {id:'central',name:'Central de comando',icon:'home',summary:'Visão geral e Calendário',tabs:[0,8]},
 {id:'team',name:'Equipe',icon:'players',summary:'Elenco, Treinamento e Agentes',tabs:[1,5,6,12]},
 {id:'competition',name:'Competição',icon:'match',summary:'Circuito, Preparação e Partida',tabs:[9,2,3]},
 {id:'records',name:'Resultados e gestão',icon:'report',summary:'Relatório, Histórico, Finanças e Acervo',tabs:[4,7,10,11]},
];
export type MenuGroup=typeof MENU_GROUPS[number];
export const groupForTab=(tab:number)=>MENU_GROUPS.find(group=>group.tabs.includes(tab))??MENU_GROUPS[0];

type Access={disabled:boolean;unavailable:(tab:number)=>string|undefined;onOpenTab:(tab:number)=>void};
export function CategoryMenu({group,onChooseGroup,onOpenTab,disabled,unavailable}:{group:MenuGroup|null;onChooseGroup:(index:number)=>void}&Access){
 return <section className="category-menu" aria-label={group?`Menus de ${group.name}`:'Categorias do menu principal'}>
  <div className="category-heading"><span className="eyebrow">NEXUS · CENTRO DE GESTÃO</span><h1>{group?.name??'Menu principal'}</h1><p>{group?'Escolha o menu que deseja abrir.':'Escolha uma categoria para acessar seus menus.'}</p></div>
  <div className={`category-grid ${group?'category-submenus':''}`}>
   {group?group.tabs.map(tab=>{const reason=unavailable(tab);return <button type="button" className="category-card" key={tab} onClick={()=>onOpenTab(tab)} disabled={disabled||!!reason} aria-describedby={reason?`menu-reason-${tab}`:undefined}>
    <span className="category-card-title"><strong>{MENU_LABELS[tab]}</strong><UiIcon name={ICONS[tab]}/></span><span className="category-card-description">{DESCRIPTIONS[tab]}</span>{reason?<span className="category-card-reason" id={`menu-reason-${tab}`}>{reason}</span>:<span className="category-card-open">Abrir menu <UiIcon name="arrow"/></span>}
   </button>;}):MENU_GROUPS.map((item,index)=><button type="button" className="category-card" key={item.id} onClick={()=>onChooseGroup(index)} disabled={disabled}>
    <span className="category-card-title"><strong>{item.name}</strong><UiIcon name={item.icon}/></span><span className="category-card-description">{item.summary}</span><span className="category-card-open">Abrir categoria <UiIcon name="arrow"/></span>
   </button>)}
  </div>
 </section>;
}

export function CategoryTabs({group,tab,onOpenTab,disabled,unavailable}:{group:MenuGroup;tab:number}&Access){
 return <nav className="category-tabs" aria-label={`Menus de ${group.name}`}>
  {group.tabs.map(index=><button type="button" key={index} className={tab===index?'active':''} aria-current={tab===index?'page':undefined} disabled={disabled||!!unavailable(index)} onClick={()=>onOpenTab(index)} title={unavailable(index)}><UiIcon name={ICONS[index]}/>{MENU_LABELS[index]}</button>)}
 </nav>;
}
