# Registro consolidado — Esports Manager

Atualizado em 28/10/2026. Este é o ponto de entrada para continuar o projeto.
O autor aprovou L01/L02/L03 e autorizou oficializar e publicar o Beta 1.1 em 26/10/2026. O deploy do Beta 1.1.1 foi concluído com sucesso; o site público e os dois modos de preparação de treino foram conferidos. Motor 0.4.1 preservado.

## Estado atual

Atualização mais recente: autor autorizou aplicar e testar histórico e sementes automáticas, além dos itens já aprovados. [Beta 1.3 RC1 implementada para validação](BETA_1_3_RC1.md) em `review/beta-1.3`, sem lançamento. Este estado substitui a indicação anterior de “somente documentação” para essa branch. Site público preservado em 1.1.1. A nova política de compra automática não foi incorporada.

Revisão de 27/10: o autor determinou não lançar e rever as pendências antes de fechar o Beta 1.3. [Revisão técnica e decisões pendentes](REVISAO_BETA_1_3.md): 103 testes atuais aprovados, 4.608 sessões sintéticas de treino e 24 partidas sintéticas, build local e verificações de exportação. Somente documentação e diagnóstico na branch `review/beta-1.3`, sem alterar a aplicação pública.

Próximo escopo: [Beta 1.3](BETA_1_3_ESCOPO.md), aprovado parcialmente em 27/10/2026: B13-03/04/05/06, com análise pós-partida e treino coletivo ou individual. B13-01/02 adiados; sem nova análise pré-jogo ou probabilidade de vitória. Registro de planejamento, sem implementação ou novo lançamento neste momento.

| Item | Registro confirmado |
| --- | --- |
| Aplicação pública | Beta 1.1.1 experimental, publicada em 26/10/2026 |
| Site | https://lordyask.github.io/esports-manager/ |
| Repositório | https://github.com/lordyask/esports-manager |
| Branch de publicação | `main` |
| Motor / pacote npm público | 0.4.1 |
| Branch de revisão | `beta/1.1`, integrada à `main` pelo PR nº 1 |
| Regras / formato de save | `gdd-1.3+b11-rc1` / schema 2 |
| Último código funcional publicado | `130280f5e3eb0b87cb46a0dd801b8a314a59bf58` |
| Hospedagem e persistência | GitHub Pages; progresso local em IndexedDB |
| Estado da atualização | Beta 1.1.1 publicada; T01–T05 aprovados, incluindo treino de atributos |

O autor compartilhou o Beta 1.0 com amigos e apresentou feedbacks sobre decisões
entre rodadas, informações limitadas, estratégias pouco variadas e dificuldade
para escolher compras. A documentação do Beta 1.0 foi consolidada antes desta etapa.
A proposta numerada B11-01 a B11-14 foi aprovada. Sua implementação foi integrada pelo PR nº 1 e publicada em `main`.

## Decisões e limites de escopo

O foco passou do conceito histórico de MOBA para gerenciamento de uma equipe de
FPS tático, com agentes e personagens fictícios. O documento antigo de etapas
01–06 e os catálogos de MOBA são históricos; não reintroduzir suas regras de
heróis, níveis ou draft/ban no Beta FPS sem decisão explícita do autor.

As decisões expressamente aprovadas e seus ajustes posteriores prevalecem sobre
recomendações, resultados de simulação e propostas ainda em discussão. A referência
de regras usada pelo motor atual é o GDD FPS Web 1.3.

Supabase e Vercel foram aprovados como direção para uma etapa futura. O autor
aprovou posteriormente executar o primeiro Beta pelo GitHub: Pages com exportação
estática e salvamento local, adiando contas, banco em nuvem e servidor autoritativo.
O Beta 1.0 valida principalmente o motor, as rodadas e o fluxo de uma partida;
a gestão completa da carreira ainda não foi desenvolvida.

## Desenvolvimento e entregas concluídas

### Motor e regras

- Motor tático 0.2.0: conexão de agentes, habilidades, movimentação, observação,
  decisões da IA, economia, troca de lados e prorrogação. O histórico dessa entrega
  está em [MOTOR_0_2_HISTORICO.md](MOTOR_0_2_HISTORICO.md).
