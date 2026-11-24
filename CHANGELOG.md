# Histórico de alterações — Esports Manager

## 24/11/2026 — Beta 2.1.5 · Prévia de patrocínios do primeiro circuito

Depois da estreia no primeiro circuito, a Central apresenta duas propostas. Wynx Fibra paga 4.000 cr. na assinatura. Skx Periféricos paga 2.000 cr. na assinatura e mais 4.000 cr. se a organização terminar no Top 4. O contrato e os pagamentos podem ser consultados em Finanças.

## 23/11/2026 — NEXUS Beta 2.1.4

Na Preparação, os cinco titulares do próximo adversário aparecem primeiro, com país, função, agente, OVR e indicação do IGL. Os atributos detalhados ficam a um clique.

Em **Estratégias mais usadas**, selecione Ataque ou Defesa para consultar até três planos usados pelo clube nos confrontos já concluídos da carreira, inclusive entre NPCs. Cada round conta uma vez para o lado em que o adversário jogou.

## 23/11/2026 — NEXUS Beta 2.1.3

Na Doca V2, a ordem **Preservar jogadores** faz um atacante com menos de 35 de vida recuar um trecho em direção à base quando vê um adversário antes do plantio. Se a saída estiver bloqueada ou ocupada por um adversário visível, ele pode manter a posição e responder ao contato.

Novas partidas do treinador e dos NPCs usam a revisão tática r7. Partidas em andamento continuam com a revisão em que começaram.

## 22/11/2026 — NEXUS Beta 2.1.2

O progresso anterior do beta é zerado uma vez por navegador ou perfil, após a confirmação do jogador. A limpeza inclui carreira, elenco, treinos, partidas, históricos e Acervo local. As preferências da interface são preservadas.

## 22/11/2026 — NEXUS Beta 2.1.1

Na Doca V2, corrigimos uma decisão que fazia o atacante iniciar o plantio enquanto via um defensor se aproximando pela Ligação.

## 17/11/2026 — NEXUS Beta 2.1 · Doca V2 e Arena Premium

- Produto `2.1.0`, preservando motor 0.6.1, regras `nexus-2.0-doca-v2-r2`, revisões mecânicas e schema 6.
- Doca V2 para partidas e circuitos novos; preparação de cinco segundos e trocas de lado nos rounds 7, 13 e 19. O reinício econômico permanece no round 13.
- Correções de cobertura defensiva e prontidão de comandos de movimento. A Central de Comando Arena Premium usa dados reais da carreira.
- Saves incompatíveis podem ser preservados e exportados pelo Acervo mediante escolha explícita; não há migração automática de elenco, XP ou finanças.
- Vantagem ofensiva, coordenação das retomadas e a influência de Eco continuam em avaliação. Não há declaração de equilíbrio global.
- Referência de reversão da `main` anterior: `61dc03d9d3af60d6fc85628d132782631560725b`. [Notas e limitações](docs/BETA_2_1_NOTAS.md).

## 16/11/2026 — Prontidão dos comandos de movimento

- Na Doca V2, comandos diretos ou agendados não iniciam movimento antes de `readyAt`; espera e demais ações mantêm suas validações.
- A revisão mecânica distingue a correção. Partidas 0.6.1 já iniciadas mantêm a regra anterior até o fim; carreiras e históricos continuam disponíveis.

## 16/11/2026 — Ocupação defensiva pré-plantio

- A política r5 mantém o defensor no ponto atribuído quando a cobertura não permite observar suas entradas. A distribuição e o pós-plantio foram preservados.
- Carreiras 0.6.1 e históricos continuam ativos; partidas em andamento mantêm a política r4 até o fim. Diagnóstico e amostras em [ocupação defensiva](docs/OCUPACAO_DEFENSIVA.md).

## 16/11/2026 — Troca de lados a cada seis rodadas

- Motor 0.6.1: lados alternam antes das rodadas 7, 13 e 19; o reset econômico continua somente na rodada 13 e a prorrogação mantém as regras anteriores.
- Saves e históricos 0.6.0 são preservados para consulta e exportação com o motor da época; partidas antigas não são convertidas automaticamente.

## 15/11/2026 — Doca V2 em desenvolvimento

- Candidata não publicada: motor 0.6.0, mapa Doca V2, preparação de cinco segundos simulados e regras espaciais de movimento, visão e combate.
- Planos adaptados às rotas, distribuição defensiva configurável e Doca V2 em todas as partidas novas do circuito.
- Saves anteriores preservados para consulta e exportação, sem continuidade automática no motor novo.
- Preços e danos anteriores preservados. Amostras, limitações e experimento numérico não adotado em [Doca V2 e validação](docs/DOCA_V2_VALIDACAO.md).

## 14/11/2026 — NEXUS Beta 2.0

