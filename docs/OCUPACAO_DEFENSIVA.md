# Ocupação defensiva antes do plantio

Registro da preparação do Beta 2.1 na branch de desenvolvimento. A comparação parte do commit `546fc03`, motor 0.6.1 e política `doca-v2-tactical-r4`; a candidata mantém o motor e usa a política `doca-v2-tactical-r5`. Não é uma validação de equilíbrio global.

## Diagnóstico

O modelo permite que o setor de cada ponto observe suas entradas principal, do meio e da galeria. Porém, as áreas `cover_a` e `cover_b` não observam nenhuma dessas entradas. Na política anterior, o segundo defensor designado a um ponto era enviado à respectiva cobertura mesmo sem contato ou informação. Assim, ele perdia a observação do acesso e a possibilidade de contestá-lo a partir daquela posição. A ordem do treinador continuava sendo respeitada quanto ao ponto, mas não quanto à ocupação útil das entradas.

Exemplo reproduzível, semente 7, equipe A atacando, controle com alvo inicial A e defesa 2 A / 2 B / 1 meio, sem habilidades:

- Os quatro defensores designados aos pontos chegam aos seus pontos em 13,5 s de tempo total; o segundo de cada ponto parte para a cobertura em 14,5 s e chega em 16 s. Sua equipe ainda não viu adversários. As três entradas de cada ponto estão fora da visão da cobertura.
- O primeiro contato acontece aos 18 s. A primeira eliminação acontece aos 21 s: o defensor do meio é eliminado pelo ataque. Um dos defensores de A na cobertura não dispara até o plantio; na candidata, o mesmo defensor permanece no ponto e começa a disparar aos 23,5 s. O IGL do ataque pode mudar o destino durante a rodada; neste exemplo, o plantio ocorre em B.
- O tempo inclui os 5 s de preparação. Com a correção, os defensores continuam chegando aos pontos em 13,5 s, mas nenhum dos dois faz a saída cega inicial para a cobertura.

Na execução rápida desta amostra, o primeiro contato ocorre aos 13 s, antes da chegada dos defensores ao ponto aos 13,5 s. A [análise pontual do contato e da recuperação](RECUPERACAO_EXECUCAO_RAPIDA.md) identifica a exposição, a janela de disparo e uma inconsistência independente em comandos diretos. Nenhum desses mecanismos foi alterado neste pacote.

## Correção

Antes do plantio, o segundo defensor só é enviado automaticamente à cobertura se ela permitir observar ao menos uma entrada do ponto. Como as duas coberturas atuais não satisfazem essa condição, ele mantém a posição designada. A decisão usa a geometria pública e as observações já disponíveis; não lê posições inimigas ocultas. Distribuições explícitas continuam válidas, inclusive cinco defensores em um único ponto. Não há preenchimento de pontos, teletransporte, bônus nem alterações no pós-plantio.

O modelo atual ainda representa os dois defensores no mesmo setor, sem posições independentes dentro dele. Outras rotações observadas após o contato ficam fora desta correção; o registro de informação antes de um movimento é amostrado a cada 250 ms, portanto não demonstra sozinho o que a IA sabia no instante exato de uma decisão posterior.

## Comparação pareada

Cada conjunto contém 16 rodadas sintéticas 5×5: duas sementes, equipes invertidas, alvos iniciais A/B e ataques rápido/controle. Há defesa 2–2–1, atributos e armamento iguais, proteção igual e habilidades desativadas para isolar a ocupação. O alvo inicial pode mudar por decisão do IGL. Os registros vão até a conclusão do primeiro plantio ou o fim do round; havia também limite de 60 s, que não foi alcançado nestes casos. As sementes repetidas entre cenários são correlacionadas.

| Plano / sementes | Medida | r4 antes | r5 depois |
| --- | --- | ---: | ---: |
| Controle / 7 e 19, 8 cenários | Saídas do ponto atribuído antes do primeiro contato, sem informação | 16 | 0 |
| Controle / 7 e 19, 8 cenários | Primeiras eliminações feitas pela defesa | 0 | 0 |
| Controle / 7 e 19, 8 cenários | Disparos / eliminações defensivas até a parada | 111 / 4 | 211 / 19 |
| Controle / 7 e 19, 8 cenários | Plantios concluídos | 8 | 7 |
| Controle / 83 e 97, 8 cenários adicionais | Saídas do ponto atribuído antes do primeiro contato, sem informação | 16 | 0 |
| Controle / 83 e 97, 8 cenários adicionais | Primeiras eliminações feitas pela defesa | 0 | 0 |
| Controle / 83 e 97, 8 cenários adicionais | Disparos / eliminações defensivas até a parada | 120 / 3 | 231 / 22 |
| Controle / 83 e 97, 8 cenários adicionais | Plantios concluídos | 8 | 5 |

Para o ataque rápido, nos mesmos conjuntos, houve respectivamente 2 e 0 primeiras eliminações defensivas em 8 cenários antes **e** depois. Os totais de disparos/eliminações defensivas até a parada também ficaram iguais: 132/13 e 92/3. Os números indicam que os defensores puderam contestar mais nas condições de controle ensaiadas; não determinam uma taxa de vitória ideal nem o equilíbrio de outras composições, armas ou habilidades.

Os dados individuais incluem chegada, saída, informações amostradas, visibilidade durante recuperação, primeiro disparo, eliminação, primeiro contato e plantio: [`validation/defensive-occupation`](../validation/defensive-occupation). Em eventos de eliminação, `actor` é a vítima e `target` o responsável.

Para reproduzir após instalar dependências com Node 24:

```bash
mkdir -p /tmp/nexus-defensive-baseline-r4
git archive 546fc03 src test/fixtures.ts package.json | tar -x -C /tmp/nexus-defensive-baseline-r4
NEXUS_DEFENSE_ENGINE_ROOT=/tmp/nexus-defensive-baseline-r4 NEXUS_DEFENSE_OUTPUT=/tmp/nexus-r4.json node scripts/validate-defensive-occupation.ts
NEXUS_DEFENSE_ENGINE_ROOT=/tmp/nexus-defensive-baseline-r4 NEXUS_DEFENSE_OUTPUT=/tmp/nexus-r4-extra.json node scripts/validate-defensive-occupation.ts --holdout
NEXUS_DEFENSE_OUTPUT=/tmp/nexus-r5.json node scripts/validate-defensive-occupation.ts
NEXUS_DEFENSE_OUTPUT=/tmp/nexus-r5-extra.json node scripts/validate-defensive-occupation.ts --holdout
```

## Compatibilidade e pendências

Saves e históricos 0.6.1 das revisões anteriores continuam aceitos. Uma partida 0.6.1 em andamento mantém suas políticas tática e de movimento até terminar, inclusive após salvar e recarregar, para preservar sua reprodução por semente. A próxima partida, do usuário ou entre NPCs, usa a tática r5 e a validação nova de prontidão do movimento. Carreira, treinos, caixa, resultados e histórico não são reiniciados ou recalculados. Saves de versões anteriores mantêm o tratamento já existente de consulta e exportação; recomenda-se guardar o JSON original antes de experimentar a candidata.

A capacidade do modelo de representar coberturas e ângulos distintos continua pendente de avaliação. Qualquer mudança em travessia, recuperação, mapa, habilidades, dano, economia ou retomada exige outro pacote e evidência própria.

A [verificação focada dos atributos](ATRIBUTOS_OCUPACAO_DEFENSIVA.md) examina separadamente o cálculo de disparos, decisões da IA e comparações pareadas, sem alterar as fórmulas.