- Motor 0.3.0: integração ao navegador, hash portátil, sessões com comandos e
  revisões, execução por rodada em Web Worker e integração ao fluxo do Beta.
- Cinco contra cinco; oito agentes fictícios, quatro classes e 32 habilidades.
- Três cenários abstratos: Pátio, Horizonte e Enlace. A simulação usa cinco setores
  e conexões, sem mapa visual, coordenadas ou ângulos físicos.
- Planos de ataque Execução rápida, Controle e leitura e Pressão dividida;
  defesa agressiva, equilibrada e de retomada; ponto inicial A/B.
- Vitória na regulamentação aos 13; troca de lados após 12 rodadas; prorrogação
  em pares de lados, exigindo dois de vantagem. A pausa automática após 30 rodadas
  por interação é proteção de execução, não limite do confronto ou vencedor forçado.
- Compras Eco/Semi/Forte, com referências do zero de até 1.000/3.000/6.000 por jogador,
  preservação de equipamento e ajuda após reservar a compra própria. Detalhamento
  visual de armas foi adiado por decisão do autor.
- Abertura de cada metade com 1.000 por jogador; limite de saldo de 12.000.
  Prorrogação fornece kit pela regra vigente. Créditos da rodada são separados
  do dinheiro de gestão da organização.

### Organização, elenco e preparação

- Personalização do nome, sigla, cor e escolha entre três escudos de organização.
- Catálogo aprovado de 24 jogadores fictícios; escolha de exatamente cinco,
  respeitando teto salarial mensal de 12.000. Saldo inicial de gestão de 30.000
  é informativo; salários não são descontados na partida isolada.
- Exibição de oito atributos, potencial, mental, aptidões táticas e afinidades.
  Potencial não altera a força atual nem gera evolução nesta versão.
- Cinco agentes distintos na equipe, afinidades 85/65/45/10 e avisos sobre classes
  ausentes, sem impor composição obrigatória das quatro classes.
- Funções aprovadas: IGL, Entry Fragger, Second Entry, Support, Anchor, Lurker e
  Main OP. IGL acumula uma responsabilidade e participa das chamadas de Controle;
  Main OP define a preparação interna de precisão. As demais funções ainda são
  indicações de escalação, sem políticas específicas completas na IA.
- Oponente sintético com oito atributos fixos em 45, 60 ou 75. Não são equipes
  definitivas de carreira ou dados do Valorant real.
- Condições iniciais de teste: moral 70, fadiga 10, familiaridade de mapa 50.

### Interface e dados locais

- Telas Visão geral, Elenco, Preparação, Partida e Relatório, em português.
- Economia exibida por jogador, gasto previsto/real e aviso de kit parcial.
- Rodada individual, sequência automática, ritmo normal/acelerado e pausa da
  sequência. Essa pausa não é uma pausa tática com efeito na moral.
- Relatório com eliminações, mortes, primeiras eliminações/mortes registradas,
  trades, utilitários concluídos, plants, desarmes e gastos.
- Progresso confirmado em IndexedDB antes do avanço, com revisão global para
  impedir sobrescrita por uma aba desatualizada. Um progresso ativo por origem.
- Exportação/importação JSON com conferência de formato, versão, estrutura e
  integridade, além de exportação de diagnóstico. Não há migração automática
  entre motores incompatíveis ou autenticação de resultados locais.

### Publicação e identidade visual

- Publicação inicial no repositório indicado pelo autor, commit
  `d1932756e37aeae4419bfa8e435bbdc934ff9764`.
- O primeiro workflow parou com o Pages desativado. O autor ativou a opção
  GitHub Actions; a segunda tentativa concluiu build e deploy com sucesso.
- Em 21/10/2026, a proposta visual 01 da marca EM foi aprovada pelo autor.
- Símbolo reproduzido em SVG, assinaturas horizontal e vertical, versão para
  fundo claro, aplicação no menu e rodapé, favicon SVG/ICO, ícones Android/iOS e
  manifesto com caminhos compatíveis com o Pages. Marca do produto independente
  da cor e do escudo da equipe do jogador.
