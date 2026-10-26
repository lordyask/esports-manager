# Beta 1.1 — validação inicial de 25/10/2026

Data: 25/10/2026. **Registro histórico da implementação 0.4.0. A revisão atual está em [LANCAMENTO_BETA_1_1_RC1.md](LANCAMENTO_BETA_1_1_RC1.md).** Branch `beta/1.1`. Motor/pacote 0.4.0, schema 2. **Não publicado.**
B11-01 a B11-14 estão aprovados. A implementação está disponível para revisão;
a liberação ainda depende de correções, homologação e autorização posterior.

## Conclusão

O fluxo integrado de partida, treino e agentes funciona nos testes e na prévia
estática local. A versão **não está pronta para lançamento**: Enlace continua
fortemente favorável à defesa e há prorrogações excessivamente longas. Também
faltam homologação em Android físico e uma matriz mais ampla de atributos e
complementos. Não interpretar testes verdes como equilíbrio competitivo.

## Verificação automatizada e builds

- 88 testes aprovados, zero falhas (`validation/beta11/tests.tap`).
- TypeScript sem erros; build estático concluído na raiz e em `/esports-manager`.
- `scripts/check-export.ts`: referências de marca, manifesto e worker conferidas
  nos dois caminhos; 20 arquivos JavaScript em cada exportação.
- Testes incluem XP, faixas, limites, sessão única, agentes, preservação de perfis
  antigos, importação explícita, recibos inválidos, persistência transacional,
  decisões táticas e revisão factual. Renomear todos os IDs preservou eventos,
  decisões, estado e resultado no cenário de regressão.
- O workflow `beta-check.yml` testa e compila esta branch sem tarefa de deploy.
  O workflow de Pages permanece restrito a `main`/acionamento manual.

## Navegação observada

Chrome do ambiente de verificação; exportação estática servida localmente,
com caminho `/esports-manager/`. Dados sintéticos e elenco de 7.900 de salário:
Drift, Pingo, Nimbo, Lume e Cedro.

- [x] Selecionar cinco, sugerir composição e abrir treino.
- [x] Prévia de treino de Mira, confirmar, recarregar e conferir XP sem segunda sessão.
- [x] Voltar à preparação sem perder o treino confirmado.
- [x] Escolher Finta, misturar Semi/Forte/Eco com controles habilitados e executar
  exatamente uma rodada. Exportação confirmou compras, plano e complemento;
  gasto real de 4.200, com aviso de pacote parcial.
- [x] Conferir análise pós-rodada e consulta de histórico.
- [x] Sequência opcional interrompida exatamente após a rodada 12; economia
  reiniciada e apenas estratégias de defesa disponíveis para a rodada 13.
- [x] Escolher Leitura e resposta com rotação cautelosa; concluir partida 13–5.
- [x] Nova partida preserva XP e libera uma sessão; prévia de Mira mostra ganho
  de ponto para quatro jogadores e excedente de XP correto.
- [x] Treinar Estalo para os cinco (repetição permitida no treino); recarregar
  e conferir familiaridades 85/66/12/12/12 e XP 108/29/12/16/40.
- [x] Importar pela interface a exportação sintética 1.1: confirmação exibida,
  placar 1–0, compras mistas e preparação recuperados sem repetir o treino.
- [x] Duas abas: gravação da aba antiga rejeitada com orientação de recarregar,
  sem substituir o estado mais recente.
- [x] Catálogo de oito agentes consultado em iframe de 390 px; corpo com 375 px
  úteis e sem excesso de largura observado nessa tela. Menu e treino acessíveis.
- [ ] Chrome Android físico, toque, teclado virtual, importação/exportação e atalho.
- [ ] Safari/iOS, acessibilidade por teclado e leitores de tela.
- [ ] Prorrogação e todos os complementos exercitados pela interface em celular.

A área estreita é um teste de layout, não emulação completa nem homologação de
aparelho. Não foram publicados saves ou diagnósticos brutos de avaliadores.

## Lotes de estratégias

