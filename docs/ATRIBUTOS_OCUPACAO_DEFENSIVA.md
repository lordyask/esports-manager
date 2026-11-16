# Verificação focada dos atributos

Complemento ao [diagnóstico de ocupação defensiva](OCUPACAO_DEFENSIVA.md), na candidata 0.6.1 com política r5. Esta auditoria não altera pesos, fórmulas, mapa, tempos de travessia ou habilidades; não é uma calibração completa.

## Uso observado no motor

Os percentuais abaixo são pesos distintos, usados em contextos distintos. O índice geral dos oito atributos não é a pontuação de disparo.

O teste também acompanha um atributo treinado até o perfil da partida e o registro de equipamento do round. Os caminhos auditados estão em [combate](../src/combat.ts), [simulação](../src/simulation.ts) e [decisões](../src/ai.ts).

| Atributo | Disparo | Decisões e outros usos encontrados |
| --- | ---: | --- |
| Mira | 45% | Não entra na qualidade de decisão de utilitário verificada. |
| Movimentação | 15% | Não altera o tempo da travessia; habilidades e efeitos de velocidade são tratados separadamente. |
| Posicionamento | 25% | Peso de 25% na qualidade de entrada usada em certas decisões de habilidade. |
| Leitura | 15% | Peso de 20% na qualidade de entrada e 30% na de retomada; participa da seleção substituta de IGL e da chance de uma chamada de controle após informação. |
| Utilitários | 0% | Peso de 30% na qualidade de entrada e 25% na de retomada; essa qualidade é consultada na escolha de alguns utilitários, não em todos. |
| Comunicação | 0% | Peso de 25% nas duas qualidades, entra no intervalo previsto para nova decisão e na seleção substituta de IGL. |
| Disciplina | 0% | Peso de 20% na qualidade de retomada, entra no intervalo previsto para nova decisão e na seleção substituta de IGL. |
| Controle emocional | 0% | Peso de 15% na seleção substituta de IGL. Não foi encontrado outro uso direto no motor atual. |

O IGL designado e vivo tem prioridade; a classificação pelos atributos é usada como alternativa. A probabilidade de chamada usa Leitura do IGL e requer informação disponível. As qualidades de entrada e retomada podem receber modificador de entrosamento quando há ao menos dois integrantes vivos da equipe no mesmo setor, incluindo o próprio jogador. Nos tipos de habilidade auditados, a qualidade influencia a **decisão de usar** o utilitário, não uma segunda rolagem de sucesso depois de lançá-lo. Outros tipos seguem decisões diferentes e efeitos fixos.

O intervalo calculado para a próxima decisão muda com Comunicação e Disciplina, mas a IA verifica oportunidades em passos de 250 ms; diferenças pequenas no intervalo calculado podem ser absorvidas por essa resolução temporal.

A verificação direta de decisão com atributos 60 e condições de referência registrou 64,56 de qualidade de entrada e limiar de 64,56% para o utilitário testado. Com Utilitários 80, os valores foram 71,016 e 71,02%; com Comunicação 80, 69,94 e 69,94%. Na retomada testada, Utilitários 80 resultou em 69,94 e 69,94%. Essas verificações não mudam a política de retomada.

## Valores e ligação com o disparo

No controle, todos os oito atributos são 60, a familiaridade de agente é 85, a do mapa 50, moral 70 e fadiga 10. A média ponderada de combate é 60 e o multiplicador das condições é 1,076; a pontuação efetiva é **64,56**.

| Alteração individual, mantendo os demais valores | Média ponderada | Pontuação efetiva | Chance do primeiro disparo contra o controle |
| --- | ---: | ---: | ---: |
| Nenhuma | 60 | 64,56 | 50,00% |
| Mira de 60 para 80 | 69 | 74,244 | 54,84% |
| Posicionamento de 60 para 80 | 65 | 69,94 | 52,69% |
| Mira, Movimentação, Posicionamento e Leitura de 60 para 75 | 75 | 80,70 | 58,07% |
| Utilitários de 60 para 80 | 60 | 64,56 | 50,00% |

