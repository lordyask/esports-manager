# NEXUS — Conferência da interface do Beta 2.0

Data: 13/11/2026. Situação: conferência parcial, com correções locais e verificações técnicas concluídas. Publicação não realizada.

## Resultado

A prévia abriu no Chrome desktop e permitiu conferir uma carreira de teste, a integração das artes na Preparação e no Treinamento e a retomada de uma rodada salva. A conexão com o navegador caiu antes do restante da revisão. Portanto, este documento não libera o Beta 2.0 como integralmente validado.

Foi mantida a identidade Tactical Premium UI aprovada: fundo escuro, destaque dourado, navegação lateral, painéis e indicadores. Este pacote corrige a aplicação existente; não propõe uma identidade nova. O balanceamento continua sujeito a ajustes graduais durante o beta, conforme a decisão aprovada.

## Correções

| Problema | Correção | Evidência |
| --- | --- | --- |
| Preparação devolvia o jogador ao Treinamento quando a sessão ainda estava disponível | Abrir a Preparação após salvar as atribuições | Caminho repetido com sucesso no navegador |
| Alguns jogadores com função IGL apareciam com rótulo vazio | Usar a própria sigla quando não houver tradução no dicionário | Revisão do código e compilação; releitura visual pendente |
| Cliques durante a leitura inicial do progresso podiam não executar a navegação esperada | Desabilitar a navegação até a leitura terminar | Revisão do código e compilação; teste visual final pendente |
| Antes do treino de laboratório, o botão oferecia iniciar uma partida que o motor ainda bloquearia | Exibir “Ir para o treinamento” nessa situação | Revisão do código e compilação; carreira mantém confirmação própria para pular treino |
| Regra genérica de campos empilhava miniatura e texto do agente | Restaurar a disposição flexível na identidade do agente | Correção de especificidade CSS; conferência visual posterior pendente |

## Observado no navegador

Ambiente: Chrome desktop, área de 1363 × 936 pixels CSS. Organização sintética NEXUS QA / NQA. A largura inicial do documento foi 1348 pixels, dentro da área disponível. Isso verifica a tela inicial nesse tamanho, sem atestar todos os painéis ou larguras.

- Seleção de cinco jogadores, teto salarial e bloqueio de contratações após completar o elenco.
- Acesso à Preparação antes de treinar. Troca do agente de Dobra para Bruma atualiza a arte, preservando a identidade do jogador. O agente foi devolvido a Prisma.
- Imagens da Preparação carregadas, com dimensões naturais positivas; Cume exibe o setor B / Estabilizador e suas conexões.
- Início do circuito, dia 1 e saldo de 29.000 após a inscrição.
- Treino individual de Cedro em Prisma, mantendo Bastião como agente escalado. Escolhas sobrevivem à navegação e recarga sem consumir a sessão; confirmar uma vez leva familiaridade 10 → 15, recebe 280 XP e preserva 30 XP restantes. Recarregar não libera uma segunda sessão.
- Cancelar o salto do calendário mantém o dia 1; confirmar leva ao dia 4, sem treinos automáticos.
- Início do confronto em Doca contra Ponto Zero, código 1840344411. O worker executou a primeira rodada; após recarregar e reabrir Partida, a próxima rodada continuava sendo a 2, com placar 0–1 e o mesmo código. Mapa e relatório parcial exibiam os acontecimentos registrados.

## Verificação técnica

- 190 testes automatizados aprovados, sem falhas.
- TypeScript aprovado.
- Compilação e exportação estática na raiz e em `/nexus` verificadas.
- Manifesto, referências de recursos e bundle do worker conferidos nos dois destinos.
- 24 arquivos de arte conferidos por caminho, dimensões e hash nos dois destinos.
- 14 estados de componentes renderizados estaticamente em cada destino. Essa verificação não mede CSS, foco nem eventos do navegador.
- Motor, regras, catálogos, artes aprovadas e módulos de persistência preservados em relação ao pacote anterior. Nenhuma mudança de balanceamento, esquema ou migração.

Os registros desta etapa ficam em `validation/interface/`. O detalhamento das observações e limites do navegador está em `browser-results.json`.

## O que ainda falta nesta revisão

1. Repetir o visual após as últimas correções de rótulos, botão e CSS; conferir os oito agentes, abertura das artes e proporções de Bruma e Trava.
2. Conferir largura de celular, abertura e fechamento do menu, tabelas e diálogos. Android físico e Safari não foram testados.
3. Terminar uma sequência automática e conferir relatório final, histórico, classificação, finanças e partidas dos adversários na interface.
4. Conferir teclado, foco, cancelamento e execução de reiniciar carreira; exportação/importação e acervo na interface.

A queda da conexão interrompeu os itens acima. As tentativas de reconexão falharam; não se substituiu a inspeção por outro mecanismo de automação. Resultados técnicos anteriores sobre esses sistemas permanecem evidência distinta e não tornam estes itens visualmente aprovados.

## Preservação e entrega

Trabalho isolado na branch `development/beta-2.0-interface-review`, a partir de `ebcd06aad220ba8433e7b122f1c3359ff8d8e930`. A branch `main` continua em `42cdbe6dd19dda0cf20c3c85814d3d35ea46e2fd` (Beta 1.3). Sem push, merge ou lançamento público. A página temporária criada para conferir largura móvel foi removida antes das compilações finais.

Após concluir as pendências de interface, o lançamento ainda precisa de uma versão candidata identificada, notas da versão, publicação autorizada e checagem no endereço público. Não há necessidade de esperar um balanceamento definitivo para começar o Beta 2.0.
