# Esports Manager — Beta 1.0

Beta de teste de partida publicado no GitHub Pages. Motor 0.3.0; regras aprovadas do GDD FPS Web 1.3. Interface em português, Next.js/React/TypeScript com exportação estática. O pacote inicial foi identificado como RC1; o nome público da aplicação é Beta 1.0. Este projeto é independente e usa personagens e coeficientes fictícios.

**Status atualizado em 24/10/2026:** publicado e em avaliação. [Abrir o Beta](https://lordyask.github.io/esports-manager/) · [Repositório](https://github.com/lordyask/esports-manager).

O GitHub executou testes, TypeScript, build e publicação com sucesso. No Chrome do ambiente de verificação foram exercitados elenco, preparação, uma partida completa, relatório e recuperação do progresso após recarga. Um salvamento e um diagnóstico de Chrome Android também foram analisados: as 15 rodadas foram reproduzidas sem divergência. Isso não representa homologação completa de aparelhos, navegadores ou equilíbrio competitivo.

O [registro consolidado do projeto](docs/REGISTRO_PROJETO.md) reúne decisões, entregas e pendências. Consulte também [validação](VALIDACAO_BETA.md), [checklist manual](docs/CHECKLIST_BETA.md) e [histórico de alterações](CHANGELOG.md). O Beta 1.1 está em planejamento; seu escopo ainda depende dos feedbacks e da aprovação do autor.

## O que foi implementado

- Elenco: 24 candidatos aprovados; exatamente cinco; teto salarial mensal de 12.000; saldo inicial informativo de 30.000. Salários não são descontados no modo isolado de partida.
- Organização: nome, sigla, cor e três escudos predefinidos.
- Composição: cinco agentes diferentes, familiaridades 85/65/45/10, atribuição de responsabilidades e IGL escolhido pelo treinador.
- Simulação: o mesmo motor determinístico roda em Web Worker; cada rodada possui um código e usa seed estável. Velocidade de exibição não muda o cálculo.
- Compras: Eco/Semi/Forte por jogador, equipamento preservado, ajuda entre jogadores após reservar as compras próprias, custo e saldo; valores aprovados preservados.
- Partida: cenário, adversários sintéticos de atributos 45/60/75, planos de ataque/defesa, acompanhamento por rodada, sequência automática e pausa.
- Salvamento: IndexedDB transacional com revisão global, conferência de versões, exportação/importação JSON e diagnóstico. Um progresso ativo por navegador/origem.
- Relatório: eliminações, mortes, primeira eliminação/morte registrada, trades, habilidades concluídas, plants, desarmes e gastos reais registrados.
- GitHub Actions: testes e TypeScript antes do build; publicação pelo Pages com o caminho do repositório configurado automaticamente.
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

O repositório de destino é `lordyask/esports-manager`, branch `main`, com Pages configurado para GitHub Actions. O site já está publicado. O procedimento de manutenção e a referência para novas instalações estão em [docs/PUBLICAR_GITHUB.md](docs/PUBLICAR_GITHUB.md).

## Avaliação

Siga `docs/CHECKLIST_BETA.md`. O lote controlado pode ser reproduzido com:

```bash
npm run benchmark:controlled
```

Ele conclui 1.080 mapas: três cenários × três planos de ataque × três de defesa × vinte pares de seeds com lado inicial trocado. Composição, atributos e condições ficam fixos. Resultados em `validation/controlled-current.json`. A opção de comparação histórica `--baseline` exige disponibilizar a versão anterior em `/tmp/esports-baseline`; não faz parte da execução normal do aplicativo.

O lote antigo `npm run benchmark` continua disponível para regressão, mas varia composição entre grupos e não serve para isolar o efeito de cada estratégia. Detalhes do motor anterior estão em `docs/MOTOR_0_2_HISTORICO.md` e são histórico: a arquitetura de servidor descrita ali foi temporariamente substituída pelo Beta local aprovado.

## Limites atuais

- Esta entrega testa a partida. Calendário, campeonato de carreira, treinamento, evolução, folha salarial em operação e autenticação não estão conectados.
- A escolha do IGL participa das chamadas de controle; Main OP define a preparação interna de precisão. As demais responsabilidades são indicações de escalação, com aptidões visíveis; ainda não têm todas as políticas específicas de Entry/Second/Support/Anchor/Lurker implementadas. Classes e habilidades dos agentes já participam da simulação.
- Potencial é informação de contratação, sem força imediata ou crescimento nesta partida. Mental exibido vem dos atributos; as condições de teste começam com moral 70, fadiga 10 e familiaridade de mapa 50.
- A navegação tem cinco setores abstratos. Não modela coordenadas/ângulos/cobertura física; desempates de alvo ainda usam ID. Não há mapa visual ou apresentação de armas individuais.
- Relatório mostra acontecimentos, sem atribuir uma causa que não possa ser demonstrada. Uma primeira eliminação não mede sozinha a qualidade de uma entrada.
- Há desequilíbrios entre mapas/planos e agentes ainda em avaliação. Execução concluída não significa balanceamento competitivo aprovado.
- Banco local pode ser apagado ao limpar dados do navegador; navegação privada, outro navegador ou outro domínio podem usar armazenamento diferente. Exporte o progresso antes de mudar de dispositivo ou origem.
- Arquivos identificam versão e integridade. Isso não autentica resultados: o usuário controla o próprio navegador e pode alterar dados locais. A produção deverá voltar a um servidor autoritativo.
- Não há migração automática de saves de outra versão do motor. Arquivos incompatíveis são rejeitados sem sobrescrever o progresso existente.
- A sequência automática pausa após 30 rodadas por interação para manter controle do usuário. Isso não é um limite da partida: continue a sequência para concluir a prorrogação. Nenhum vencedor é forçado.

## Organização do código

`src/`: motor; `lib/game.ts`: sessão portátil, compras, checkpoints e estatísticas; `lib/worker.ts`: protocolo de cálculo; `lib/storage.ts`: persistência IndexedDB; `app/`: telas e estilo; `test/`: regressões; `validation/`: evidências; `docs/`: publicação e avaliação.

O motor deve continuar independente da interface. Supabase/Vercel continuam como direção futura aprovada; não estão ativos no Beta 1.0 e não foram incluídos automaticamente no Beta 1.1. A futura integração deverá substituir o adaptador local pelo servidor e salvar resultados autorizados em transação; não confiar nos dados enviados pelo navegador.