- Identificação do produto `2.0.0`, com motor 0.5.1, revisão mecânica `nexus-2.0-reworks-r1` e save schema 6.
- Identidade NEXUS e artes dos oito agentes; mapas Doca e Cume.
- Calendário de 28 dias, treinamento, circuito de oito equipes, classificação, contratos, finanças e premiação.
- Reworks de Prisma e Bastião, reinício de carreira e Acervo para arquivos de versões anteriores.
- [Notas da versão](docs/BETA_2_0_NOTAS.md), [orientações para saves](docs/BETA_2_0_SAVES.md) e [validação da candidata](docs/BETA_2_0_RC1_VALIDACAO.md).

## 12/11/2026 — Circuito e finanças em desenvolvimento

- Circuito de oito equipes, 28 jogos, classificação, desempates e encerramento.
- Vinte e um confrontos NPC com o motor real, políticas por clube e retomada pelos resultados pendentes.
- Caixa, inscrição, contratos anuais, salários proporcionais, operação, extrato e prêmio único.
- Schema 5 para novos circuitos; agendas anteriores preservadas sem cobrança retroativa.
- Nacionalidades dos 24 atletas iniciais e filtro por país; apresentação pré-jogo e resumo do circuito.
- Histórico comum cheio não bloqueia o registro competitivo. Sem push ou deploy nesta entrega.
- [Documentação e evidências](docs/BETA_2_0_CIRCUITO_FINANCAS.md).

## 29/10/2026 — Beta 1.3 publicado

