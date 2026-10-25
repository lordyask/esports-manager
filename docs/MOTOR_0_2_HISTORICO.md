# Esports Manager FPS Web — motor tático 0.2.0

> Documento histórico do motor 0.2.0. As instruções e a arquitetura abaixo
> descrevem aquela entrega, não o estado atual da aplicação. O Beta 1.0 já está
> publicado com motor 0.3.0, interface web, execução local e persistência no
> navegador. Consulte [o registro atual](REGISTRO_PROJETO.md),
> [o README](../README.md) e [a validação](../VALIDACAO_BETA.md).
> Os resultados e as decisões históricos foram preservados.

O motor executa rodadas e mapas autônomos de cinco contra cinco, com os oito agentes, 32 habilidades, economia individual, movimentação, informação e decisões táticas. Referência: GDD FPS Web 1.3, com AF01–AF03 e RV01–RV16 aprovados em 16/10/2026. Os personagens e parâmetros são do jogo fictício em desenvolvimento.

## Executar

Use Node.js 24 ou superior. Não há dependências a instalar para estas execuções:

```bash
npm test
npm run match
npm run benchmark
```

- `match` gera `match-result.json`, com partida completa, compras, acontecimentos, dados de reprodução e resumo.
- `benchmark` gera `benchmark-result.json`: 1.080 mapas sintéticos em 27 combinações de mapa e estratégia. São vinte pares de seeds por combinação, alternando o lado inicial. Pode levar alguns minutos.
- Caso um mapa ultrapasse o limite computacional inicial de 200 rodadas, o lote repete a mesma seed com limite de 2.000. Esses casos ficam em `extendedOvertime` e indicam necessidade de calibração; não recebem vencedor forçado. Isso não altera a regra da prorrogação nem cria limite de rodadas no campeonato.
- `demo` mantém a demonstração isolada dos primeiros núcleos, separada do mapa autônomo.

## Integração

Os pontos de entrada estão em `src/index.ts`. São funções de servidor. A aplicação deverá persistir cada resultado confirmado antes de apresentá-lo e expor ao navegador somente as informações permitidas para o usuário e o momento de exibição.

`simulateMap` atende scripts e lotes de teste. Na aplicação web, usar `beginRound`, `simulateRound` e `completeRound` para processar e persistir uma rodada por operação, com revisão e comando único. Não manter uma requisição aberta durante o mapa inteiro.

```ts
import {simulateMap} from './src/index.ts';
const game = simulateMap(profiles, {
  map: 'enlace', seed: 20261016,
  plans: {
    A: {attack: 'control', defense: 'balanced', site: 'A'},
    B: {attack: 'split', defense: 'retake', site: 'B'},
  },
});
```

`profiles` contém dez profissionais, cinco por equipe, com agentes únicos dentro de cada equipe. O resultado inclui a entrada original, seed, versões, hash do conteúdo, resultados das rodadas e placar final. Os perfis de demonstração são dados sintéticos de teste; não constituem os quinze adversários definitivos da carreira.

## Responsabilidades do código

| Arquivo | Aplicação |
| --- | --- |
| `abilities.ts` | Catálogo executável das 32 habilidades |
| `simulation.ts` | Eventos em ms, ações, visão, efeitos, disparos, dano e objetivo |
| `ai.ts` | Decisões sobre observação limitada às informações disponíveis |
| `autonomous.ts` | Mapa completo com compras e progressão de rodadas |
| `map.ts` | Placar, fases, troca de lados e prorrogação por pares |
| `combat.ts` | Atributos, modificadores, proteção e vida |
| `economy.ts` | Compras, preservação, ajuda de arma, recompensas e resets |
| `random.ts` | PRNG reproduzível e sequências separadas |
| `career.ts` | Núcleos de treino, moral e contabilidade contratual |
| `commands.ts` | Comandos únicos e revisão, testados em memória |
| `round.ts` | Núcleo anterior para cenários roteirizados e regressões |
| `data/catalog.json` | Os 24 candidatos e os pesos táticos aprovados |

## Comportamentos relevantes