A ferramenta de diagnóstico observou o argumento realmente entregue ao gerador aleatório em **cada disparo** do duelo e comparou-o à probabilidade calculada a partir dos atributos, condições e pontuação de ambos os jogadores. Por exemplo, com Mira 80 contra o controle, o motor recebeu 5.484 e 4.516 pontos-base, respectivamente. Em outra prova isolada, um bônus de Posicionamento de 8 e uma limitação de 15% produziram 56,7052 de pontuação efetiva e 4.607 pontos-base para o disparo contra o controle. Essa observação não altera o gerador nem o resultado.

## Comparação pequena e pareada

Foram usados duelos sintéticos 1×1 no próprio resolvedor da Doca V2: os dois jogadores começam na mesma posição exposta de A ou B por configuração de teste, estão prontos e se veem, sem movimentação, efeitos, habilidades ou aliados locais. Os demais oito jogadores ficam nas bases, sem IA e sem linha de visão para o duelo. Ambos usam arma principal e proteção 50. A condição é artificial e isola os disparos; não representa uma entrada real nem uma rodada completa.

São oito sementes iniciais e oito adicionais, repetidas para ambos os pontos, identidades de equipe e lados. Foram executadas 576 variações de duelo curtas; as repetições de ponto e lado não são observações independentes. Na tabela, elas foram removidas da contagem: cada grupo tem oito sementes com a vantagem aplicada uma vez a A e uma vez a B. Vitórias são do **duelo**, não do round; eliminações simultâneas são registradas separadamente.

| Alteração | Sementes | Maior atributo vence | Menor atributo vence | Eliminação mútua |
| --- | --- | ---: | ---: | ---: |
| Mira +20 | iniciais | 12 | 3 | 1 |
| Mira +20 | adicionais | 9 | 6 | 1 |
| Posicionamento +20 | iniciais | 9 | 7 | 0 |
| Posicionamento +20 | adicionais | 8 | 7 | 1 |
| Quatro atributos de combate +15 | iniciais | 12 | 3 | 1 |
| Quatro atributos de combate +15 | adicionais | 11 | 3 | 2 |
| Utilitários +20, IA e habilidades desligadas | cada grupo | 8 | 8 | 0 |

As chances individuais crescem para atributos de combate maiores, mas o jogador inferior ainda vence em alguns duelos. A pequena amostra de resultados é incerta: por exemplo, nas sementes adicionais de Mira +20, a equipe A com vantagem venceu 6 vezes em 8, enquanto a B com vantagem venceu 3, perdeu 4 e teve uma eliminação mútua. Não se deve inferir uma taxa geral de vitória nem descartar viés de identificação a partir dessa amostra.

Com atributos iguais, A venceu 4 das oito sementes iniciais e 6 das oito adicionais. As probabilidades de disparo foram iguais; mudar exclusivamente ataque/defesa ou o ponto de A para B, mantendo o restante fixo, conservou a sequência e o resultado nesses controles. O ordenamento determinístico de eventos usa a identificação da equipe, de modo que a mesma semente não garante que participantes espelhados recebam os mesmos números aleatórios. A observação pequena não demonstrou um bônus por equipe, mas também não comprova ausência de viés estatístico em outros cenários. Na partida real, eliminações totais simultâneas seguem a regra existente para decidir o vencedor; o teste isolado acima não as atribui automaticamente a um lado.

## Lacuna e proposta para depois

**Movimentação é ignorada no cálculo da travessia** nesta versão, embora participe da pontuação de combate. Em um teste sem habilidades ou bloqueios, valores 1 e 100 percorreram a conexão da base defensora para a galeria no mesmo tempo de 1.500 ms. Isso é uma lacuna observável; a especificação disponível não determina como ou se esse atributo deve alterar a velocidade.

Como pacote separado, decidir primeiro o papel desejado de Movimentação. Se ele tiver de afetar travessia, propor uma regra explícita e limitada, medir tempos de chegada nos dois lados e testar as consequências em cenários pareados antes de adotá-la. Qualquer mudança nessa regra exige versionamento e tratamento da reprodução por semente. A verificação atual não a implementa.

Os arquivos por cenário estão em [`validation/attributes`](../validation/attributes). Para reproduzir com Node 24:

```bash
node test/attribute-influence.test.ts
node scripts/validate-attributes.ts
node scripts/validate-attributes.ts --holdout
```