Cada célula mantém atributos 60, familiaridade 85, demais condições fixas e o
mesmo par de planos nos dois lados. Foram usadas duas composições simétricas que
cobrem os oito agentes. Três mapas × quatro ataques × quatro defesas × duas
composições × seeds × lados iniciais trocados. Os complementos ficam sem seleção;
os testes de decisão não substituem um lote fatorial de complementos.

O exploratório usa dois pares por célula; a confirmação usa um novo par, com
seeds não usadas na alteração final. É pouca repetição para estimar cada célula
com precisão; as rodadas dentro da mesma partida não são amostras independentes.

| Lote final | Mapas | Rodadas | Maior partida | Erros de execução |
| --- | ---: | ---: | ---: | ---: |
| Exploratório | 384 | 11.209 | 204 | 0 |
| Novas seeds | 192 | 6.016 | 246 | 0 |

Percentual de rodadas vencidas pelo ataque:

| Mapa | Exploratório inicial 1.1 | Exploratório final 1.1 | Novas seeds finais |
| --- | ---: | ---: | ---: |
| Pátio | 42,12% | 44,00% | 42,76% |
| Horizonte | 23,25% | 26,50% | 26,77% |
| Enlace | 11,38% | 9,24% | 7,67% |

O lote inicial está em `validation/beta11/initial/`. Após ele, foi ajustada a
entrada com apoio próximo: Entry pode contestar a rota ameaçada e Second acompanha
sua movimentação. O ajuste tem teste de decisão e **não melhorou o equilíbrio
global**: Enlace piorou nesta comparação. Os dados foram preservados, incluindo
um lote inicial de novas seeds; as seeds finais são distintas das usadas ali.

Não comparar diretamente estes agregados com o antigo lote 0.3.0: composição,
responsabilidades e grade de planos mudaram. Não foi imposta taxa de 50%, bônus
de vitória ou limite artificial de rodadas. O limite técnico de 500 no script
é proteção do lote, não regra do jogo; nenhuma partida final o atingiu.

Arquivos finais: `validation/beta11/exploratory.json` e `holdout.json`.
SHA-256 da política `src/ai.ts` usada nos dois lotes finais:
`1f68e25815a0d1b45782e47cf3f6af0281d6d17071fb377ea12419031f5159eb`.

## Compatibilidade e alcance

O Beta 1.1 usa banco IndexedDB distinto; não lê nem sobrescreve automaticamente
o banco 1.0. Importar arquivo 0.3.0 é uma decisão explícita: organização começa
com XP zero e o relatório antigo é um retrato somente para consulta. A partida
antiga não é continuada nem recalculada. O arquivo original deve ser preservado.

Os testes exercitam o formato antigo com fixtures sintéticas, inclusive rejeição
por integridade. Ainda é necessário homologar a migração pela interface com
amostra real de arquivos 1.0, sem publicar os dados pessoais. Não anunciar
compatibilidade irrestrita antes dessa avaliação.

Os preços, rendimentos, limites financeiros, salários e coeficientes de combate
não foram alterados para perseguir determinada taxa. Potencial e curvas de XP
seguem a especificação aprovada; a calibração de evolução ao longo de muitas
partidas ainda está pendente. Main OP mantém a preparação de precisão e a
posição inicial por função; não foi criado um sistema físico de ângulos de sniper.

## Pendências antes de propor liberação

1. Investigar Enlace e os casos de 204/246 rodadas, preservando as condições e
   inspecionando a execução do objetivo. Submeter mudanças materiais de regras
   ou coeficientes à aprovação antes de incorporá-las.
2. Ampliar comparação para atributos 45/60/75, diferenças entre equipes,
   complementos e evolução em múltiplas partidas. Não prometer chances de 1/3 ou 1/6.
3. Refinar avisos de composição e detalhes dos componentes incompletos do pacote;
   a tela atual distingue parcial/completo e exibe os gastos, mas não discrimina
   cada componente ausente. Não adicionar seleção individual de armas/coletes/skills.
4. Homologar importação real, controles e recuperação em Chrome Android físico.
5. Revisar os resultados com o autor e solicitar autorização de lançamento
   somente quando houver uma versão candidata concreta e validada.

Beta 1.x permanece concentrado nesses sistemas. Novos conteúdos do Beta 2.0 não
foram antecipados nesta implementação.
