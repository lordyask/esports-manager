# NEXUS — Beta 2.1: Doca V2 e Arena Premium

Identificação do produto: `2.1.0`. Motor: `0.6.1`; regras: `nexus-2.0-doca-v2-r2`; save: schema 6. Os identificadores de mapa, conteúdo, política, movimento e sementes permanecem os mesmos da candidata Doca V2, para que sessões e resultados mantenham suas regras originais.

## O que mudou

- A Doca V2 é o único mapa ativo em novas partidas e circuitos, inclusive entre adversários. A planta usa bases centralizadas, três saídas atacantes, curvas no meio e galeria de rotação contínua. Movimento, visão e disparo são verificados por regras distintas.
- Cada round começa com cinco segundos simulados de preparação, além dos 100 segundos de ação. Os lados regulamentares se alternam antes das rodadas 7, 13 e 19. A economia só reinicia na troca da rodada 13; a prorrogação mantém suas regras.
- A política defensiva evita trocar uma posição útil por cobertura sem visão de entrada. Comandos diretos de movimento respeitam a prontidão, sem alterar a recuperação, as velocidades ou o dano.
- Compras e equipamentos efetivos, atributos e resultados são registrados. A Central de Comando Arena Premium mostra dados da carreira, com estados vazios e os controles existentes.

## Saves e recuperação

Antes de atualizar, exporte e guarde o JSON original. Saves dos motores 0.5.1 e anteriores e do motor 0.6.0 não continuam no motor novo. A recuperação preserva o arquivo e exige uma escolha antes de substituí-lo; o original pode ser consultado e exportado pelo Acervo. Não se recalculam resultados nem se migram automaticamente elenco, XP, caixa ou contratos. Saves compatíveis do motor 0.6.1 mantêm suas revisões de política e movimento. Consulte [as instruções completas](BETA_2_0_SAVES.md).

## Limitações conhecidas

A vantagem ofensiva observada e a coordenação das retomadas ainda precisam de avaliação. As amostras não comprovam equilíbrio global nem que o problema de Eco esteja definitivamente resolvido. Este lançamento não recalibra danos, preços ou pesos de atributos. O mapa é uma representação tática abstrata; a adaptação móvel não substitui a validação em aparelhos físicos e Safari/iOS.

## Verificação da candidata

Na integração local passaram os 28 arquivos da suíte `npm test`, `npm run typecheck`, a build estática com `/esports-manager`, as referências do manifesto, os 24 assets dos agentes e o pacote do worker de simulação. A suíte inclui o circuito completo, os sete adversários, geometrias, preparação, lados, economia, prontidão e compatibilidade mecânica.

No Chromium, a Central foi conferida em 1920×1080, 1366×768 e larguras móveis, com navegação, teclado, diálogos, assets e estados de carreira. Uma carreira sintética foi iniciada e treinada, uma partida foi concluída e os três resultados de NPCs foram salvos. Após recarga, o resultado permaneceu disponível. Um save sintético do motor 0.5.1 foi exportado sem alterações, o cancelamento foi conferido e o reinício explícito preservou os bytes originais no Acervo. Não foram feitas novas matrizes extensas de balanceamento.

Para reproduzir as verificações de navegador, com Playwright e Chromium instalados, gere os dados sintéticos com `node scripts/arena-command-fixtures.ts` e `node scripts/doca-v2-browser-fixtures.ts`, faça a build com `PAGES_BASE_PATH=/esports-manager` e execute `NEXUS_ARENA_OUTPUT=/tmp/nexus-arena node scripts/validate-arena-command.mjs` e `node scripts/validate-beta21-flow.mjs`. A checagem pós-publicação usa `node scripts/check-beta21-public.mjs` em um perfil temporário.

## Integração e reversão

A candidata reúne as frentes `codex/doca-v2-spatial` e `codex/arena-premium-command`, sobre a `main` anterior `61dc03d9d3af60d6fc85628d132782631560725b`, guardada como referência de reversão. A publicação usa o workflow de Pages a partir de `main`. A aplicação não registra service worker; o worker existente executa a simulação e não apaga dados de carreira. O cache normal do GitHub Pages pode manter a página anterior por alguns minutos; atualizar a página não exige apagar dados locais.