- Atualização da marca publicada no commit
  `9815c64305a13ec912c892a1f70ae6530dc2cc74`, com workflow concluído com sucesso.
- Ícones e manifesto preparados; instalação de atalhos em aparelhos físicos
  ainda não exercitada. Não foi implementado funcionamento offline.

## Validação realizada e limites da evidência

Os 76 testes automatizados, a verificação TypeScript e os builds estáticos
passaram. Os workflows públicos confirmam a publicação inicial e a da marca.
As verificações abaixo são evidências do desenvolvimento do Beta 1.0, não uma
nova execução de testes motivada por esta atualização documental.

| Evidência | Resultado e alcance |
| --- | --- |
| Lote exploratório final do motor 0.3.0 | 1.080 mapas, zero erros de execução |
| Lote adicional com novas seeds | 270 mapas, zero erros de execução |
| Soma das rodadas nesses lotes | 29.693 |
| Habilidades | 32 exercitadas em testes dirigidos; 20 usadas naturalmente na composição fixa desses lotes |
| Chrome do ambiente de verificação | Elenco, preparação, rodada, sequência até o fim, relatório, recarga e recuperação do progresso |
| Partida desse navegador | Pátio, atributos 60, salário 7.500, placar 4–13 em 17 rodadas |
| Salvamento e diagnóstico de avaliação | Mesma partida, Pátio, atributos 45, salário 9.300, placar 13–2 em 15 rodadas |
| Reprodução do salvamento | As 15 rodadas, compras, perfis e estado final coincidiram exatamente |
| Auditoria financeira independente | Saldos e gastos conferiram; sem negativos; teto de 12.000 e reset para 1.000 na rodada 13 respeitados |
| Marca no site | Imagens carregadas, sem excesso de largura na janela observada; referências de favicon e manifesto conferidas |

A exportação de Chrome Android comprova a existência daquele progresso e permite
sua auditoria. Não substitui teste visual de todos os controles do celular. O
checklist completo, incluindo importação, duas abas, falha de armazenamento,
acessibilidade e outros navegadores, permanece parcialmente pendente.

O diagnóstico avaliado não registrava erro. As dez primeiras mortes de um
jogador definido como Second Entry foram destacadas como sinal para investigação.
A influência dos IDs e a ausência de políticas completas por função podem
contribuir; essa causalidade não foi isolada. Uma partida 13–2 contra atributos
45 não demonstra equilíbrio ou superioridade geral de uma estratégia.

Os arquivos brutos de avaliação e seus metadados permanecem fora do repositório
público. Este registro conserva apenas o resumo necessário à continuidade.

## Limitações da versão pública 1.0 (histórico; não descrevem toda a branch 1.1)

1. IDs ainda participam do desempate de alvos, distribuição inicial e algumas
   ordens de processamento; possível viés de comportamento continua sem correção.
2. Entry/Second/Support/Anchor/Lurker ainda não têm todas as políticas próprias.
3. Equilíbrio não validado: no lote final, taxa de ataque de 75,6% no Pátio,
   60,9% no Horizonte e 22,2% no Enlace. Na comparação com mesmas condições,
   Enlace caiu de 45,4% no motor 0.2.0 para 22,8% no 0.3.0. Os desenhos de lote
   são diferentes; não comparar diretamente a tabela do lote antigo variável.
4. As quatro regressões antigas de prorrogação melhoraram, mas duas ainda
   chegaram a 128 e 92 rodadas. Não há limite artificial de vitória.
5. Treinamento, evolução, moral entre partidas, calendário, campeonatos, folha
   salarial em operação e carreira completa ainda não estão integrados.
6. Pausa tática com efeito na moral, contas e salvamento em nuvem não implementados.
7. Migração de saves entre versões incompatíveis não implementada. Resultados
   locais não são adequados para rankings autenticados.
8. Compatibilidade completa de celulares, atalhos instalados, outros navegadores
   e todos os casos de persistência ainda precisa ser verificada.

## Transição para o Beta 1.1

O autor orientou organizar a próxima versão sem lançá-la. Os feedbacks apresentados
priorizam informação/intervalo, estratégias e compras. Depois definiu a direção de
separar estratégias pelo lado atual e acrescentar treinamento e aba de agentes.

