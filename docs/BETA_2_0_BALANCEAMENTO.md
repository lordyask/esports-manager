# NEXUS — Balanceamento dos reworks: revisão e correções de IA

**13/11/2026 · v1.0 · Desenvolvimento sem publicação.**

## Parecer

Foram corrigidos dois comportamentos da IA que interferiam na avaliação dos reworks: vários aliados paravam para neutralizar o mesmo dispositivo e Pulso podia escolher interromper um deslocamento, ação que o motor não permite interromper. **Nenhum coeficiente aprovado de Prisma ou Bastião foi alterado.**

A amostra ampliada não sustenta um nerf geral dos dois agentes neste momento: a vantagem defensiva também existe em cenários com as habilidades de ambos desativadas, e os resultados variam muito com a formação e o plano. Depois das correções, equipes espelhadas com Entry e Second tiveram execução ofensiva melhor, inclusive em sementes separadas. A formação com Lurker no lugar de Second continua muito frágil e, no recorte Forte, regrediu na amostra. **O equilíbrio global e a liberação para lançamento continuam pendentes.**

Este pacote conclui diagnóstico, correções verificáveis, comparação antes/depois e regressão. Ele não declara o jogo inteiro balanceado nem oculta o recorte desfavorável. A próxima investigação de combate deve abordar a coordenação ofensiva entre papéis/planos, antes de decidir sobre alterações numéricas nas habilidades.

Branch: `development/beta-2.0-reworks-balance`. Base: `f7c7b0840613afabf2737076bde2223fd7b8fd81`. Motor novo: **0.5.1**. Regras de habilidades: `nexus-2.0-reworks-r1`, preservadas; política de IA: `tactical-r3`, identificada no hash mecânico. GitHub/main e o Beta 1.3 público não foram alterados nesta etapa.

## 1. O que foi investigado

A amostra anterior de 40 rodadas com atributos iguais mostrou 90% de vitórias da defesa. Ela usava kit completo, supremas carregadas e perfis sem funções táticas. Era um teste de integração/estresse; não uma reprodução da distribuição de compras, pontos de suprema ou elencos do campeonato.

A bateria nova separou:

- Doca e Cume; mesmas equipes dos dois lados, atributos 60, afinidades/condições iguais.
- Quatro planos de ataque: rápido, controle, dividido e finta.
- Duas formações: Entry/Support/Second/Support/Anchor; e Entry/Support/Lurker/Support/Anchor.
- Dois conjuntos de agentes espelhados: Estalo/Farol/Trava/Prisma/Bastião e Ímpeto/Pulso/Bruma/Prisma/Bastião.
- Compras reais pelo mesmo `quoteBuy` do jogo: Eco com 1.000 créditos, Semi com 3.000 e Forte com 6.000. O teste normal começa com zero pontos de suprema; Forte com oito pontos fica separado como estresse.
- Quatro condições de análise: kits de Prisma/Bastião desligados, apenas Prisma habilitada, apenas Bastião habilitado, ambos habilitados. Desligar significa remover cargas/pontos dos dois lados, sem substituir o perfil/agente. Não é uma opção implementada no produto.
- Lados iniciais A e B pareados, com as mesmas sementes e planos.

A exploração usou 12 sementes por combinação, a partir de 10001, com passo 7919; defesa de contenção. A conferência separada usou três sementes por combinação, a partir de 2000003, e as quatro defesas: contenção, leitura, pressão avançada e retomada. Essa segunda amostra não orientou os dois ajustes descritos abaixo; foi aplicada depois de sua implementação.

São **27.648 rodadas experimentais**, contando execuções antes e depois, mais **864 rodadas de diagnóstico de funções**: **28.512 rodadas no total da bateria**. Isso não significa 28.512 sementes distintas. Não inclui os testes unitários, os dois rastreamentos ilustrativos nem as partidas da matriz de circuitos.

## 2. Correções implementadas

### Uma neutralização por dispositivo

Antes, a IA verificava apenas se havia dispositivo inimigo no setor e ausência de inimigo local. Não consultava se outro aliado já estava neutralizando aquele dispositivo. Como todos recebiam essa informação, vários integrantes podiam suspender disparos ao mesmo tempo para a mesma tarefa.

Agora a observação de aliados informa **qual dispositivo** está sendo neutralizado. Um novo pedido só é feito para um dispositivo ainda sem responsável vivo. Os demais seguem suas decisões de combate e deslocamento. Dispositivos diferentes ainda podem receber responsáveis diferentes. Se o responsável morrer ou for interrompido, a tarefa volta a ficar disponível.

