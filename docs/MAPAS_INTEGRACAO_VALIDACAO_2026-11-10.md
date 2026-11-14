# NEXUS — Integração e validação de Doca e Cume

Registro de 10/11/2026 · Pacote de desenvolvimento do Beta 2.0 · Sem lançamento público

## Resultado e localização do trabalho

Doca e Cume foram integrados e testados em uma cópia local do repositório `lordyask/esports-manager`, na branch `development/beta-2.0-map-integration`, criada a partir de `42cdbe6dd19dda0cf20c3c85814d3d35ea46e2fd` (Beta 1.3).

A implementação, a suíte de regressão, a amostra de partidas, a compilação e os fluxos de navegador passaram. O resultado autoriza continuar o desenvolvimento; não certifica equilíbrio global nem constitui lançamento do Beta 2.0 completo. Não houve envio de código para o GitHub, alteração da branch remota `main`, merge, release ou publicação no Pages nesta execução.

O pacote de código que acompanha este relatório contém a versão testada e pode ser enviado posteriormente a uma branch de desenvolvimento. A branch existe localmente; não deve ser confundida com uma branch já disponível no GitHub.

## Definições implementadas

A aprovação expressa de Yask nesta etapa confirma os dois mapas. O documento anterior “Doca aprovada / Cume proposta” é referência dos parâmetros; seu status antigo de Cume foi superado pela aprovação posterior. A arte final de Cume usada é a revisão com bloco técnico, barreira em L e caixas no centro.

| Setor | Doca | Cume |
|---|---|---|
| attack | Base Sul | Base Sul |
| defense | Base Norte | Base Norte |
| A | Armazém | Observatório |
| mid | Pátio de Carga | Passagem Central |
| B | Atracadouro | Estabilizador |

| Conexão bidirecional | Doca | Cume |
|---|---:|---:|
| attack ↔ A | 12 s | 16 s |
| attack ↔ B | 12 s | 16 s |
| attack ↔ mid | 8 s | 8 s |
| mid ↔ A | 6 s | 6 s |
| mid ↔ B | 6 s | 6 s |
| defense ↔ A | 7 s | 9 s |
| defense ↔ B | 7 s | 9 s |
| defense ↔ mid | 9 s | 8 s |

São cinco setores, oito conexões bidirecionais e um nível funcional. Não existe ligação direta A–B ou attack–defense. As equipes alternam de lado conforme as regras existentes.

As coberturas continuam visuais. A imagem não introduz colisões, cobertura individual, altura, neve, vento ou linha de visão geométrica. Os tempos são custos das conexões antes de efeitos de habilidades.

Doca conserva o perfil de Pátio: alcance curto fora do meio e médio no meio. Cume conserva o de Enlace: alcance médio. Preservar apenas os tempos, deixando Doca cair no alcance médio padrão, mudaria o combate; esse risco foi evitado e coberto por teste de equivalência com os mapas anteriores.

Uma consequência confirmada: em Doca o acesso attack → A direto custa 12 s, contra 14 s pelo meio; em Cume o direto custa 16 s, contra 14 s pelo meio. O algoritmo continua calculando rotas pelos setores.

## Interface e persistência

Os mapas aparecem na seleção do cenário. Doca é a opção inicial para novas organizações nesta versão de desenvolvimento. Pátio, Horizonte e Enlace continuam cadastrados para preservar históricos, importações e usos anteriores.

A preparação exibe a arte e permite selecionar os cinco setores para consultar suas conexões. A análise pós-rodada e o relatório histórico exibem os dez jogadores agrupados pelo setor registrado ao término da rodada. A seleção de outra rodada atualiza os indicadores. A1–A5 representam a equipe do usuário; B1–B5, o adversário; × identifica eliminados. A lista textual permite consultar os nomes em telas pequenas.

Os indicadores são posições finais por setor, não animação contínua nem coordenadas físicas. Durante uma travessia interrompida pelo fim da rodada, o motor conserva o setor de saída; a interface informa isso. As regiões clicáveis e as posições dos marcadores não alteram o grafo.

A cronologia usa os nomes das áreas dos mapas. A interface identifica a cópia como `BETA 2.0 · DEV`; a migração integral de branding da aplicação não faz parte deste pacote.

Os validadores de organização, partida e importação aceitam os dois novos IDs. Arquivos com mapas novos recebem o rótulo `2.0.0-dev.maps`. Mantiveram-se o schema 3, o motor 0.4.1 e as regras anteriores porque o pacote cadastra mapas com os perfis existentes, sem alterar suas fórmulas. O Beta 1.3 publicado não conhece os novos IDs e não deve receber esses saves. A versão de desenvolvimento continua lendo os IDs antigos. Os testes locais e de navegador usaram dados sintéticos e ambiente separado do site publicado.

