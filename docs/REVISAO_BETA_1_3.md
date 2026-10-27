# Beta 1.3 — revisão técnica e decisões pendentes

Data: 27/10/2026. O autor determinou testar e revisar as pendências antes de fechar o conteúdo, sem lançamento. Esta revisão está na branch `review/beta-1.3`; não altera a aplicação pública, os preços, a dificuldade ou o motor. B13-03/04/05/06 continuam aprovados; B13-01/02 continuam adiados.

## Verificações executadas nesta revisão

| Verificação | Resultado | Limite da evidência |
| --- | --- | --- |
| Suíte atual `npm test` | 103 testes aprovados, zero falhas | Testa a versão atual; não homologa funcionalidades 1.3 ainda ausentes |
| TypeScript da aplicação | Aprovado | Verificação estática, não valida usabilidade |
| Build estático com caminho `/esports-manager` | Aprovado | Build local, sem deploy |
| Ícones, manifesto e pacote do Worker | Verificados; 20 pacotes JS encontrados | Não substitui teste de instalação em aparelho físico |
| Grade de treino coletivo existente | 384 combinações: 24 jogadores × 8 focos × 2 modos; 12 sessões por combinação, 4.608 sessões | Dados sintéticos; não executa o futuro treino individual. Sessões desbloqueadas no script para isolar evolução, sem alegar 4.608 partidas |
| Conservação de XP e isolamento do foco | Aprovados; XP antes + recebida = custo das evoluções + XP depois; confirmação duplicada rejeitada | Não estima o balanceamento da progressão individual 2× |
| Partidas sintéticas | 24 concluídas, sem erro: 3 mapas × 2 dificuldades × 2 códigos × 2 lados iniciais | Um elenco e planos fixos; não serve como taxa global de vitória ou homologação de equilíbrio |
| Limites das partidas sintéticas | Placar consistente, encerramento até 30 rodadas, créditos finais entre 0 e 12.000 | Não é auditoria independente de cada evento de combate |

Reprodução: `node scripts/beta13-audit.ts`. Saída: [baseline-audit.json](../validation/beta13/baseline-audit.json). O script verifica a base atual e registra limitações conhecidas; após corrigir essas limitações será necessário atualizar suas expectativas.

Os testes de hoje são sintéticos. Os resultados das duas partidas privadas e das 500 simulações da auditoria de 26/10 são evidência anterior, não foram reexecutados nem somados à amostra de hoje. Nenhum arquivo privado foi incluído nesta branch.

## Conteúdo já aprovado e dependências de implementação

| Frente | Implementação prevista | Verificação exigida antes de liberar |
| --- | --- | --- |
| B13-03: confirmação | Mostrar dificuldade e permitir continuar ou voltar à preparação; sem previsão de vitória | Cancelar não inicia sessão nem concede/consome treino adicional |
| B13-04: análise pós-partida | Fatores observados, números de suporte, pontos positivos e recomendações de ação/treino | Não confundir gasto com equipamento disponível; não atribuir derrota a um atributo apenas pelo K/D ou primeira morte; tratar empate e dados insuficientes |
| B13-05: coletivo ou individual | Uma oportunidade compartilhada; individual inicialmente com 2× XP para um titular | Atualizar recibos/validação e importação, preservar saves antigos; garantir XP apenas ao alvo e impedir confirmação dupla após recarga |
| B13-06: evolução visível | XP e previsão de sessões até +1 no foco escolhido | Considerar XP residual, potencial, modo e teto; ao atingir limite não prometer evolução |

Achado de compatibilidade: a validação atual exige cinco ganhos por recibo e limita cada ganho a 150 XP. Testes dirigidos confirmaram que um recibo com um jogador ou XP dobrada é rejeitado. Isso é correto para a versão atual, mas precisa de adaptação explícita para B13-05. Não basta adicionar um botão de treino individual.

A nova confirmação também não deve prometer editar livremente o elenco: a interface atual bloqueia trocas após usar/pular treino e depois da primeira partida. Deve respeitar essas regras e permitir revisar os campos ainda editáveis. Mudar a contratação/elenco persistente seria outra decisão.

## Propostas adicionais para decisão do autor

