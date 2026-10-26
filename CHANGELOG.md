# Histórico de alterações — Esports Manager

## 26/10/2026 — Candidata Beta 1.1 RC1 para aprovação

- Motor 0.4.1 e revisão de regras identificada; sem merge ou publicação.
- Corrigidos perseguição da base pela defesa, plant na distração da finta e ordenação de eventos mistos que ainda dependia de IDs.
- Adicionados primeiro contato, trades e interrupções à revisão; detalhes de pacote incompleto e aviso sem Entry.
- Recuperação de checkpoint incompatível preserva o arquivo original e permite reinício explícito; importação real 0.3.0 verificada.
- L01: proposta de fogo durante travessia com intervalo dobrado. L02: proposta de três pares de prorrogação e empate. Ambas aguardam aprovação; preparadas na branch de revisão.
- 95 testes, 1.176 partidas finais e seis regressões específicas. Evidências e pendências em `docs/LANCAMENTO_BETA_1_1_RC1.md`. Android físico permanece pendente.


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