A proposta detalhada está em [BETA_1_1_PROPOSTA.md](BETA_1_1_PROPOSTA.md), revisão 0.1,
com códigos B11-01 a B11-14. Ela substitui o agrupamento preliminar de sete frentes.
Os 14 itens foram aprovados pelo autor em 25/10/2026. As tabelas de XP, potencial, familiaridade, sessão coletiva e compatibilidade compõem a especificação aprovada para o Beta 1.1; ainda não estão na versão pública 1.0.

A sessão coletiva, os quatro planos por lado e o uso de XP determinístico são
recomendações do assistente. O autor aprovou sua implementação, mantendo o lançamento para autorização posterior. O Beta 1.0 permanece com
motor 0.3.0 e sem treinamento integrado. O núcleo antigo de ganho de até 0,1 está
isolado; a evolução integrada desta branch usa o novo modelo de XP aprovado.

A organização persistente entre partidas foi implementada como suporte ao treino;
calendário, campeonatos e carreira financeira continuam fora do escopo proposto.
Moral dinâmica e migração para Supabase/Vercel também não entram automaticamente.

## Documentos de continuidade

- [README](../README.md): apresentação, execução e limites atuais.
- [Validação do Beta](../VALIDACAO_BETA.md): resultados, método, evidências e ressalvas.
- [Checklist manual](CHECKLIST_BETA.md): itens exercitados e pendentes, por tipo de evidência.
- [Publicação](PUBLICAR_GITHUB.md): situação atual e manutenção do site.
- [Identidade visual](IDENTIDADE_VISUAL.md): marca aprovada e arquivos finais.
- [Changelog](../CHANGELOG.md): histórico resumido das entregas.
- [Proposta do Beta 1.1](BETA_1_1_PROPOSTA.md): itens numerados e regras aprovados.
- [Motor 0.2.0](MOTOR_0_2_HISTORICO.md): referência histórica, não instrução da versão atual.

## Direção de versões aprovada em 25/10/2026

- Beta 1.x: foco em partida, estratégias, economia das rodadas, treinamento e agentes, com correções e refinamentos.
- Beta 2.0: direção futura de novas adições de conteúdo e ajustes de balanceamento, sem lista de recursos definida.
- Implementação do Beta 1.1 na branch `beta/1.1`; o site público 1.0 permanece preservado até nova autorização.

## Implementação 1.1 para revisão

- Implementação inicial 0.4.0; a revisão RC1 usa 0.4.1. Schema 2 e banco IndexedDB separado do Beta 1.0.
- Intervalo manual, compras individuais, estratégias por lado e complementos, cronologia e revisão factual.
- Tendências por responsabilidade e desempates táticos independentes do nome/ID do jogador.
- Treino coletivo único por partida, XP por atributo/agente, catálogo, persistência entre partidas e importação assistida de organização antiga.
- Os dados brutos de testes de usuários continuam fora do repositório; os lotes publicados são sintéticos.
- O [relatório de validação 1.1](VALIDACAO_BETA_1_1.md) registra testes, navegação, limitações e pendências de liberação.
- Estado inicial de 25/10: Enlace favorecia muito a defesa e havia partidas de até 246 rodadas. Esse registro histórico foi revisto nos lotes da candidata RC1; não declarar o motor balanceado.
- Revisão de 26/10: 96 testes, 1.176 partidas finais e propostas L01/L02 preparadas. A matriz foi ampliada para atributos e complementos; Android físico continua pendente. Consulte o parecer atual.
- Estado histórico anterior à aprovação de lançamento: `main` e o site público permaneciam no Beta 1.0. A aprovação posterior e a publicação estão registradas abaixo.

## Candidata RC1 de 26/10/2026 (histórico anterior à aprovação)

