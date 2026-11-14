# NEXUS — Beta 2.0

NEXUS é um jogo de gerenciamento de equipe de FPS tático, com simulação de partidas, treinamento e circuito competitivo. Esta versão usa a identificação `2.0.0`, motor **0.5.1**, regras `nexus-2.0-reworks-r1` e saves de **schema 6**.

[Abrir o jogo](https://lordyask.github.io/esports-manager/) · [Notas da versão](docs/BETA_2_0_NOTAS.md) · [Backup e saves antigos](docs/BETA_2_0_SAVES.md) · [Validação da candidata](docs/BETA_2_0_RC1_VALIDACAO.md) · [Histórico](CHANGELOG.md)

## Novidades

- Identidade visual NEXUS, catálogo e artes dos oito agentes, e mapas Doca e Cume.
- Calendário de 28 dias com uma oportunidade diária de treino individual ou coletivo.
- Circuito de oito equipes e 28 partidas, com classificação, contratos, finanças e premiação.
- Prisma substitui Véu em campanhas novas; Prisma e Bastião têm habilidades revisadas.
- Reinício de carreira, histórico, análises e Acervo de versões anteriores.

Os adversários mantêm atributos fixos neste beta. A simulação opera por setores; coberturas desenhadas nos mapas são visuais. O equilíbrio continua em acompanhamento.

## Seus saves

**Antes de atualizar, exporte seu progresso no navegador antigo e guarde o arquivo JSON original.** Saves do Beta 1.x e do motor 0.5.0 ficam no Acervo para consulta e exportação; eles não continuam uma campanha ativa com as regras novas. Saves 0.5.1/schema 6 com a mesma revisão mecânica, incluindo a RC1, são compatíveis. Consulte as [instruções completas](docs/BETA_2_0_SAVES.md).

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

O workflow `beta20-candidate.yml` verifica testes, saves, reworks, circuito e exportações na raiz e no subcaminho. O workflow `pages.yml` publica a partir de `main`; o procedimento está em [docs/PUBLICAR_GITHUB.md](docs/PUBLICAR_GITHUB.md). Resultados de testes locais e do GitHub Actions devem ser associados ao commit efetivamente verificado.

A revisão visual em largura móvel não substitui testes em Android físico ou Safari. A amostra de integração não certifica o equilíbrio global, e o navegador controla seus dados locais. O projeto é independente, com agentes e coeficientes fictícios.
