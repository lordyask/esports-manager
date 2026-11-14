# NEXUS — Calendário e treinamento diário com adversários fixos

Versão documental 1.0 · 10/11/2026 · Desenvolvimento do Beta 2.0 · Sem lançamento público

## Decisão oficial desta revisão

Yask aprovou a implementação do calendário e do treinamento diário, com uma alteração expressa: neste beta inicial as equipes adversárias não treinam nem evoluem. Seus atributos e familiaridades permanecem nos valores aprovados de início de campanha.

Essa decisão suspende, para esta versão, a rotina de treino adversário prevista em B20-01.06 / B20-03.08 e na proposta anterior desta conversa. O restante do calendário e do treino do jogador foi aprovado. A política só poderá mudar por nova decisão do autor.

Os adversários continuam utilizando a simulação normal, com compras, habilidades e escolhas táticas. Equipamento e resultados de rodada variam pelas regras existentes; os atributos e familiaridades de base não recebem bônus por passagem de tempo, por resultado nem para acompanhar a força do jogador. Os 35 potenciais e as preferências secundárias/terciárias continuam registrados nas fichas, sem produzir evolução automática.

## Implementação entregue

Foi criada a branch local `development/beta-2.0-calendar-training`, a partir do pacote dos mapas (`df4b962`). O Beta 1.3 publicado permanece preservado. Não houve push ao GitHub, merge, release ou deploy. O pacote de código é cumulativo: inclui Doca e Cume e as mudanças desta etapa.

Uma nova aba Calendário permite iniciar o ciclo, consultar o dia, acompanhar sete confrontos, treinar e avançar o tempo. Os cinco titulares permanecem vinculados. O ciclo começa no dia 1 com a evolução inicial do catálogo, sem trazer XP acumulado fora do calendário. Históricos concluídos anteriores são preservados; uma partida ativa precisa ser concluída ou preservada antes de iniciar um novo ciclo.

| Confronto do jogador | Dia | Mapa | Adversário | Lado inicial do jogador |
|---|---:|---|---|---|
| 1 | 4 | Doca | Ponto Zero | Ataque |
| 2 | 8 | Cume | Ferrovia | Defesa |
| 3 | 12 | Doca | Maré Alta | Ataque |
| 4 | 16 | Cume | Vértice | Defesa |
| 5 | 20 | Doca | Faísca | Ataque |
| 6 | 24 | Cume | Baluarte | Defesa |
| 7 | 28 | Doca | Coroa Negra | Ataque |

O jogador tem quatro inícios no ataque e três na defesa. Esta etapa agenda e permite disputar seus sete confrontos. A geração dos demais jogos do circuito, a classificação dos oito times e o fechamento financeiro continuam para o próximo pacote. A agenda concluída não é apresentada como campeonato homologado, título ou premiação já entregue.

Os adversários utilizam os 35 atletas das fichas aprovadas: nomes, países, funções, IGL, atributos, potenciais e três preferências de agentes foram extraídos da consolidação B20-03. As 35 médias individuais foram conferidas na extração. Cada equipe escala cinco agentes principais diferentes. Neste pacote, os perfis de combate usam o agente principal com familiaridade 85 e as condições-base do motor; não há treino NPC.

## Avanço do tempo

| Comando | Comportamento |
|---|---|
| Avançar um dia | Encerra a oportunidade ainda aberta do dia atual e abre a do dia seguinte |
| Avançar até o próximo jogo | Processa o intervalo e para na preparação do próximo confronto |
| Dia de confronto ainda não disputado | Bloqueia qualquer avanço até concluir a partida |
| Partida ativa | Bloqueia avanço de dia |
| Partida concluída | Mantém o treino do mesmo dia encerrado; avançar libera o próximo dia |
| Dia 28 após o último confronto | Conclui a agenda e mantém a campanha consultável; não existe dia 29 |

Não há passagem de tempo por relógio real. Saltar dias nunca treina o jogador. O aviso apresenta a quantidade exata de oportunidades perdidas e permite cancelar sem modificar o progresso.

Exemplos: do dia 1 sem treino ao dia 4, perdem-se três oportunidades; se o dia 1 já foi treinado ou encerrado explicitamente, perdem-se apenas as dos dias 2 e 3. A oportunidade do dia 4 permanece disponível antes de iniciar o confronto.

