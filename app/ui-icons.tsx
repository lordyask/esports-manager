/** Small code-native navigation icons; the official N is always the supplied asset. */
export function UiIcon({name}:{name:string}){
 const paths:Record<string,string>={
  arrow:'m9 5 7 7-7 7',
  finance:'M4 6h16v14H4ZM4 10h16M8 3v6M16 3v6M8 15h8',
  home:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
  players:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4',
  tactics:'M4 4h6v6H4ZM14 14h6v6h-6ZM7 10v7h7M14 7h6M17 4v6',
  match:'m9 3 3 5 3-5 6 6-5 3 5 3-6 6-3-5-3 5-6-6 5-3-5-3Z',
  report:'M5 3h14v18H5ZM8 16v-3M12 16V8M16 16v-6',
  training:'M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10',
  agents:'m12 3 9 5v8l-9 5-9-5V8ZM12 8v8M8 10l8 4M16 10l-8 4',
  history:'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',
  calendar:'M4 5h16v16H4ZM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2',
  menu:'M4 6h16M4 12h16M4 18h16',
  collapse:'M9 5 3 12l6 7M3 12h18',
  settings:'M9 3h6l1 4 4 1 1 6-4 2-1 4H9l-1-4-4-1-1-6 4-2ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  close:'m6 6 12 12M18 6 6 18',
 };
 return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]??paths.home}/></svg>;
}