- Disparos simultâneos são validados antes de aplicar dano; não há proteção artificial do vencedor. Dano antecede conclusão do objetivo.
- Interrupções e bloqueios visuais são resolvidos antes das demais ativações simultâneas. Dano criado por uma ativação é aplicado após esse grupo e antes de plant ou desarme.
- A IA recebe somente `Observation`. Posições não detectadas, compras ocultas, cargas inimigas, fila de eventos e PRNG não entram nessa observação. Uma ação inimiga em andamento pode ser observada quando existe visão.
- Revelação permite planejar e acompanhar setores, sem permitir tiros por fumaça. Marca tem prazo próprio e não é prolongada por contato visual comum.
- O IGL adapta o ponto usando presença observada e leitura. Utilitários, leitura e comunicação influenciam a preparação; entrosamento afeta uma única nota coletiva. Não há bônus adicional de função somado aos disparos.
- Ataque rápido, controle e pressão dividida mudam a rota e o momento de avanço. Defesa agressiva, equilibrada e retomada mudam posicionamento e reação ao plant. A política é inicial e precisa de avaliação humana e calibração.
- Plantar recebe prioridade quando o ponto está livre de inimigos locais e os aliados podem cobrir. Na retomada, confrontos em setor vizinho não impedem indefinidamente a aproximação ao objetivo.
- Mobilidade respeita ligações e bloqueios. Efeitos que expiram durante o trajeto recalculam o tempo restante. Uma barreira nova invalida a travessia bloqueada.
- Um jogador em travessia pode ser observado e atingido pelos extremos da conexão percorrida, respeitando fumaças; não recebe tiros por uma conexão diferente. Ao deixar o setor, ele sai das áreas e explosões desse setor. O movimento continua sujeito a tiros e não concede invulnerabilidade.
- A defesa de retomada mantém um jogador de contenção em cada ponto e uma reserva central de três, para reagir ao objetivo sem concentrar os cinco na base.
- Alarmes e armadilhas permanecem após a morte do criador até acionamento, destruição ou fim da rodada. Áreas e explosivos já colocados mantêm suas durações.
- A IA compra conforme o que falta, considerando equipamento preservado. A abertura da segunda metade usa os 1.000 reiniciados e o plano Eco. Precisão pode ser indicada no perfil e mantém o preço da principal.
- Proteção temporária expira e não repara proteção comprada. Vida, dano e proteção do combate usam centésimos: 10.000 representa 100 de vida. `Account.shield` usa pontos de proteção e é convertido na fronteira do combate.
- O limite de processamento retorna erro numa simulação anormal. Não força vencedor nem persiste partida incompleta como resultado de carreira.

## Limites de modelagem e entrega

O espaço é um grafo de cinco setores. Visão entre setores adjacentes depende das conexões e dos bloqueios. Não há coordenadas, ângulos, cobertura física ou trajetória de projétil. Alvos empatados dentro do mesmo setor são ordenados por ID; o modelo ainda não mede distância física até a entrada dentro do setor. Destruição e travessia usam ações contínuas e tempos abstratos.

O entrosamento coletivo recebe uma média por equipe, com padrão inicial 50. A carreira deverá calcular os pares participantes antes de fornecer esse valor. Ainda não há gerenciador completo de treino ou calendário.

Testes de execução não equivalem a aprovação de balanceamento. A política da IA é inicial. Ainda faltam interface, autenticação, Supabase, RLS, carreira completa e publicação na Vercel. `MemoryCommands` demonstra idempotência em memória; a persistência transacional real continua pendente.

Os resultados detalhados são privados ao servidor. Não enviar a resposta integral de `simulateMap` ao navegador durante uma partida: ela contém estados e acontecimentos calculados para diagnóstico.

A execução usa o suporte nativo do Node a TypeScript. A verificação estática com `tsc` deverá integrar o pipeline web; não estava disponível neste ambiente.

## Continuidade

Os resultados estão em `VALIDACAO.md`, `test-results.tap` e `benchmark-result.json`. Restaure o histórico com `git clone source-history.bundle projeto`. O próximo marco é a tela de partida de teste, conectada ao motor no servidor, para avaliar compras, instruções, acompanhamento e relatórios antes de integrar a carreira.
