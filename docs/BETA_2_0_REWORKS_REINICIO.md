# NEXUS — Beta 2.0: reworks e reinício de carreira

**Registro de implementação e validação — 13/11/2026 — v1.0.**

Status: implementado em desenvolvimento; lançamento público pendente. O usuário aprovou as fichas técnicas de Prisma/Bastião (FT01–FT04) e solicitou reiniciar carreira. Este pacote executa essa aprovação. Não altera os valores aprovados para compensar os resultados da amostra.

Branch: `development/beta-2.0-reworks-career-reset`. Base: `1207e16113a35ff8537bfbf8e8bdda9fd3f273ba`. Motor novo: **0.5.0**; regras: **nexus-2.0-reworks-r1**; salvamento: **schema 6**. Esta entrega não foi enviada ao GitHub nem publicada. A referência local de `main` continua no Beta 1.3 (`42cdbe6dd19dda0cf20c3c85814d3d35ea46e2fd`).

## 1. Reiniciar carreira

Ação acessível em **Preferências e dados → Reiniciar carreira**, também presente no rodapé. Abre confirmação própria, com três opções: exportar antes, cancelar ou confirmar. Cancelar/Escape antes da confirmação fecha o diálogo sem executar reinício. Durante o salvamento, os botões ficam desabilitados e Escape não fecha o diálogo.

| Ação | Carreira | Organização |
|---|---|---|
| Campeonato, calendário e resultados ativos | Reiniciados | Reiniciados |
| Elenco contratado, contratos e caixa atuais | Reiniciados | Reiniciados |
| Treinos, XP, familiaridades ganhas e atributos evoluídos | Reiniciados | Reiniciados |
| Partida ativa e preparação de compras/treino | Reiniciadas | Reiniciadas |
| Nome, sigla, cor e escudo | Mantidos | Redefinidos ao padrão |
| Histórico concluído | Preservado | Preservado |
| Cópia da campanha anterior no acervo | Preservada para consulta/exportação | Preservada para consulta/exportação |
| Preferências de navegação e redução de movimento | Mantidas | Mantidas |

O elenco volta a ser escolhido. Uma nova inscrição inicia o ciclo no dia 1, com novos contratos e caixa inicial; o saldo antigo não é transportado. Arquivar não paga prêmios novamente e não libera XP na carreira nova. Nova partida, próxima rodada, reiniciar carreira e reiniciar organização continuam sendo ações diferentes.

**Gravação:** o estado visível só é substituído depois da confirmação transacional no IndexedDB. Conflito com outra aba, erro de gravação ou limite de tamanho impede o reinício; o erro é mostrado no diálogo. Há uma trava contra pedidos simultâneos. O teste com revisão desatualizada confirmou que a carreira anterior continua salva.

O limite total permanece **64 MiB**. O acervo deduplica o mesmo arquivo pelo hash; não há exclusão automática de campanhas para abrir espaço. Se faltar espaço, exportar e remover explicitamente um arquivo do acervo é necessário antes de tentar novamente. O limite do histórico comum permanece 20 partidas. O snapshot também preserva o circuito anterior, inclusive a classificação derivável dos resultados e o extrato. Partidas interrompidas não ficam disponíveis para continuar a partir do acervo.

## 2. Prisma e Bastião

Prisma substitui **Véu** no catálogo ativo, mantendo oito agentes e 32 habilidades. O atleta **Prisma, J11**, é outra entidade: nome e ID preservados, agente principal Farol. Apenas os campos de preferência de agente do catálogo e dos adversários trocam Véu por Prisma. Atributos dos 35 atletas adversários continuam fixos.

Todos os efeitos usam setores e conexões existentes. Nenhuma colisão por pixel, cobertura física desenhada, teleporte, clone ou alteração de velocidade foi criada para os dois kits. Doca/Cume continuam com cinco setores e oito conexões; as coberturas desenhadas permanecem visuais.