## Evidências executadas

| Verificação | Resultado |
|---|---|
| Base antes das mudanças | 113 testes aprovados |
| Suíte após integração | 126 testes aprovados; zero falhas |
| Testes específicos adicionados | 13 testes, com casos internos para conexões, lados e pontos |
| TypeScript | `npm run typecheck` aprovado |
| Compilação | Exportação estática compilada com `/esports-manager` |
| Arquivos de publicação | Assets, manifesto e worker conferidos com o mesmo prefixo |
| Amostra no motor real | 384 partidas completas; 6.541 rodadas; zero falhas de execução |
| Navegador | Doca e Cume em Chromium, 1280 × 900 e 390 × 900; quatro cenários aprovados |

Os testes específicos verificaram: todos os pares de setores alcançáveis; simetria e custos das oito conexões; deslocamento nas duas direções; rejeição de atalhos inexistentes; isolamento por bloqueios; interrupção de travessia por Barreira; duração do Arranque; plant e desarme em A e B com os dois lados atacando; reprodução por semente; independência da ordem dos perfis; equivalência de resultados com Pátio/Enlace; continuidade entre passos e recargas; exportação/importação do histórico; transação de salvamento em IndexedDB; manutenção dos IDs antigos e rejeição de IDs inválidos.

Os quatro cenários de navegador verificaram: carregamento da arte com o prefixo do Pages, seleção de área por teclado, dez marcadores após a rodada, rodada manual, recarga do checkpoint, partida automática com pausas por fase, conclusão e consulta histórica, exportação e recarga do histórico. Não houve erro JavaScript, arquivo ausente ou transbordamento horizontal da página. A primeira tentativa do executor de navegador encontrou uma restrição do ambiente; a conferência foi concluída no navegador local alternativo. O teste de checkbox foi ajustado para aguardar o salvamento assíncrono, sem alterar o comportamento do jogo.

Os fluxos de celular são emulação de viewport Chromium. Android físico e Safari/iOS permanecem fora desta homologação.

## Método das simulações

Foram combinados dois mapas × três adversários (atributos 45, 60 e 75) × dois elencos legais × quatro estratégias de ataque × quatro de defesa × dois lados iniciais = 384 partidas.

As sementes são determinísticas por combinação de planos e são reutilizadas nos lados pareados. Os pontos A/B alternam entre células da matriz. Os dois times usam o mesmo plano em cada célula; a compra automática segue a política existente. Os elencos não receberam treino. O limite foi de três pares de prorrogação, até 30 rodadas. Não houve empate nesta amostra. Esse desenho não testa exaustivamente todos os confrontos entre planos diferentes nem todos os complementos táticos.

| Mapa | Partidas | Rodadas | Vitórias da equipe do usuário | Rodadas vencidas pelo ataque | Plants | Desarmes |
|---|---:|---:|---:|---:|---:|---:|
| Doca | 192 | 3.255 | 57 | 54,38% | 1.202 | 174 |
| Cume | 192 | 3.286 | 60 | 52,92% | 1.121 | 123 |
| Total | 384 | 6.541 | 117 | 53,65% | 2.323 | 297 |

As vitórias da equipe do usuário misturam três níveis adversários e dois elencos. Não devem ser usadas como taxa de equilíbrio do mapa. Os percentuais do ataque são descritivos desta amostra, sem meta artificial de 50%.

| Mapa | Equipe do usuário inicia atacando | Equipe do usuário inicia defendendo |
|---|---:|---:|
| Doca | 32 vitórias / 96 partidas | 25 / 96 |
| Cume | 29 / 96 | 31 / 96 |

| Adversário | Partidas | Vitórias da equipe do usuário |
|---|---:|---:|
| Desenvolvimento — atributos 45 | 128 | 91 |
| Referência — atributos 60 | 128 | 24 |
| Experiente — atributos 75 | 128 | 2 |

| Elenco do catálogo | Custo salarial | Vitórias contra atributos 45 |
|---|---:|---:|
| J02, J24, J22, J05, J03 | 9.300 | 28 / 64 (43,75%) |
| J12, J09, J02, J05, J24 | 11.900 | 63 / 64 (98,44%) |

Os dois elencos respeitam o teto 12.000. A diferença observada não permite atribuir uma causa única: jogadores, atributos, agentes, familiaridades, funções e economia variam juntos. O feedback anterior sobre outros elencos contra atributos 45 não está resolvido por esta comparação. Recomenda-se investigá-lo separadamente antes de fechar o balanceamento do Beta 2.0.

Nos 6.541 rounds foram registrados 68.765 eventos de chegada, 667 bloqueios de movimento e 116.635 habilidades concluídas. As 32 habilidades tiveram uso registrado. Presença em uma amostra não substitui testes exaustivos de todas as interações.

