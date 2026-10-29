# Esports Manager — Beta 1.3

**Beta 1.3 experimental — lançamento autorizado, publicação em andamento.** Histórico de partidas com exportação JSON/CSV, sementes automáticas, análise pós-partida e treino individual/coletivo. [Escopo, testes e pendências](docs/BETA_1_3_RC1.md).

Motor **0.4.1**, regras `gdd-1.3+b11-rc1`, save schema **3**, com leitura do schema 2. O banco local é preservado; saves exportados pelo 1.3 não devem ser reimportados no 1.1.1.

[Abrir o jogo](https://lordyask.github.io/esports-manager/) · [Registro do projeto](docs/REGISTRO_PROJETO.md) · [Validação 1.3](docs/BETA_1_3_RC1.md) · [Histórico](CHANGELOG.md).

Validação da candidata: 113 testes, 9.159 sessões sintéticas de treino, 72 partidas sintéticas e fluxos Chromium desktop/móvel aprovados no [workflow de revisão](https://github.com/lordyask/esports-manager/actions/runs/40720519242). Android físico, Safari/iOS, acessibilidade completa e equilíbrio global permanecem sem homologação.

Interface em português, Next.js/React/TypeScript com exportação estática. Projeto independente, com agentes e coeficientes fictícios. Preços e rendimentos permanecem os aprovados no GDD FPS Web 1.3, com o [adendo aprovado do Beta 1.1](docs/BETA_1_1_PROPOSTA.md).

## Histórico: correção Beta 1.1.1

T01–T05 aprovados: escolhas de atributo e agentes salvas automaticamente, preservadas ao trocar de aba e recarregar. A tela mostra função, IGL, agente escalado, atributos atuais e familiaridades. Treinar um agente não muda a escalação. O rascunho não consome a sessão. Veja [validação e lançamento 1.1.1](docs/BETA_1_1_1.md).

Motor 0.4.1, regras e schema 2 preservados: o save 1.1 continua compatível. Sem ajuste de XP ou de balanceamento.

## Histórico: novidades do Beta 1.1

- Uma rodada por confirmação; sequência opcional que pausa na troca de lados e na entrada da prorrogação.
- Quatro estratégias de ataque, quatro de defesa e complementos compatíveis, com objetivo, força e vulnerabilidade explicados.
- Responsabilidades participam da movimentação; desempates táticos não usam o nome/ID do jogador como preferência.
- Compras Eco/Semi/Forte individuais sempre editáveis na preparação normal, sugestão editável e aplicação aos cinco. Saldos, gasto próprio, ajuda e equipamento preservado visíveis.
- Análise pós-rodada com condição de encerramento, fatos observados e cronologia consultável. Sem apresentar correlação como causa comprovada.
- Uma sessão coletiva opcional por partida completa: atributo dos cinco ou agentes escolhidos individualmente. XP separado, excedente preservado, potencial e limites aprovados.
- Catálogo dos oito agentes, classes, habilidades, limitações e familiaridades dos titulares.
- Nova partida preserva o elenco e o desenvolvimento. Reiniciar organização é uma ação distinta, com confirmação.
- Importação explícita de organização do motor 0.3.0 com XP zero; relatório antigo somente para consulta. A partida antiga não continua no novo motor. Preserve o arquivo original.
- Workflow de verificação da branch sem tarefa de deploy. A publicação ocorre pelo workflow de `main`.

## O que foi implementado

- Elenco: 24 candidatos aprovados; exatamente cinco; teto salarial mensal de 12.000; saldo inicial informativo de 30.000. Salários não são descontados no modo isolado de partida.
- Organização: nome, sigla, cor e três escudos predefinidos.
- Composição: cinco agentes diferentes, familiaridades 85/65/45/10, atribuição de responsabilidades e IGL escolhido pelo treinador.
- Simulação: o mesmo motor determinístico roda em Web Worker; cada rodada possui um código e usa seed estável. Velocidade de exibição não muda o cálculo.
- Compras: Eco/Semi/Forte por jogador, equipamento preservado, ajuda entre jogadores após reservar as compras próprias, custo e saldo; valores aprovados preservados.
- Partida: cenário, adversários sintéticos de atributos 45/60/75, planos de ataque/defesa, acompanhamento por rodada, sequência automática e pausa.
- Salvamento: IndexedDB transacional com revisão global, conferência de versões, exportação/importação JSON e diagnóstico. Um progresso ativo por navegador/origem.
- Relatório: eliminações, mortes, primeira eliminação/morte registrada, trades, habilidades concluídas, plants, desarmes e gastos reais registrados.
- GitHub Actions: testes e TypeScript antes do build; a branch de revisão valida sem publicar; `main` executa o deploy autorizado.
- Identidade visual: marca EM aprovada, assinaturas SVG para fundos claros/escuros, aplicação no menu e rodapé, favicon e ícones Android/iOS com manifesto de atalho. Sem funcionamento offline.

## Executar no computador

Requer Node.js 24 LTS e npm. Na pasta extraída:

```bash
npm ci
npm test
npm run typecheck
npm run dev
```

Abra o endereço que o comando informar. O script de desenvolvimento usa a porta 4173. Não abra `index.html` com duplo clique: o worker exige uma página servida por HTTP(S).

Para gerar o site:

```bash
npm run build
```

Os arquivos estáticos ficam em `out/`. Para um caminho de projeto do GitHub, o build recebe `PAGES_BASE_PATH=/nome-do-repositorio`; no GitHub Actions isso é automático. O pacote de código não depende de Supabase nem Vercel nesta etapa.

## Publicação

O repositório é `lordyask/esports-manager`. `main` publica pelo GitHub Actions; o autor autorizou expressamente o lançamento do Beta 1.3 após o parecer de validação. A candidata foi preparada em `review/beta-1.3`. O procedimento de manutenção e a referência para novas instalações estão em [docs/PUBLICAR_GITHUB.md](docs/PUBLICAR_GITHUB.md).

## Avaliação

Os resultados atuais estão em [docs/BETA_1_3_RC1.md](docs/BETA_1_3_RC1.md). As validações anteriores permanecem como histórico. Para reproduzir os lotes de planos do Beta 1.1:

```bash
node scripts/beta11-validation.ts
node scripts/beta11-validation.ts --holdout
```

O primeiro executa 384 mapas; o segundo, 192 com novas seeds. Os JSON em `validation/beta11/rc1/` preservam composição, plano, lado e resultado. Não abrangem exaustivamente complementos nem todos os níveis de atributos.

`npm run benchmark:controlled` e `npm run benchmark` continuam como ferramentas históricas de regressão. Seus desenhos diferem do lote 1.1; não comparar taxas agregadas como se isolassem o efeito desta alteração.

## Limites atuais

- Esta entrega testa partida, treino e agentes. Calendário, campeonato de carreira, folha salarial em operação e autenticação não estão conectados.
- A escolha do IGL participa das chamadas de controle; Main OP define a preparação interna de precisão. Entry/Second/Support/Anchor/Lurker têm tendências de decisão implementadas, ainda em calibração. As aptidões do catálogo exibidas como referência inicial não são uma previsão de estatística individual. Classes e habilidades dos agentes já participam da simulação.
- Potencial regula XP por sessão e o teto da média dos atributos; não aumenta por treino nem concede força direta adicional na rodada. Mental exibido vem dos atributos; as condições de teste começam com moral 70, fadiga 10 e familiaridade de mapa 50.
- A navegação tem cinco setores abstratos. Não modela coordenadas/ângulos/cobertura física; a ordenação tática usa situação, agente e seed; não o ID como preferência. Não há mapa visual ou apresentação de armas individuais.
- Relatório mostra acontecimentos, sem atribuir uma causa que não possa ser demonstrada. Uma primeira eliminação não mede sozinha a qualidade de uma entrada.
- Equilíbrio entre mapas/planos e agentes permanece em avaliação; Horizonte ainda favoreceu a defesa. Execução concluída não significa balanceamento competitivo aprovado.
- Banco local pode ser apagado ao limpar dados do navegador; navegação privada, outro navegador ou outro domínio podem usar armazenamento diferente. Exporte o progresso antes de mudar de dispositivo ou origem.
- Arquivos identificam versão e integridade. Isso não autentica resultados: o usuário controla o próprio navegador e pode alterar dados locais. A produção deverá voltar a um servidor autoritativo.
- O banco local 1.1 é separado do 1.0. A importação do formato 0.3.0 é explícita e preserva apenas a organização e um relatório histórico; não retoma nem recalcula a partida antiga. Arquivos inválidos são rejeitados antes da gravação.
- O Beta 1.1 admite até três pares de prorrogação, com empate se a igualdade persistir na rodada 30. L02 foi aprovada em 26/10/2026; resultados antigos não são recalculados.

## Organização do código

`src/`: motor; `lib/game.ts`: sessão portátil, compras, checkpoints e estatísticas; `lib/worker.ts`: protocolo de cálculo; `lib/storage.ts`: persistência IndexedDB; `app/`: telas e estilo; `test/`: regressões; `validation/`: evidências; `docs/`: publicação e avaliação.

O motor deve continuar independente da interface. Supabase/Vercel continuam como direção futura aprovada; não estão ativos no Beta 1.0 e não foram incluídos automaticamente no Beta 1.1. A futura integração deverá substituir o adaptador local pelo servidor e salvar resultados autorizados em transação; não confiar nos dados enviados pelo navegador.

A série Beta 1.x concentra estes sistemas. Beta 2.0 é a direção futura para novos conteúdos; não há catálogo de adições aprovado.
