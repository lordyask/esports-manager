# Beta 1.1 RC1 para decisão de lançamento

Atualizado em 26/10/2026. Motor 0.4.1, regras `gdd-1.3+b11-rc1`, save schema 2.
Branch `beta/1.1`, PR de revisão nº 1. **Não mesclado e não publicado.**

## Recomendação

A candidata pode ser submetida à aprovação para um lançamento experimental.
Os testes de código e os lotes finais não encontraram falhas de execução. Isso
não certifica equilíbrio competitivo nem todos os aparelhos. O teste em Android
físico permanece pendente; a publicação precisa reconhecer esse alcance.

Duas mudanças de regra foram preparadas para revisão e **não constituem decisões
aprovadas**: L01 e L02 abaixo. Elas só passam a integrar a especificação de produto
se o autor aprovar. O código está isolado da versão pública para permitir avaliar
a proposta concreta, com resultados reproduzíveis.

## Decisões solicitadas ao autor

| Código | Proposta concreta | Efeito e alcance |
| --- | --- | --- |
| L01 | Permitir atirar durante a travessia entre setores com o dobro do intervalo normal entre disparos. | O jogador deixa de ficar totalmente indefeso durante o deslocamento. Plant, desarme, uso de habilidade e destruição de dispositivo continuam bloqueando os tiros. Não muda dano, preços, atributos ou a fórmula de acerto. |
| L02 | No Beta 1.1, limitar a prorrogação a três pares de lados, encerrando em empate se a igualdade persistir na rodada 30. | Continua exigindo dois de vantagem ao final de um par para vencer. No empate não há vencedor inventado; o relatório fica salvo e a próxima partida libera uma sessão de treino. Substitui, somente se aprovada, a prorrogação ilimitada do formato anterior. |
| L03 | Autorizar publicar esta candidata como Beta experimental no GitHub Pages, após a aprovação de L01/L02, aceitando a pendência de Android físico. | Mesclar o PR nº 1 em `main` acionará o workflow de testes/build/deploy. A seguir, verificar o fluxo no celular e registrar os feedbacks. Sem essa autorização o site continua no Beta 1.0. |

Se o autor preferir homologar Android físico antes, manter a candidata sem
publicação. O teste de layout estreito disponível aqui não equivale a esse teste.

## Correções preparadas dentro do escopo aprovado

- Contenção, Retomada e Leitura deixam de abandonar os pontos para perseguir
  contatos observados na base atacante. Pressão avançada mantém sua iniciativa.
- A finta não planta acidentalmente no ponto usado como distração; o objetivo
  continua sendo o foco confirmado.
- Ordenação de eventos de jogador e área agora segue uma ordem consistente.
  O teste ampliado detectou que o comparador anterior podia mudar a ordem de
  tiros/explosões ao renomear IDs. A correção passou pela regressão de renomeação.
- Primeiro contato, trades, barreiras e interrupções ficam visíveis na revisão;
  o detalhe também descreve acertos e dano de área. As observações não afirmam
  uma causa isolada para a vitória.
- A economia discrimina pacote abaixo do pedido, proteção parcial e recursos
  preparados; mantém seleção por Eco/Semi/Forte, sem loja individual de itens.
- A preparação avisa quando não há Entry; não atribui essa função ao Second
  silenciosamente. A nota geral usa uma casa decimal.
- Ao encontrar um checkpoint incompatível ou danificado, a tela oferece exportar
  os bytes originais, importar outro arquivo ou reiniciar com confirmação. A
  revisão é preservada, evitando que o próprio reinício fique bloqueado por conflito.
- Importação real de 0.3.0 conferida: 15 rodadas e relatório antigo preservados,
  sem reexecução, partida ativa encerrada para migração e XP inicial zero.
- Treino, salários, potencial, familiaridade, preços e rendimentos aprovados
  permanecem os mesmos. A organização evoluída é preservada entre partidas.

## Testes finais

- **96 testes aprovados**, zero falhas. Arquivo `validation/beta11/rc1/tests.tap`.
- TypeScript e builds estáticos aprovados na raiz e em `/esports-manager`.
- Marca, manifesto e worker conferidos nos dois caminhos, incluindo o bundle do worker.
- A regressão de compras cobriu **1.215 combinações** de planos e saldos, com
  conservação de créditos, ausência de negativos e avisos coerentes com o kit.
- Regra de empate verificada, incluindo vitória por dois no último par e bloqueio
  de rodadas após o encerramento.
- Renomeação de IDs conferida em nove combinações de mapa/seed com tiros,
  explosões e áreas simultâneos, além da regressão já existente.

| Lote final com o formato proposto | Partidas | Maior partida | Erros | Empates |
| --- | ---: | ---: | ---: | ---: |
| Grade de planos principais | 384 | 30 | 0 | 26 |
| Novas seeds reservadas | 192 | 30 | 0 | 13 |
| Níveis 45/60/75 e diferenças entre equipes | 120 | 30 | 0 | 12 |
| Todas as 225 combinações válidas de planos/complementos em pares de lados | 450 | 30 | 0 | 29 |
| Ciclo integrado com treinamento e salvamento | 30 | 24 | 0 | 0 |
| Total dos lotes acima | 1.176 | 30 | 0 | 80 |

A grade principal mantém atributos 60, familiaridade 85 e duas composições
simétricas que cobrem os oito agentes. O lote ampliado inclui Second Entry e
compara equipes 45/45, 60/60, 75/75, 45/75 e 75/45. Nos 48 confrontos com diferença
45/75 a equipe superior venceu todos; isso não estabelece chance universal nem
prova que uma surpresa seja impossível.