| Agente | Habilidade | Efeito implementado | Duração ativa | Neutralização |
|---|---|---|---|---|
| Prisma | Plano Prismático | Uma conexão opaca para ambos; passagem livre; dispositivo no setor do usuário | 6 s | 1 s no dispositivo |
| Prisma | Desvio | Inimigo parado no setor recebe −8 pontos percentuais na chance de acerto | 6 s | Sem dispositivo |
| Prisma | Ângulo Morto | Uma conexão opaca só para observadores inimigos; dispositivo na outra ponta | 4 s | 1 s no dispositivo |
| Prisma | Câmara de Refração | Núcleo local, duas conexões explicitamente escolhidas, opacidade para ambos e −12 pontos percentuais no setor | 10 s | 1,5 s no núcleo |
| Bastião | Anteparo | Aliados parados; tiros da direção protegida; 60% e reserva de 60 pontos | 6 s | 1 s no dispositivo |
| Bastião | Interposição | Outro aliado vivo/parado no mesmo setor; 30% de tiros/explosões e reserva de 30 pontos | 5 s | Vínculo rompe ao mover, morrer ou sair do setor |
| Bastião | Rota Segura | Aliados em travessia na conexão, nos dois sentidos; 25% de tiros e reserva comum de 40 pontos | 12 s | 1 s no dispositivo |
| Bastião | Último Reduto | Aliados parados; duas conexões escolhidas; 50% e reserva única de 100 pontos | 10 s | 2 s no núcleo |

Habilidades comuns preparam por 0,5 s e consomem uma carga somente na conclusão válida. Custos existentes dos três slots: 300/400/700. Supremas exigem oito pontos, uma utilização por rodada, preparo de 1 s e aviso de 1 s antes do efeito. O contador de duração começa na ativação. É possível começar a neutralização durante o aviso; ela ainda exige a duração completa aprovada.

**Composição dos efeitos:** bloqueios ópticos se unem; um filtro aliado não atravessa outra fumaça. Penalidades de precisão usam o maior valor, sem soma, só no inimigo parado. A penalidade vem após os modificadores existentes, com chance final limitada a 10–90%, sem sorteio extra. Ao começar movimento, a penalidade deixa de valer imediatamente.

Proteção escolhe uma camada elegível de maior porcentagem nominal no começo do instante de dano; empates usam expiração e ordem determinística. Reservas limitadas são divididas proporcionalmente entre acertos simultâneos, em centésimos, com restos distribuídos deterministicamente. Uma reserva insuficiente não aciona outra camada no mesmo impacto. Em outro instante, uma camada ainda disponível pode ser usada. A interceptação ocorre antes do colete e da vida; não adiciona o antigo escudo temporário. Dano de zona não é coberto.

Neutralização exige inimigo no setor real do dispositivo e ocupa a ação, suspendendo disparos. Movimento, morte ou interrupção cancelam o progresso; dano normal por si só não cancela. Não gera eliminação nem pontos de suprema. Efeitos implantados persistem após a morte do dono, exceto Interposição. Todos acabam no fim da rodada.

A IA escolhe alvos e conexões usando a observação disponibilizada, sem consultar posições ocultas. A instrução de preservar recursos também vale para os slots novos. Logs em português mostram implantação, aviso, ativação, penalidade, dano interceptado, reserva esgotada, neutralização e encerramento.

**Visual:** cards oficiais aprovados de Prisma/Bastião integrados à aba Agentes como painéis expansíveis; os arquivos foram convertidos para WebP, preservando a arte e proporção. Regras e nomes também aparecem como texto acessível na interface. As artes dos outros seis agentes não foram integradas neste pacote.

## 3. Arquivos anteriores e acervo

Arquivos do motor 0.4.1, schemas 2/3/4/5, e a importação suportada do motor 0.3.0/schema 1 são preservados para consulta/exportação. Os 35 arquivos de implementação congelados do motor anterior foram comparados byte a byte com o commit-base; todos idênticos. Evidência: `validation/reworks/legacy-integrity.json`.