- Autor aprovou o lançamento; rótulos oficiais Beta 1.3 e identificação de exportação 1.3.0. [Publicação concluída](https://github.com/lordyask/esports-manager/actions/runs/40809888123) e site público conferido.

- Histórico local até 20 partidas, migração das sessões disponíveis, relatórios, JSON/CSV, importação com deduplicação e exclusão explícita.
- Semente automática por nova partida, preservada ao continuar; confirmação de dificuldade.
- Análise factual pós-partida e correção do lado inicial no relatório.
- Treinamento individual 2× XP ou coletivo, oportunidade única, previsão de evolução e escolhas persistentes.
- Save schema 3 com leitura do schema 2; motor, combate, preços e dificuldades preservados.
- 113 testes locais, 9.159 sessões de treino e 72 partidas sintéticas; validação de interface desktop/móvel aprovada no workflow 40720519242, sem deploy. [Parecer](docs/BETA_1_3_RC1.md).

## 26/10/2026 — Beta 1.1.1 publicado: correções de treinamento

- T01–T05 aprovados pelo autor; [build e deploy concluídos](https://github.com/lordyask/esports-manager/actions/runs/40409964868). Código funcional: `130280f5e3eb0b87cb46a0dd801b8a314a59bf58`.
- Corrigido reset do foco, atributo e agentes ao sair da aba de treinamento. Escolhas salvas automaticamente no mesmo banco local e incluídas na exportação.
- Alternar os modos preserva tanto o atributo quanto os agentes individuais; trocar titulares remove somente as escolhas de quem saiu.
- Função, IGL, agente escalado e sua classe/familiaridade visíveis no treino; detalhes com os oito atributos e familiaridades atuais.
- Distinção entre agente escalado e agente treinado, estado das escolhas e resumo dos ganhos confirmados.
- XP, potencial, regras e motor 0.4.1 preservados. Compatível com arquivos schema 2 do Beta 1.1.
- 103 testes aprovados; TypeScript, builds estáticos e conferência dos dois modos no site público. Atributo e agentes persistiram após navegação e recarga; confirmação não se repetiu. Evidências em `docs/BETA_1_1_1.md`.

## 26/10/2026 — Beta 1.1 oficializado e publicado

- O autor aprovou L01, L02 e L03 e autorizou publicar pelo GitHub Pages.
- PR nº 1 integrado; [build e deploy concluídos](https://github.com/lordyask/esports-manager/actions/runs/40337769779). Site público conferido: Beta 1.1, motor 0.4.1 e catálogo de agentes.
- Código funcional publicado: `ac331be5745b7e18a1e90945a86431f712fc762b`.
- Fogo durante travessia com intervalo dobrado e até três pares de prorrogação, com empate se a igualdade persistir na rodada 30.
- Partida, estratégias por lado, compras individuais, revisão de rodadas, treinamento, catálogo de agentes e persistência entre partidas.
- Motor 0.4.1, regras `gdd-1.3+b11-rc1`, schema 2; identificadores preservados para compatibilidade.
- 96 testes aprovados, 1.176 partidas de validação e conferência no Chrome local. Android físico permanece pendente.
- Banco 1.0 preservado, com download do backup original e importação explícita da organização/relatório.


## 26/10/2026 — Candidata Beta 1.1 RC1 para aprovação

- Motor 0.4.1 e revisão de regras identificada; sem merge ou publicação.
- Corrigidos perseguição da base pela defesa, plant na distração da finta e ordenação de eventos mistos que ainda dependia de IDs.
- Adicionados primeiro contato, trades e interrupções à revisão; detalhes de pacote incompleto e aviso sem Entry.
- Recuperação de checkpoint incompatível preserva o arquivo original e permite reinício explícito; importação real 0.3.0 verificada.
- L01: proposta de fogo durante travessia com intervalo dobrado. L02: proposta de três pares de prorrogação e empate. Ambas aguardam aprovação; preparadas na branch de revisão.
- 96 testes, 1.176 partidas finais e seis regressões específicas. Evidências e pendências em `docs/LANCAMENTO_BETA_1_1_RC1.md`. Android físico permanece pendente.


## 25/10/2026 — Beta 1.1 implementado para revisão, sem lançamento

- B11-01 a B11-14 aprovados. Beta 1.x focado em partidas, treinamento e agentes; Beta 2.0 reservado à direção de novos conteúdos, sem escopo detalhado.
- Motor/pacote 0.4.0, save schema 2; banco local separado e importação explícita da organização 1.0 com relatório histórico.
- Intervalos manuais, compras individuais e sugestão editável, quatro planos por lado e complementos, tendências por responsabilidade e revisão factual por rodada.
- Treino coletivo de atributo ou agente, XP crescente por faixa, potencial e familiaridade persistentes; catálogo dos oito agentes existentes.
- Nova partida preserva a evolução. Reset da organização exige confirmação.
- Workflow da branch valida sem publicar. O Beta 1.0 público permanece preservado.
- Validação e bloqueios de lançamento em `docs/VALIDACAO_BETA_1_1.md`. Execução sem erros não demonstra equilíbrio; Enlace e prorrogações longas continuam pendentes.


## 25/10/2026 — Proposta do Beta 1.1 para aprovação

- Registrados feedbacks de informações, estratégias e compras entre rodadas.
- Formalizada a proposta de treinamento e catálogo de agentes em 14 itens,
  com regras e números identificados como ainda não aprovados.
- Atualizado o registro do projeto com a direção do autor e os pontos de decisão.
- Atualização apenas documental; sem implementação ou lançamento do Beta 1.1.

## 24/10/2026 — Consolidação documental do Beta 1.0

- Atualizados README, validação, checklist, publicação e identidade visual para
  refletir o Beta já publicado e as verificações posteriores à preparação do RC1.
- Criado `docs/REGISTRO_PROJETO.md` com decisões, entregas, evidências, limites
  conhecidos e situação de planejamento do Beta 1.1.
- Acrescentado aviso de contexto ao documento histórico do motor 0.2.0;
  preservadas as regras e os resultados daquela etapa.
- Separados testes automatizados, observações no navegador e auditoria de arquivo.
  Itens sem evidência suficiente permanecem pendentes.
- Nenhuma mudança em motor, dados, versões, regras econômicas, saves ou interface.
  Nenhum recurso ou lançamento do Beta 1.1 foi aprovado por esta atualização.

## Beta 1.0 — Atualização de identidade visual

Proposta 01 aprovada em 21/10/2026. Código publicado:
`9815c64305a13ec912c892a1f70ae6530dc2cc74`.

- Marca EM em SVG e assinaturas para fundos claros/escuros.
- Aplicação no menu e no rodapé; cor da marca independente da organização.
- Favicon SVG/ICO, ícones Android/iOS e manifesto de atalho com subcaminho do Pages.
- Build na raiz e no subcaminho conferido; testes e publicação remotos concluídos.

## Beta 1.0 — Publicação inicial

Pacote de origem RC1; motor 0.3.0; regras `gdd-1.3`; schema de save 1.
Código publicado: `d1932756e37aeae4419bfa8e435bbdc934ff9764`.

- Montagem de cinco jogadores entre 24 candidatos, teto salarial e identidade.
- Preparação de agentes, IGL, responsabilidades e estratégias.
- Partida por rodada em Web Worker, economia individual e adversários sintéticos.
- IndexedDB, exportação/importação, diagnóstico e relatório de desempenho.
- Workflow de testes, TypeScript, exportação estática e GitHub Pages.
- Publicação concluída após o autor ativar o Pages; marca adicionada posteriormente.

## Etapa anterior — Motor tático 0.2.0

- Integração de agentes/habilidades, movimentação, informação e IA ao 5v5.
- Mapas completos, economia, troca de lados e prorrogação.
- 62 testes e lote de 1.080 mapas daquela versão, com limitações de equilíbrio
  registradas. Esses resultados não substituem os lotes posteriores do 0.3.0.