- Regras da candidata identificadas como `gdd-1.3+b11-rc1`; publicação não autorizada.
- Correções de IA, ordenação de eventos, cronologia, compras e recuperação de arquivos. Importação real de 0.3.0 com relatório de 15 rodadas conferida.
- Enlace: ataque passou de 9,24% a 43,27% na mesma grade sem limite. No lote ampliado sem limite houve caso de 352 rodadas; não ocultar esse resultado.
- L01 e L02 são propostas para aprovação, preparadas somente na branch. L03 autoriza mesclar/publicar como Beta experimental e reconhece a pendência de Android físico.
- [Parecer para lançamento](LANCAMENTO_BETA_1_1_RC1.md): resultado atual, números, limites e decisões solicitadas. O DOCX MOBA anexado foi lido como histórico, com precedência das decisões FPS mais recentes.

## Oficialização autorizada em 26/10/2026

O autor declarou: “Eu aprovo e pode oficializar e publicar a Atualização Beta 1.1”. Essa decisão aprova L01/L02/L03 e substitui as restrições de lançamento da etapa de revisão descrita acima. O formato aprovado tem fogo durante travessia com intervalo dobrado e até três pares de prorrogação, com empate na rodada 30 se a igualdade persistir.

O lançamento é experimental; Android físico permanece pendente. A atualização preserva o banco 1.0 e oferece exportar o arquivo original. Não há alteração de execução do motor nesta oficialização; permanecem válidos os 96 testes e as 1.176 partidas documentadas.

## Publicação confirmada em 26/10/2026

- PR nº 1 integrado à `main`; código funcional publicado: `ac331be5745b7e18a1e90945a86431f712fc762b`.
- [Workflow de publicação](https://github.com/lordyask/esports-manager/actions/runs/40337769779) concluído com sucesso, incluindo build e deploy.
- Endereço verificado no navegador: https://lordyask.github.io/esports-manager/ . Título e interface mostram Beta 1.1; rodapé confirma motor 0.4.1. Navegação e catálogo de oito agentes conferidos no site público.
- Esta conferência de publicação não substitui os testes funcionais já documentados nem a homologação em Android físico, que permanece pendente.
- Registro posterior somente documental, com `[skip ci]`; sem mudança no código funcional publicado.

## Correção Beta 1.1.1 autorizada em 26/10/2026

O autor aprovou T01–T05, solicitou verificar os mesmos erros no treino de atributos e autorizou deixar a correção publicada. Ambos os modos usavam estado local descartado ao trocar de aba. A atualização preserva as escolhas no workspace/IndexedDB, apresenta contexto e detalhes dos jogadores e separa agente escalado de agente treinado. [Registro da correção](BETA_1_1_1.md). Motor, XP, potencial e schema preservados. Publicação confirmada conforme registro abaixo.

## Beta 1.1.1 publicado e conferido em 26/10/2026

Código funcional: `130280f5e3eb0b87cb46a0dd801b8a314a59bf58`. [Workflow](https://github.com/lordyask/esports-manager/actions/runs/40409964868) com build e deploy concluídos com sucesso. 103 testes aprovados, TypeScript e builds estáticos na raiz e no caminho do Pages.

Conferência no Chrome do site público: save criado no Beta 1.1 abriu no 1.1.1; Disciplina preservada após navegar por Agentes e recarregar; Farol para Drift e Bruma para Pingo preservados após consultar Elenco e recarregar; alternar modos preservou ambas as escolhas. Drift permaneceu escalado com Estalo. Detalhes mostraram oito atributos e oito familiaridades atuais. Confirmação de Disciplina seguida de recarga manteve 108 XP de Drift e removeu a opção de confirmar de novo. Dados sintéticos de QA. Android físico permanece sem homologação.

O registro posterior é somente documental, com `[skip ci]`, sem mudança na aplicação publicada.

## Pendências reunidas após o Beta 1.1.1 — 26/10/2026

O autor decidiu deixar o histórico de partidas para a próxima atualização e reunir novos feedbacks antes da revisão conjunta. H01–H04 (histórico, relatórios por partida, exportação JSON/CSV e estatísticas acumuladas) estão no [registro de pendências](PENDENCIAS_PROXIMA_ATUALIZACAO.md). Nenhuma implementação ou novo lançamento foi autorizado nesta decisão. O autor informou que tem partidas para análise; os novos arquivos ainda não foram recebidos neste momento.