Na abertura de um progresso local anterior validado, apenas configuração é trazida: identidade e rascunho de escalação, com preferência Véu → Prisma. Desenvolvimento ganho, caixa, calendário e partida anterior ficam exclusivamente no acervo. Novas familiaridades partem do catálogo aprovado 85/65/45/10, sem transferência do XP antigo de Véu. É necessário confirmar a nova inscrição para começar o circuito atual.

A **importação manual de arquivo antigo** adiciona ao acervo e preserva a campanha atual. Importação de salvamento atual compatível avisa que substituirá o progresso. Registros antigos mantêm nomes de agentes/habilidades e resultados da época, inclusive Véu e Bastião anterior. Não são recalculados nem incorporados ao histórico competitivo novo. O acervo permite exportar os bytes originais e remover cada arquivo explicitamente, com confirmação. Arquivos inválidos de recuperação podem ser preservados como não validados, sem serem tratados como resultados válidos.

Save, sessões e resultados de circuito identificam motor, regras e hash mecânico. Arquivos de mecânica incompatível são rejeitados, mesmo com um digest do payload recalculado. O hash cobre catálogo, habilidades, mapas e versões das políticas de resolução/IA. Essa conferência identifica compatibilidade e integridade; não torna o navegador um servidor autoritativo contra adulteração.

## 4. Validação concluída

| Verificação | Resultado |
|---|---|
| Suíte completa | **182/182 testes passaram** |
| Reworks e reinício, testes dedicados | **33/33 passaram** |
| TypeScript | Sem erros |
| Build estático na raiz | Aprovado |
| Build estático com `/esports-manager` | Aprovado |
| Assets, manifesto e worker nas duas bases | Referências verificadas |
| Estados de componentes por renderização React estática | **14 estados**: 5 novos + 9 do circuito |
| Rodadas controladas com os reworks | **120**, Doca/Cume, ambos os lados, duas composições e atributos 45/60/75 |
| Repetição com entrada em ordem inversa | **120 resultados idênticos** |
| Comparação com o motor congelado | **120 rodadas**, mesmos perfis equivalentes/seeds/planos |
| Circuitos completos | **6**, dois elencos legais, três rotinas de treino |
| Jogos dos circuitos | **168**, totalizando **3.205 rodadas** |
| Atributos/catálogo dos NPCs | Hash preservado nos seis circuitos |
| Maior salvamento da matriz | **8.898.955 bytes**, abaixo de 64 MiB |

Os 182 testes incluem regressões congeladas antigas. Eles não representam 182 testes exclusivos dos kits novos. Os testes novos cobrem os oito slots, duração, consumo, alvos/conexões inválidos, bloqueio óptico, travessia, filtros, penalidade, vínculo, reservas, compartilhamento simultâneo, neutralização, morte, migração, acervo, reinício, persistência e compatibilidade. A lógica anterior de calendário e 1.3 continua testada na árvore congelada para leitura histórica.

Resultados dos circuitos desta amostra:

| Elenco | Rotina | Colocação | Vitórias–derrotas do usuário | Rodadas de todos os jogos |
|---|---|---|---|---|
| 1 | Sem treino | 5º | 3–4 | 520 |
| 1 | Coletivo | 6º | 3–4 | 533 |
| 1 | Individual | 3º | 5–2 | 538 |
| 2 | Sem treino | 5º | 3–4 | 528 |
| 2 | Coletivo | 5º | 3–4 | 562 |
| 2 | Individual | 3º | 4–3 | 524 |

As seis execuções usam seeds diferentes. A tabela confere integração e conclusão do circuito; não prova o efeito causal de uma modalidade de treino. Cada campanha fechou 28 jogos, sete confrontos do usuário, classificação consistente, quatro folhas salariais, quatro despesas operacionais e uma premiação. Também houve checkpoints/reimportação e preservação de um histórico comum já com 20 partidas.

