# NEXUS — Beta 2.1.4

NEXUS é um jogo de gerenciamento de equipe de FPS tático, com simulação de partidas, treinamento e circuito competitivo. O Beta 2.1.4 — Doca V2 e Arena Premium — tem identificador de produto `2.1.4`, motor **0.6.1**, regras `nexus-2.0-doca-v2-r2` e saves de **schema 6**. Os identificadores mecânicos permanecem distintos da versão do produto para preservar a reprodução dos registros.

[Jogar](https://lordyask.github.io/esports-manager/) · [Notas do Beta 2.1.4](docs/BETA_2_1_4_NOTAS.md) · [Doca V2 e validação](docs/DOCA_V2_VALIDACAO.md) · [Backup e saves antigos](docs/BETA_2_0_SAVES.md) · [Histórico](CHANGELOG.md)

## Novidades

Na Preparação, os cinco titulares do próximo adversário aparecem primeiro, com país, função, agente, OVR e indicação do IGL. Os atributos detalhados ficam a um clique.

Em **Estratégias mais usadas**, selecione Ataque ou Defesa para consultar até três planos usados pelo clube nos confrontos já concluídos da carreira, inclusive entre NPCs. Cada round conta uma vez para o lado em que o adversário jogou.

## Recursos do beta

- Doca V2 como único mapa ativo em partidas e no circuito, com bases centrais, rotas independentes, galeria contínua e preparação de cinco segundos simulados.
- Troca de ataque e defesa a cada seis rodadas regulamentares; o reinício econômico permanece na rodada 13.
- Central de Comando Arena Premium com dados reais da carreira, controles existentes e adaptação para telas menores.
- Calendário de 28 dias com uma oportunidade diária de treino individual ou coletivo.
- Circuito de oito equipes e 28 partidas, com classificação, contratos, finanças e premiação.
- Prisma substitui Véu em campanhas novas; Prisma e Bastião têm habilidades revisadas.
- Reinício de carreira, histórico, análises e Acervo de versões anteriores.

Os adversários mantêm atributos fixos neste beta. A simulação usa áreas táticas, conexões de deslocamento e regras próprias de visão e disparo; a planta é esquemática. Vantagem ofensiva, coordenação das retomadas e economia continuam em avaliação. A amostra disponível não comprova equilíbrio global nem uma solução definitiva para Eco.

## Seus saves

Para perfis com progresso anterior ao Beta 2.1.2, a confirmação do reset único remove também os arquivos guardados no Acervo deste navegador. Os JSONs já exportados para o dispositivo permanecem disponíveis. Para consultar arquivos antigos, veja as [instruções de importação e backup](docs/BETA_2_0_SAVES.md).

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

O workflow `pages.yml` verifica e publica a partir de `main`; o procedimento está em [docs/PUBLICAR_GITHUB.md](docs/PUBLICAR_GITHUB.md). Resultados de testes locais e do GitHub Actions devem ser associados ao commit efetivamente verificado.

A revisão visual em largura móvel não substitui testes em Android físico ou Safari. A amostra de integração não certifica o equilíbrio global, e o navegador controla seus dados locais. O projeto é independente, com agentes e coeficientes fictícios.
