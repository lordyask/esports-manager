# Menu por categorias

A navegação aprovada organiza o NEXUS em três níveis: menu principal, categoria e tela de trabalho. A abertura do jogo começa no menu principal. O cabeçalho oferece retorno direto ao menu principal; o caminho de navegação permite voltar à categoria. Dentro de uma tela aparecem somente os menus relacionados à sua categoria.

| Categoria | Menus |
| --- | --- |
| Central de comando | Visão geral, Calendário |
| Equipe | Elenco, Treinamento, Agentes |
| Competição | Circuito, Preparação, Partida |
| Resultados e gestão | Relatório, Histórico, Finanças, Acervo |

Os atalhos existentes abrem a tela e atualizam a categoria correspondente. Confirmar ou pular treino na carreira continua retornando ao Calendário; um relatório parcial abre Resultados e gestão. A navegação não reinicia a organização ou a partida e não grava um save por si só. Exportação, importação e preferências estão acessíveis no menu principal e nas preferências do cabeçalho.

Partida e Relatório mantêm seus pré-requisitos. Os cartões de menu indisponíveis explicam o motivo. O foco é levado ao conteúdo ao trocar de tela, e o botão de retorno permanece no cabeçalho durante a rolagem.

## Validação da implantação

- 194 testes existentes aprovados, TypeScript e build estático aprovados.
- Exportação estática, manifesto, worker e identificação da versão conferidos.
- Oito cenários React DOM com jsdom e fake IndexedDB verificaram navegação real, seleção ainda não salva no elenco, disponibilidade de menus, preservação de carreira, confirmação e salto do treino, painéis de consulta e retomada de partida com relatório parcial.
- O roteiro DOM foi executado temporariamente, sem adicionar dependências ao projeto. Esse roteiro não mede o layout em navegador real.

Esta entrega implanta a navegação por categorias. Os painéis operacionais mantêm seus componentes atuais para ajustes visuais progressivos.