## Correções e limites

As correções do pacote abrangem cadastro central dos mapas, alcance de Doca, aceitação dos IDs em saves/históricos, nomeação de áreas e associação das artes. Não se alteraram fórmulas de atributos, IA, custos de compra, tempos aprovados ou habilidades para perseguir uma taxa de vitória.

Permanecem para outras etapas: investigação aprofundada de balanceamento, teste em aparelhos físicos, evolução da interface completa NEXUS, calendário de 28 dias, treino diário e campeonato. O calendário deve usar quatro rodadas em Doca e três em Cume conforme a definição anterior, quando essa integração de progressão for implementada.

## Como organizar o GitHub

Recomendação: versionar cada pacote concluído em uma branch de desenvolvimento e fazer um lançamento público consolidado quando o Beta 2.0 inteiro estiver pronto. Isso permite acompanhar mudanças, executar testes por etapa e reverter problemas de forma localizada.

| Etapa | Onde registrar | Efeito no jogo publicado |
|---|---|---|
| Mapas integrados e testados | Branch de desenvolvimento; commit próprio | Nenhum, se mantido o fluxo de publicação atual |
| Calendário e treino diário | Novos commits na mesma linha de desenvolvimento | Nenhum |
| Progressão e campeonato | Novos commits e validação integrada | Nenhum |
| Candidata completa | Revisão do conjunto, testes e cópia de segurança | Ainda sem lançamento |
| Lançamento autorizado | Merge para a branch de publicação e versão identificada | Atualiza o jogo público |

No repositório conferido, o workflow `pages.yml` publica automaticamente em pushes para `main`. Portanto, não se deve integrar código de desenvolvimento diretamente em `main` enquanto o lançamento não estiver autorizado. Foi preparado um workflow separado, com permissão de leitura e sem etapa de deploy, para validar esta branch quando ela for enviada ao GitHub. Esse workflow foi preparado; nenhuma execução remota é reivindicada neste relatório.

O repositório atual é público. Uma branch de desenvolvimento também deixa o código e as artes visíveis para quem acessa o repositório, embora não atualize o jogo no Pages. Se a intenção for manter os novos conteúdos em sigilo até o lançamento, o desenvolvimento deve ficar localmente ou em repositório privado separado. Este pacote permaneceu local para deixar essa escolha em aberto.

É possível reunir tudo localmente e enviar de uma vez, mas isso concentra riscos de integração e dificulta rastrear a origem de erros. O melhor arranjo para este projeto é desenvolvimento incremental e lançamento público unificado.

Referências oficiais: [fontes de publicação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) e [visibilidade de repositórios](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories).

## Arquivos técnicos e reprodução

| Arquivo | Finalidade |
|---|---|
| `src/maps.ts` | Catálogo, setores, tempos e perfis de alcance |
| `src/rules.ts` / `src/tactical-types.ts` | IDs, grafo e integração de alcance |
| `lib/game.ts` / `lib/insights.ts` | Validação, saves e nomes das áreas |
| `app/tactical-map.tsx` | Arte, seleção de setores e indicadores |
| `public/maps/doca.png` / `cume.png` | Artes aprovadas, preservadas |
| `test/maps-integration.test.ts` | Regressões específicas |
| `scripts/maps-validation.ts` | Matriz reproduzível de 384 partidas |
| `validation/maps/results.json` | Resultados completos com sementes e parâmetros |
| `scripts/maps-browser-fixtures.ts` / `maps-browser.mjs` | Fluxos de navegador local |
| `validation/maps/browser/results.json` | Evidências dos quatro cenários de interface |
| `.github/workflows/maps-development.yml` | Validação futura no GitHub, sem deploy |

Com Node 24 e dependências instaladas: `npm test`, `npm run typecheck`, `node scripts/maps-validation.ts`, `PAGES_BASE_PATH=/esports-manager npm run build` e `PAGES_BASE_PATH=/esports-manager node scripts/check-export.ts`. Para o navegador, gerar as fixtures, servir a exportação sob `/esports-manager`, instalar Chromium/Playwright e executar o runner conforme o workflow fornecido.

Fontes visuais: [pasta Mapas aprovada no Drive](https://drive.google.com/drive/folders/12XGLLRSI4YU-BQzJHxpj3qWfO6UoRcRB), arquivos `NEXUS_DOCA_Mapa_Aprovado.png` e `NEXUS_CUME_Mapa_Aprovado_MID_Revisado.png`.

Próximo pacote: calendário de 28 dias e treinamento diário, preservando as definições aprovadas e mantendo o Beta 1.3 publicado até autorização de lançamento.