No rastreamento controlado da semente 10001, ataque rápido em Doca, aos 1,5 s: **cinco aliados neutralizavam o mesmo dispositivo antes; um depois**. É um exemplo específico que reproduz o problema; não uma alegação de que isso acontecia em toda rodada.

A correção mantém exigências de posição, duração, bloqueio de disparos durante a ação, cancelamento e vida útil dos dispositivos. Não revela dados inimigos ocultos nem cria uma regra que favorece apenas o usuário. A mesma IA é usada pelos dois lados e nos jogos entre NPCs.

### Pulso e ações interrompíveis

A observação passou a identificar deslocamento como `move` na integração anterior. Pulso tratava qualquer ação observada como candidata a Interferência, mas o motor exige uma ação de execução, não movimento. Isso podia produzir tentativas inválidas e atrasar decisões seguintes.

Agora Pulso seleciona apenas `cast`, `plant`, `defuse` ou `destroy`. O teste confirma que ele não tenta interromper movimento e que ainda interrompe um plant válido, consumindo exatamente uma carga. A correção pertence à compatibilidade das habilidades com a observação e o motor; não altera os parâmetros de Pulso.

## 3. Valores e conteúdo preservados

Comparação de bytes confirmou ausência de mudanças em:

- `src/abilities.ts`: as 32 habilidades, incluindo todos os valores aprovados dos reworks.
- `src/rework-effects.ts`: elegibilidade, porcentagens, capacidades, seleção de camada e divisão simultânea.
- `src/maps.ts`: geometria abstrata e tempos dos mapas.
- `src/economy.ts`: compras, preços, equipamento e pontos de suprema.
- `data/catalog.json` e `data/opponents.json`: atributos, afinidades, nomes, salários e preferências de agentes.

Duração, reserva, dano, neutralização, custos, chances e deslocamentos não foram ajustados para perseguir uma taxa de 50%. Adversários continuam sem treinos, atributos adaptativos ou bônus ocultos. Cobertura desenhada nos mapas permanece visual.

## 4. Resultados pareados

A tabela apresenta **vitórias do ataque**, somando ambos os rótulos de equipe e mantendo a mesma configuração/semente antes e depois. Cada linha usa os dois agentes com habilidades habilitadas. Forte normal não começa com supremas disponíveis.

| Formação e amostra | Compra | Rodadas em cada versão | Ataque antes | Ataque depois | Rodadas com plant antes → depois |
|---|---|---:|---:|---:|---:|
| Com Entry e Second — exploração | Eco | 384 | 56,25% | 56,25% | 123 → 123 |
| Com Entry e Second — exploração | Semi | 384 | 60,94% | 60,94% | 132 → 132 |
| Com Entry e Second — exploração | Forte | 384 | 45,57% | 55,99% | 123 → 139 |
| Com Entry e Second — exploração | Forte + supremas | 384 | 38,54% | 42,97% | 127 → 138 |
| Com Entry e Second — sementes separadas | Eco | 384 | 50,52% | 50,52% | 110 → 110 |
| Com Entry e Second — sementes separadas | Semi | 384 | 50,00% | 50,00% | 127 → 127 |
| Com Entry e Second — sementes separadas | Forte | 384 | 40,63% | 47,92% | 114 → 128 |
| Com Entry e Second — sementes separadas | Forte + supremas | 384 | 41,41% | 45,05% | 147 → 156 |
| Com Lurker no lugar de Second — exploração | Eco | 384 | 18,23% | 18,23% | 32 → 32 |
| Com Lurker no lugar de Second — exploração | Semi | 384 | 19,79% | 19,79% | 15 → 15 |
| Com Lurker no lugar de Second — exploração | Forte | 384 | 19,01% | 15,10% | 36 → 17 |
| Com Lurker no lugar de Second — exploração | Forte + supremas | 384 | 16,15% | 20,31% | 83 → 88 |

Na conferência com sementes separadas e todas as defesas, Forte passou de **156/384 (40,63%)** para **184/384 (47,92%)**. Dentre os pares, 43 passaram de derrota para vitória do ataque e 15 fizeram o caminho contrário. Forte com supremas passou de **159/384 (41,41%)** para **173/384 (45,05%)**. Eco/Semi ficaram idênticos entre versões nessa amostra; não foram ajustados para acompanhar a melhora.