Estas propostas não estão aprovadas por constarem deste documento.

| Código | Tipo | Proposta e justificativa | Recomendação |
| --- | --- | --- | --- |
| R13-01 | Ajuste — M01 | Planejamento da compra automática: considerar guardar recursos para Forte em vez de repetir Semi indefinidamente. No teste de perdas, com todos eliminados e recursos consumidos, cada jogador chega a 3.900, gasta 3.000 e repete esse ciclo da rodada 3 à 10. Comparar políticas para ambos os times, sem mudar preços nem favorecer o usuário ocultamente. | Incluir investigação e uma candidata de política para revisão; não escolher “sempre Eco até Forte” sem comparar cenários |
| R13-02 | Ajuste — M04 | Separar “Nova partida” (novo código) de reprodução com código informado. O teste confirmou que `nextMatch` mantém o código anterior. Mudar somente o ID da sessão não muda o sorteio do motor. | Incluir; preservar reprodução explícita e registrar o código no relatório |
| R13-03 | Melhoria — M05 | Explicar o modo automático: se compras estão automáticas ou manuais, qual plano será repetido e por que a sequência para. A caixa de compras automáticas começa desligada e não está salva no workspace; o rótulo “Simular até o fim” não explica sozinho as pausas de fase. | Incluir resumo antes da sequência e persistência da preferência de compra; não criar adaptação automática de estratégias nesta proposta |
| R13-04 | Adição — H01/H02/H03 | Histórico local simples de partidas concluídas, consulta e exportação JSON/CSV por partida. Atualmente só a sessão atual e uma anterior são mantidas; a próxima substitui a anterior. | Opcional para 1.3, após o núcleo de partida/treino; definir retenção, tamanho, deduplicação e importação antes de implementar |

## Correção identificada na revisão

**R13-07 — lado real no relatório (dependência de B13-04).** `reviewRound` considera que A sempre começa atacando. Um teste com sessão válida iniciando B no ataque confirmou que o relatório mostra A como atacante. A interface atual sempre inicia A atacando, portanto esse achado não explica as derrotas dos arquivos enviados. Corrigir usando o lado inicial registrado e conferir regulamentação, troca de lados e prorrogação ao implementar a análise. Não requer alterar a vantagem de lados ou o motor para explicar o lado corretamente.

## Pendências que não devem ser transformadas automaticamente em conteúdo

- **M02 — dificuldades:** preservar 45/60/75 por enquanto. O autor aceita que o experiente seja difícil; uma sequência de derrotas não justifica reduzir atributos sem diagnóstico.
- **M03/M06 — funções, rotas e lados:** investigar de forma controlada se a explicação pós-partida revelar inconsistências, sem redesenhar todas as funções/mapas nesta aprovação. A grade de 24 partidas é teste de execução, não calibração suficiente.
- **H04 — estatísticas acumuladas:** adiar até definir o histórico e suas regras; não calcular agregados incompletos como se fossem toda a carreira.
- **Treino individual 2×:** é parâmetro inicial aprovado para teste. Comparar rapidez individual e ganho total da equipe, especialmente familiaridade baixa, custos de faixa e limites, antes de propor qualquer novo multiplicador.
- **Celular e recuperação:** verificar fluxo dos dois modos de treino, relatório em tela estreita, recarga, importação, duas abas e erro de armazenamento na candidata. Android físico permanece pendente; teste de código não o substitui.
- **Documentação histórica:** checklists 1.0 e primeiras validações 1.1 ainda mostram problemas posteriormente resolvidos pela RC1. Preservar como histórico; usar a versão/candidata correspondente para decidir bloqueios atuais, sem reabrir como novos os antigos casos de prorrogação ilimitada.

## Ordem recomendada

1. Decidir R13-01 a R13-04 e fechar o conteúdo do Beta 1.3.
2. Implementar B13-03/04/05/06 e a correção do lado em branch de trabalho, com os adicionais efetivamente aprovados.
3. Validar saves antigos, treino coletivo/individual, relatório factual e simulação manual/automática; comparar mudanças econômicas apenas se incluídas.
4. Apresentar uma candidata com resultados e pendências reais. O lançamento permanece proibido até autorização posterior explícita.