Os vencimentos financeiros e outros eventos futuros não são cobrados nesta entrega; sua integração ao avanço de tempo faz parte do pacote financeiro já previsto. Não foram acrescentadas receitas, custos ou prêmios provisórios.

## Treino exclusivo do jogador

Uma oportunidade diária, compartilhada entre coletivo dos cinco OU individual de um titular, com foco em atributo ou familiaridade de agente. Não são cinco sessões individuais por dia. O treino é opcional e não acumula. É possível usar até 28 oportunidades no ciclo, incluindo o dia 28 antes de começar o último confronto.

O coletivo mantém o XP-base por atleta: `100 + 2 × (potencial limitado entre 70 e 95 − 70)`, entre 100 e 150 XP. O individual entrega 2× esse XP apenas ao escolhido. O potencial aumenta o XP recebido; não reduz o preço da evolução.

| Atributo atual | XP para +1 | Familiaridade atual | XP para +1 |
|---|---:|---|---:|
| Até 59 | 200 | Até 49 | 50 |
| 60–69 | 300 | 50–69 | 75 |
| 70–79 | 400 | 70–84 | 100 |
| 80–89 | 600 | 85–94 | 150 |
| 90–99 | 800 | 95–99 | 200 |

XP excedente é preservado. Atributos e familiaridades têm limite 100; a média dos oito atributos respeita o potencial. Treinar um agente não o escala automaticamente. Não foram alteradas as fórmulas de treino do pacote anterior.

Confirmar um treino, pulá-lo explicitamente ou iniciar o confronto encerra a oportunidade daquele dia. O início da partida permite jogar sem ter treinado; a oportunidade ainda aberta é encerrada nesse momento. Uma partida concluída não libera um segundo treino no mesmo dia.

A interface mostra estado do treino, dia atual, próximo confronto, mapa, lado inicial e registros das sessões, com jogadores, foco, XP e alterações. As escolhas em edição continuam salvas sem consumir a sessão.

## Persistência e integridade

O calendário utiliza schema 4 e identificação `2.0.0-dev.calendar`. A versão publicada do Beta 1.3 não deve receber esses saves. A versão de desenvolvimento continua lendo arquivos dos schemas 2 e 3; os fluxos de laboratório anteriores ficam separados do novo ciclo. Iniciar um calendário sempre zera a evolução para o começo do ciclo, preservando históricos concluídos, em vez de converter XP antigo em vantagem competitiva.

Cada confronto recebe identificação e semente estáveis derivadas do ciclo. Recarregar ou importar preserva o resultado; não produz outro confronto ou sorteio. O histórico e o calendário registram o resultado de forma consistente, e a transação de IndexedDB conserva o controle contra abas desatualizadas.

Um registro diário permite reconstruir e conferir a evolução do jogador sem simular de novo os combates. Saves com dias duplicados, agenda alterada, XP incompatível com os treinos ou perfis adversários modificados são rejeitados. O treino diário não pode ser contornado pelo comando antigo de Nova partida. Essas verificações são integridade local, não autenticação, anticheat ou garantia de ranking.

## Validação executada

| Verificação | Resultado |
|---|---|
| Suíte automatizada completa | 137 testes aprovados, zero falhas |
| Testes específicos de calendário adicionados | 11 testes, com vários cenários internos |
| Ciclos completos da matriz | 6 ciclos de 28 dias |
| Confrontos da matriz | 42 partidas; 716 rodadas |
| Sessões de treino da matriz | 112 confirmações |
| Evolução adversária | Nenhuma; catálogo idêntico em todos os checkpoints |
| TypeScript e compilação | Aprovados |
| Exportação estática | Prefixo `/esports-manager`, assets, manifesto e worker conferidos |

Os testes específicos cobrem: calendário 4/8/12/16/20/24/28; quatro Doca e três Cume; distribuição 4/3 do lado inicial do jogador; catálogo de 35 atletas fixos; novas campanhas sem XP antigo; limite compartilhado entre coletivo e individual; confirmação e recarga; perda exata ao saltar dias; igualdade entre avanço diário e salto equivalente; bloqueio durante confronto; encerramento do treino ao começar a partida; nenhum treino após o resultado no mesmo dia; continuidade de checkpoints; histórico e resultados idempotentes; rejeição de saves inconsistentes; concorrência em IndexedDB; 28 treinos e sete confrontos até a conclusão da agenda.

