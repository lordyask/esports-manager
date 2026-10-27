# Beta 1.3 — escopo aprovado

Decisão de 27/10/2026. Registro de escopo; funcionalidades ainda não implementadas ou publicadas. A versão pública permanece Beta 1.1.1.

O autor aprovou somente B13-03, B13-04, B13-05 e B13-06, mantendo os demais pontos como estão. Solicitou uma análise após a partida que explique os fatores que contribuíram para a vitória ou derrota.

| Código | Decisão | Aplicação prevista |
| --- | --- | --- |
| B13-01 | Adiado | Não criar a nova análise pré-jogo do elenco e do confronto. Preservar a preparação existente. |
| B13-02 | Adiado | Não calcular nem exibir estimativa de vitória, simulações preditivas ou classificação de favoritismo. |
| B13-03 | Aprovado, com dependência ajustada | Confirmação simples antes de iniciar: mostrar dificuldade escolhida e permitir continuar ou voltar à preparação para revisar elenco e dificuldade. Sem percentual, aviso de favoritismo ou bloqueio por força do elenco. Esta adaptação concilia a aprovação do item com o adiamento de B13-01/02. |
| B13-04 | Aprovado e ampliado | Análise pós-partida com principais fatores observados, evidências e sugestões práticas. Até duas prioridades para a equipe e uma por jogador, quando houver evidência suficiente. |
| B13-05 | Aprovado | Escolher treino coletivo OU individual dentro da única oportunidade de treino antes de cada partida. Treino de atributo ou agente nos dois modos. |
| B13-06 | Aprovado | Mostrar valor atual, XP acumulada, ganho previsto e estimativa de sessões até a próxima evolução. |

## Análise pós-partida

- Mostrar dois ou três fatores relevantes quando os registros sustentarem essa quantidade; não completar a lista com causas inventadas.
- Relacionar cada conclusão a dados da própria partida: primeiras eliminações/mortes, trades, compras e equipamento efetivo, objetivos, lado e planos usados, atributos e familiaridades dos perfis daquela partida.
- Usar a formulação “fatores que contribuíram” quando não houver evidência para afirmar uma causa exclusiva. Uma morte inicial não comprova falta de mira, e uma derrota não comprova estratégia errada.
- Diferenciar ação recomendada de treinamento: revisar compras, função ou plano pode ser mais adequado que elevar um atributo. Não recomendar treino para mascarar uma possível limitação do motor.
- Exibir pontos positivos também nas derrotas e oportunidades de melhoria também nas vitórias. Empates devem receber o mesmo tipo de análise, sem inventar um vencedor.
- Recomendar atributo ou familiaridade apenas quando houver vínculo explicável com o perfil e os acontecimentos. Informar quando os dados forem insuficientes.
- Analisar a sessão concluída usando seus perfis e eventos registrados; treinos posteriores não devem alterar a explicação de uma partida anterior. Não exige implementar histórico completo de partidas.

Exemplo ilustrativo de linguagem, não resultado de teste: “Seu time perdeu muitas disputas de abertura e enfrentou equipamentos superiores em várias rodadas. Isso contribuiu para jogar em desvantagem. Revise a abertura e o planejamento de compras.” A interface deverá acompanhar afirmações assim com os números reais da sessão.

## Treinamento

- Coletivo: os cinco jogadores treinam o mesmo atributo, ou a familiaridade com o agente escolhido para cada um, com o ganho de XP vigente.
- Individual: um jogador treina um atributo ou agente; os demais não recebem XP nessa sessão. O multiplicador inicial aprovado para teste é 2× a XP normal, sujeito à validação de balanceamento; não significa dois pontos de atributo garantidos.
- Uma oportunidade compartilhada por partida, sem acumular sessões e sem permitir confirmar coletivo e individual para a mesma partida.
- Preservar regras atuais de potencial, custos progressivos, limites e XP excedente. O potencial aumenta a XP recebida na implementação vigente; não reduzir também o custo sem nova decisão.
- Preservar escolhas ao alternar abas, modos e recarregar, conforme a correção 1.1.1. Treinar um agente não altera automaticamente o agente escalado.
- Estimativa de sessões deve considerar XP já acumulada, custos e ganho do modo selecionado. Ao atingir um limite, informar o limite em vez de prometer evolução.

## Limites e validação

Aprovação do escopo não é registro de lançamento. Não alterar nesta decisão preços, dificuldades, motor de combate, compra automática, histórico completo, armas/coletes/habilidades selecionáveis ou conteúdo de carreira. H01–H04 e M01–M06 permanecem pendências próprias; a análise pós-partida não resolve automaticamente os problemas investigados.

Antes de apresentar a candidata para lançamento, verificar a fidelidade das explicações aos registros, ausência de probabilidades pré-jogo, consumo único da sessão nos dois modos, persistência das escolhas, compatibilidade dos saves, custos e limites da evolução e legibilidade no celular. As duas partidas automáticas já fornecidas podem servir de referência factual; testes sintéticos devem ser identificados separadamente. Não publicar arquivos privados de usuários.