Não se deve comparar diretamente os 90% de defesa da amostra anterior com esta tabela: os cenários são diferentes. As comparações válidas de antes/depois estão pareadas dentro de cada linha, como 40,63% → 47,92%.

### Sensibilidade às funções e planos

Com Lurker no lugar de Second, Forte caiu de **73/384 (19,01%)** para **58/384 (15,10%)** de vitória do ataque; houve 27 pares que melhoraram e 42 que pioraram. Esse resultado desfavorável permanece registrado. Não é correto selecionar apenas os recortes positivos para liberar a candidata.

As duas formações contêm os mesmos agentes/atributos em cada comparação, mas mudam o papel tático do terceiro atleta. Isso confirma sensibilidade da execução às funções usadas nesta amostra; não demonstra que toda composição sem Second terá essa taxa nem que Second precisa virar obrigação de escalação. A formação também é diferente entre as duas linhas, portanto não se isola um coeficiente de habilidade ao compará-las.

A investigação seguinte deve examinar o acompanhamento da entrada, suporte, timings e plano de rotação quando há Lurker. Não substituir essa análise por aumento de atributos, teleporte, vitória forçada ou nerf arbitrário. Se for necessário mudar os valores aprovados, apresentar a proposta com evidências e impactos antes de implementá-la.

### Leitura sobre os reworks

Na formação inicial com Lurker, antes da correção, desligar os dois kits ainda resultava em apenas 52/384 vitórias do ataque em Forte; com ambos habilitados eram 73/384. Os reworks não explicam sozinhos a fragilidade ofensiva. Esses testes desativam kits completos, mudam decisões e o consumo dos fluxos aleatórios; não estimam o efeito isolado de cada porcentagem ou ponto de reserva.

As habilidades permanecem aprovadas e implementadas; o parecer atual é **manter os valores enquanto se revisa a coordenação ofensiva**, não declarar equilíbrio universal dos agentes.

## 5. Compatibilidade e registros anteriores

A revisão de IA faz parte da identificação mecânica de uma partida. Para evitar que um circuito ou confronto antigo passe a usar uma política diferente no meio, o motor 0.5.0 foi preservado para leitura em `legacy/v0_5_0`.

Arquivos 0.5.0, inclusive os que já contêm acervo, são validados pelas regras originais, preservados como consulta e exportação e não continuam sob a IA nova. Os arquivos embutidos também ficam acessíveis separadamente, deduplicados por hash; o arquivo completo original permanece disponível. A abertura traz somente configuração/identidade para uma nova campanha, sem transferência de evolução ou dinheiro. A importação manual antiga adiciona ao acervo e mantém a campanha atual.

A leitura 0.4.1 e a importação suportada 0.3.0 continuam preservadas. O limite total de 64 MiB é respeitado: se a conversão exceder o limite, o original fica em recuperação para exportação, sem descarte silencioso. O teste de compatibilidade inclui histórico concluído 0.5.0, arquivo original, acervo embutido, rejeição de mecânica incompatível e rejeição de aninhamento adicional.

O snapshot anterior contém 38 arquivos de implementação. Somente os três caminhos de importação de `lib/archive.ts` foram realocados para a pasta irmã 0.4.1. Os hashes originais e os resultantes estão em `validation/balance/prior-engine-integrity.json`.

## 6. Conferências técnicas

| Verificação | Resultado |
|---|---|
| Suíte completa | **190/190 testes passaram** |
| Novos testes dedicados de IA e compatibilidade | **8/8 passaram** |
| Bateria comparativa/diagnóstica | **28.512 rodadas** |
| Circuitos completos | **6**, com dois elencos e três rotinas de treino |
| Jogos da matriz de circuitos | **168**, totalizando **3.221 rodadas** |
| Classificação, caixa, folhas, despesas e premiação | Totais e fechamento conferidos |
| NPCs | Catálogo/atributos preservados |
| Maior save da matriz | **8.893.781 bytes**, abaixo de 64 MiB |
| TypeScript | Sem erros |
| Builds estáticos | Raiz e `/esports-manager` aprovados |
| Assets, manifesto e worker | Referências conferidas nas duas bases |
| Componentes por renderização React estática | 9 estados do circuito e 5 de reinício/acervo/agentes |
| Navegador e Android físico | Não executados nesta etapa; continuam pendentes |