A matriz usa dois elencos legais, três rotinas e uma semente por elenco, reaproveitada nas rotinas. O plano é execução rápida/contenção, e as compras seguem a política automática existente. No coletivo, o foco de atributo alterna pelos oito índices; no individual, alternam o foco e o titular escolhido. Na rotina de saltos, não há treinos. O hash do catálogo adversário foi conferido após cada checkpoint.

| Elenco | Rotina | Sessões | Partidas | Rodadas | Vitórias do jogador |
|---|---|---:|---:|---:|---:|
| Pingo, Cedro, Sutileza, Nimbo e Lume | Coletivo diário | 28 | 7 | 125 | 1 |
| Mesmo elenco | Individual diário | 28 | 7 | 127 | 1 |
| Mesmo elenco | Saltos, sem treino | 0 | 7 | 119 | 1 |
| Norte, Risco, Pingo, Nimbo e Cedro | Coletivo diário | 28 | 7 | 116 | 3 |
| Mesmo elenco | Individual diário | 28 | 7 | 114 | 3 |
| Mesmo elenco | Saltos, sem treino | 0 | 7 | 115 | 3 |

As vitórias iguais entre rotinas nesta amostra não significam que treinar seja inútil: os atributos e o XP mudaram, e os placares/rodadas também variaram. A amostra é de integridade e integração, com poucas sementes e um plano por equipe. Não demonstra equilíbrio global, impacto médio do treino ou dificuldade final do circuito. Nenhum atributo NPC foi reajustado em função desses resultados.

As evidências de navegador ficam em `validation/calendar/browser/results.json`, e os resultados completos em `validation/calendar/results.json`. A conferência utiliza Chromium desktop e viewport móvel, sem equivaler a homologação em Android físico ou Safari/iOS.

Os dois fluxos de navegador passaram em 1280 × 900 e 390 × 900: importação de arquivo anterior, início do calendário, treino individual, persistência após recarga, bloqueio de nova sessão, aviso de perda com cancelamento, parada no dia de jogo, adversário canônico fixo, checkpoint de rodada, partida automática, treino ainda encerrado após o resultado, avanço sem ganhar XP e histórico preservado. No desktop, também foi conferido o treino do dia 28 antes do último jogo, a conclusão dos sete confrontos e a recarga do encerramento. Não houve transbordamento horizontal da página, erro JavaScript ou asset ausente. A exportação no celular foi conferida pelo comando disponível na Visão geral.

## Limites e continuidade

Este pacote entrega calendário, treino diário, dados adversários fixos, os sete confrontos do jogador e persistência. A próxima etapa integra os demais jogos do circuito, classificação e desempates, despesas, contratos e premiação, preservando as definições já aprovadas. As políticas de variar planos e compras por identidade da equipe, a classificação completa e a curva de dificuldade ainda exigem avaliação no circuito integrado.

Não há lançamento público autorizado. O código e este relatório devem permanecer nos arquivos de desenvolvimento; a branch remota `main` continua preservada.

Referência das fichas: [NEXUS Beta 2.0 — Consolidação B20-01 a B20-03](https://docs.google.com/document/d/1hiVi2xghwSxubXpqk3bvOBvGWKEGDD0Y/edit). A regra de treino adversário desse documento foi substituída pela decisão explícita registrada no início deste relatório. Demais definições permanecem vigentes.

## Reprodução

Com Node 24 e dependências instaladas: `npm test`, `npm run typecheck`, `node scripts/calendar-validation.ts`, `PAGES_BASE_PATH=/esports-manager npm run build` e `PAGES_BASE_PATH=/esports-manager node scripts/check-export.ts`.

Os scripts `calendar-browser-fixtures.ts` e `calendar-browser.mjs` reproduzem o fluxo de interface em uma exportação local. O workflow `calendar-development.yml` está preparado para validar o pacote sem deploy quando a branch for enviada ao GitHub. Nenhuma execução remota desse workflow é reivindicada nesta entrega.