## 5. Resultado de equilíbrio e limites

**Revisão de balanceamento pendente antes do lançamento.** No recorte com atributos iguais de 60, a defesa venceu **36 de 40 rodadas (90%)** com o motor novo, contra **27 de 40 (67,5%)** na comparação congelada. No conjunto total, os elencos não têm sempre atributos iguais; por isso o recorte de 60 é a referência mais útil desta amostra.

A comparação substitui Véu por Prisma e também altera Bastião e decisões de uso; não isola um único coeficiente. São rodadas com kit completo e suprema carregada, não uma taxa medida de todas as rodadas econômicas de um campeonato. Duas composições e cinco seeds por combinação não certificam equilíbrio global.

Próxima investigação: separar o impacto de Prisma, Bastião e das decisões da IA; ampliar seeds, comparar ataque/defesa com composições espelhadas e testar estados Eco/Semi/Forte. Primeiro corrigir eventual comportamento de uso/movimentação; se valores aprovados precisarem mudar, apresentar alteração concreta para decisão. Não aplicar nerfs silenciosos para melhorar a taxa da amostra.

**Conferência interativa pendente:** cliques dos menus, foco e teclado/Escape, download nativo, comportamento real do IndexedDB/worker no navegador, layout desktop/móvel e dispositivo Android. A renderização estática comprova os textos/estados gerados e a ausência de mutação pelos componentes; não valida CSS, navegação ou eventos reais. A prévia de navegador desta etapa não foi executada; o impedimento registrado anteriormente não foi contornado.

Não há homologação de Safari/iOS, acessibilidade completa ou balanceamento competitivo. Também falta integrar/conferir as demais artes aprovadas de agentes e revisar as outras pendências gerais do plano de fechamento. Este pacote não equivale ao aceite final de todo o Beta 2.0.

## 6. Código e reprodução

Com Node 24+ e dependências instaladas por `npm ci`:

```bash
npm test
npm run typecheck
node scripts/validate-reworks.ts
NEXUS_VALIDATION_DIRECTORY=validation/reworks/circuit NEXUS_CIRCUIT_FIXTURES=/tmp/nexus-reworks-circuit node scripts/validate-circuit.ts
NEXUS_VALIDATION_DIRECTORY=validation/reworks/circuit NEXUS_CIRCUIT_FIXTURES=/tmp/nexus-reworks-circuit node validation/circuit/check-panels.mjs
node validation/reworks/check-panels.mjs
npm run build
node scripts/check-export.ts
PAGES_BASE_PATH=/esports-manager npm run build
PAGES_BASE_PATH=/esports-manager node scripts/check-export.ts
```

Evidências: `validation/reworks/tests.tap`, `focused.tap`, `round-matrix.json`, `circuit/results.json`, `panels-results.json`, `circuit/panels-results.json`, logs de build e `legacy-integrity.json`. Arquivos `*-initial.tap` foram apenas diagnóstico durante o desenvolvimento e não compõem o aceite final.

O workflow novo valida a branch/PR sem etapa de publicação. Os gatilhos dos workflows antigos de mapas/calendário foram limitados às branches antigas para não executar fixtures de importação incompatíveis numa PR atual. Não houve execução remota do workflow nesta entrega.

## 7. GitHub e sequência

Compensa manter os incrementos em commits pequenos na branch de desenvolvimento e só atualizar `main` quando o conjunto estiver conferido. Versionar código aos poucos e lançar o Beta 2.0 de uma vez são decisões compatíveis. Publicar na branch usada pelo Pages pode acionar deploy; esta entrega fica como pacote de desenvolvimento, sem push/merge/deploy automático.

Próximo pacote recomendado: **revisão de equilíbrio dos reworks + conferência interativa dos fluxos de reinício/acervo**, seguido da revisão final das artes e das pendências gerais de lançamento. Reiniciar carreira já está implementado; não é mais uma tarefa apenas anotada.