A cobertura de complementos distribui mapas e seeds entre combinações: não é
um fatorial de toda combinação em todo mapa/nível. O ciclo de 30 jogos alterna
Mira e familiaridade com Estalo, confirma uma sessão por preparação, exporta e
recupera, preserva XP e verifica que o treino não reescreve o relatório anterior.
Não comprova o balanceamento de uma carreira longa ou de todos os focos de treino.

## Conferência da interface no Chrome local

Na exportação final em `/esports-manager`, foram conferidos:

- Importação real 0.3.0, relatório de 15 rodadas somente para consulta e treino com XP zero.
- Sequência da rodada 23 até a pausa na 24; kit de prorrogação fornecido, seletores manuais bloqueados com explicação e continuidade até vitória por dois.
- Recuperação do caso sintético empatado 15–15 em 30 rodadas; indicação EMPATE e nova sessão de treino disponível na próxima partida.
- Confirmação de treino, preparação preservada e início de nova partida.
- Compras mistas com sugestão automática de sequência marcada: a confirmação de uma rodada respeitou a escolha manual e registrou 4.600 créditos. Clique duplo avançou somente uma rodada.
- Edição de compra em iframe de 390 px, corpo útil de 375 px sem excesso de largura observado. Esse teste não emula um aparelho físico.
- Duas abas: avanço na primeira e gravação da antiga rejeitada, sem sobrescrever o progresso novo.
- Cronologia aberta pelo teclado, primeiro contato e resumo de derrota por desarme com fatos e gastos.
- Backup original 1.0 detectado na visão geral e exportado com bytes idênticos, sem gravar no banco antigo.
- Checkpoint sintético incompatível: original exportado com bytes idênticos, confirmação de reinício e recuperação sem bloqueio da revisão antiga.

Não foram testados Android físico, instalação de atalho, Safari/iOS ou acessibilidade completa. São limites declarados da candidata, não itens marcados como concluídos por testes automatizados.

## Equilíbrio e prorrogação

Percentual de rodadas vencidas pelo ataque. A comparação na mesma grade, sem
limite de prorrogação, isola o conjunto de mudanças do motor em relação à
implementação inicial 1.1; não isola cada correção individualmente.

| Mapa | Implementação inicial 0.4.0 sem limite | Candidata 0.4.1 sem limite | Candidata com L02 e novas seeds |
| --- | ---: | ---: | ---: |
| Pátio | 44,00% | 47,65% | 49,66% |
| Horizonte | 26,50% | 38,95% | 35,96% |
| Enlace | 9,24% | 43,27% | 42,05% |

Enlace melhorou nesta amostra. Horizonte ainda favorece a defesa; não declarar
paridade entre mapas. As rodadas de uma mesma partida não são amostras independentes,
e cada célula possui poucas seeds. Não foram impostos 50% de vitória ou um
multiplicador que escolhe o vencedor da rodada.

Os dois casos específicos de Enlace de **204 e 246 rodadas passaram a 23 e 22**,
mesmo sem limite. As quatro regressões históricas 1.0 de 24/128/92/50 passaram
a 21/24/23/23, também sem limite, conforme `legacy-regressions.json`.

O teste ampliado sem limite, porém, ainda encontrou **352 rodadas** com Finta +
preservação contra Leitura + reserva. Esse dado motivou a proposta explícita L02.
O limite não é apresentado como prova de correção de equilíbrio: ele limita a
duração e preserva o empate. Os dados sem limite estão em `rc1/uncapped/`.

Nos lotes finais, 80 de 1.176 partidas terminaram empatadas (6,8%). Esse custo de
formato deve ser aceito pelo autor; não significa uma taxa esperada para todos
os elencos ou estratégias reais.

## Compatibilidade e fontes

A visão geral oferece baixar o backup original do banco local 1.0, em leitura somente, antes de importar. Isso evita depender de uma exportação feita antes da atualização. Essa detecção foi direcionada ao Chrome e depende da API de listagem de bancos do navegador; arquivos JSON exportados continuam sendo o caminho portátil.

O save real de avaliação do Beta 1.0 foi usado em verificação local e não será
publicado no repositório. A importação preserva o relatório como retrato e inicia
XP zero. Concluir uma partida 1.0 antes de migrar continua recomendado se o autor
quiser terminá-la no motor antigo. O arquivo original permanece necessário.

Arquivos internos de ensaio 0.4.0 não são migrados silenciosamente. A candidata
identifica motor e revisão de regras; ao rejeitar um checkpoint local incompatível,
oferece sua exportação original e recuperação explícita.

O DOCX anexado `Esports_Manager_GDD_Etapas_01_a_06_v1(1).docx`, de 11/10/2026,
consolida a fase histórica de MOBA. Ele próprio determina prevalência das decisões
explícitas mais recentes. Suas regras de heróis, torres, níveis e itens não foram
reintroduzidas no Beta FPS.

## Execução e escopo de lançamento

Reproduzir: `npm test`, `npm run typecheck`, `npm run build`,
`node scripts/check-export.ts`, `node scripts/beta11-validation.ts`,
`node scripts/beta11-validation.ts --holdout` e
`node scripts/beta11-release-validation.ts`. Para a exportação em subcaminho,
usar `PAGES_BASE_PATH=/esports-manager` no build e na conferência de arquivos.

Os JSON finais registram o SHA-256 de todos os arquivos TypeScript de `src/` no
início do lote. O workflow de `beta/1.1` apenas testa e compila. A publicação em
`main` continua aguardando autorização. Beta 2.0 e novos conteúdos não entram
nesta candidata.