Os 190 testes incluem a regressão congelada e os testes anteriores; não são 190 testes exclusivos de balanceamento. Os seis circuitos usam seeds diferentes entre rotinas de treino, portanto não demonstram superioridade causal de uma rotina. A bateria de rodadas sintéticas não substitui a distribuição econômica e tática de partidas completas.

A conferência estática de componentes não executa cliques, foco, teclado, download nativo ou armazenamento real em aparelhos. A restrição anterior da prévia não foi contornada. Esta etapa não fez modificações visuais nas artes ou menus.

## 7. Evidências e reprodução

Principais arquivos:

- `validation/balance/comparison.json`: pareamento, mudanças de resultado, recortes e limites.
- `validation/balance/exploration/` e `grouped-before/`: versões anteriores das formações com Lurker e Second.
- `validation/balance/spread-after/` e `grouped-after/`: as mesmas combinações sob a IA corrigida.
- `validation/balance/holdout-before/` e `holdout-after/`: sementes separadas, quatro defesas.
- `validation/balance/trace-before.json` / `trace-after.json`: exemplo de neutralização redundante.
- `validation/balance/tests.tap`, `focused.tap`, `circuit/results.json`, logs de build e hashes do snapshot.

Com Node 24+ e `npm ci`, executar:

```bash
npm test
npm run typecheck
NEXUS_BALANCE_ENGINE=before NEXUS_BALANCE_FORMATION=grouped NEXUS_BALANCE_DIRECTORY=validation/balance/grouped-before node scripts/balance-reworks.ts
NEXUS_BALANCE_FORMATION=grouped NEXUS_BALANCE_DIRECTORY=validation/balance/grouped-after node scripts/balance-reworks.ts
NEXUS_BALANCE_ENGINE=before NEXUS_BALANCE_FORMATION=spread NEXUS_BALANCE_DIRECTORY=validation/balance/exploration node scripts/balance-reworks.ts
NEXUS_BALANCE_FORMATION=spread NEXUS_BALANCE_DIRECTORY=validation/balance/spread-after node scripts/balance-reworks.ts
NEXUS_BALANCE_ENGINE=before NEXUS_BALANCE_FORMATION=grouped NEXUS_BALANCE_DEFENSE=all NEXUS_BALANCE_MASKS=both NEXUS_BALANCE_SEEDS=3 NEXUS_BALANCE_OFFSET=2000003 NEXUS_BALANCE_DIRECTORY=validation/balance/holdout-before node scripts/balance-reworks.ts
NEXUS_BALANCE_FORMATION=grouped NEXUS_BALANCE_DEFENSE=all NEXUS_BALANCE_MASKS=both NEXUS_BALANCE_SEEDS=3 NEXUS_BALANCE_OFFSET=2000003 NEXUS_BALANCE_DIRECTORY=validation/balance/holdout-after node scripts/balance-reworks.ts
NEXUS_TRACE_TAG=before node scripts/trace-balance.ts
NEXUS_TRACE_TAG=after node scripts/trace-balance.ts
node scripts/balance-summary.ts
NEXUS_VALIDATION_DIRECTORY=validation/balance/circuit NEXUS_CIRCUIT_FIXTURES=/tmp/nexus-balance-circuit node scripts/validate-circuit.ts
npm run build
node scripts/check-export.ts
PAGES_BASE_PATH=/esports-manager npm run build
PAGES_BASE_PATH=/esports-manager node scripts/check-export.ts
```

O workflow desta branch reproduz as comparações e verificações sem tarefa de deploy. Não foi enviado nem executado no GitHub nesta entrega. O pacote contém código-fonte e evidências; a versão pública permanece no Beta 1.3.

## 8. Pendências para a candidata

1. Revisar a execução ofensiva das formações/planos vulneráveis, especialmente a troca de Second por Lurker; retestar quaisquer novas mudanças com sementes separadas e sem perseguir uma taxa forçada.
2. Integrar as seis artes de agentes ainda pendentes e conferir sua apresentação.
3. Validar a interface e o fluxo real em computador e Android, incluindo importação, acervo e reinício.
4. Fechar a identificação pública, notas e candidata; só então publicar e conferir o endereço público.

Não houve lançamento nem alteração silenciosa de parâmetros aprovados. O ganho demonstrado neste pacote é a remoção de decisões inválidas/redundantes da IA e uma avaliação mais representativa, com resultados positivos e negativos documentados.
