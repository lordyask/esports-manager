# NEXUS — Beta 2.0

NEXUS é um jogo de gerenciamento de equipe de FPS tático, com simulação de partidas, treinamento e circuito competitivo. Esta branch contém uma **candidata de desenvolvimento**, identificada como `2.0.0-doca-v2.dev.4`, com motor **0.6.1**, regras `nexus-2.0-doca-v2-r2` e saves de **schema 6**. Ela ainda não foi publicada.

[Jogo publicado (versão anterior)](https://lordyask.github.io/esports-manager/) · [Doca V2 e validação](docs/DOCA_V2_VALIDACAO.md) · [Ocupação defensiva](docs/OCUPACAO_DEFENSIVA.md) · [Backup e saves antigos](docs/BETA_2_0_SAVES.md) · [Histórico](CHANGELOG.md)

## Novidades

- Doca V2 como único mapa ativo em partidas e no circuito, com bases centrais, rotas independentes, galeria contínua e preparação de cinco segundos simulados.
- Troca de ataque e defesa a cada seis rodadas regulamentares; o reinício econômico permanece na rodada 13.
- Calendário de 28 dias com uma oportunidade diária de treino individual ou coletivo.
- Circuito de oito equipes e 28 partidas, com classificação, contratos, finanças e premiação.
- Prisma substitui Véu em campanhas novas; Prisma e Bastião têm habilidades revisadas.
- Reinício de carreira, histórico, análises e Acervo de versões anteriores.

Os adversários mantêm atributos fixos neste beta. A simulação usa áreas táticas, conexões de deslocamento e regras próprias de visão e disparo; a planta é esquemática. O equilíbrio continua em acompanhamento.

## Seus saves

**Antes de experimentar, exporte seu progresso no navegador antigo e guarde o JSON original.** Saves dos motores 0.3.0, 0.4.1, 0.5.0, 0.5.1 e 0.6.0 são preservados para consulta no Acervo mediante escolha explícita; partidas antigas não continuam no motor novo. Consulte as [instruções completas](docs/BETA_2_0_SAVES.md).

O progresso é salvo localmente no navegador e depende da origem do site. Não há conta nem sincronização entre dispositivos. O histórico ativo comporta até 20 partidas; o circuito preserva os próprios resultados.

## Executar localmente

Requer Node.js 24 LTS e npm:

```bash
npm ci
npm test
npm run typecheck
npm run dev
```

Abra o endereço informado pelo servidor. Para gerar a exportação estática em `out/`, execute `npm run build`. Para testar o subcaminho do GitHub Pages, use `PAGES_BASE_PATH=/esports-manager npm run build`. O worker exige uma página servida por HTTP(S).

## Validação e publicação

O workflow `doca-v2-check.yml` verifica esta branch sem publicar. `pages.yml` publica a partir de `main`; o procedimento está em [docs/PUBLICAR_GITHUB.md](docs/PUBLICAR_GITHUB.md). Resultados de testes locais e do GitHub Actions devem ser associados ao commit efetivamente verificado.

A revisão visual em largura móvel não substitui testes em Android físico ou Safari. A amostra de integração não certifica o equilíbrio global, e o navegador controla seus dados locais. O projeto é independente, com agentes e coeficientes fictícios.
